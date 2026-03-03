/**
 * OCR Service
 *
 * Handles image-to-text extraction using Tesseract.js,
 * prescription text cleaning/normalization, and structured
 * medication parsing for integration with the AI/CDSS module.
 *
 * @module modules/ocr/service
 */

const Tesseract = require('tesseract.js');
const path = require('path');

// ============================================================================
// MEDICATION DATABASE (for fuzzy matching cleaned text)
// ============================================================================

const KNOWN_MEDICATIONS = [
    // Diabetes
    'metformin', 'glipizide', 'glyburide', 'insulin', 'sitagliptin',
    'empagliflozin', 'dapagliflozin', 'canagliflozin', 'pioglitazone',
    'liraglutide', 'semaglutide', 'dulaglutide',
    // Hypertension
    'lisinopril', 'amlodipine', 'losartan', 'valsartan', 'metoprolol',
    'atenolol', 'hydrochlorothiazide', 'furosemide', 'spironolactone',
    'ramipril', 'enalapril', 'nifedipine', 'diltiazem',
    // Heart
    'aspirin', 'clopidogrel', 'warfarin', 'rivaroxaban', 'apixaban',
    'atorvastatin', 'rosuvastatin', 'simvastatin', 'digoxin',
    // Respiratory
    'salbutamol', 'albuterol', 'fluticasone', 'montelukast',
    'ipratropium', 'budesonide', 'prednisone', 'prednisolone',
    // General
    'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
    'ibuprofen', 'acetaminophen', 'paracetamol', 'omeprazole',
    'pantoprazole', 'ranitidine', 'cetirizine', 'loratadine',
    'gabapentin', 'pregabalin', 'levothyroxine',
];

// Common dosage patterns
const DOSAGE_PATTERNS = [
    /(\d+\.?\d*)\s*(mg|mcg|ml|g|iu|units?)/gi,
    /(\d+)\s*[-\/]\s*(\d+)\s*(mg|mcg|ml|g)/gi,
];

// Common frequency/schedule patterns
const FREQUENCY_PATTERNS = [
    { pattern: /once\s*(a\s*)?daily|od|q\.?d\.?|qd/gi, normalized: 'Once daily' },
    { pattern: /twice\s*(a\s*)?daily|bid|b\.?i\.?d\.?/gi, normalized: 'Twice daily' },
    { pattern: /three\s*times\s*(a\s*)?daily|tid|t\.?i\.?d\.?/gi, normalized: 'Three times daily' },
    { pattern: /four\s*times\s*(a\s*)?daily|qid|q\.?i\.?d\.?/gi, normalized: 'Four times daily' },
    { pattern: /every\s*(\d+)\s*hours?|q(\d+)h/gi, normalized: 'Every $1 hours' },
    { pattern: /at\s*bedtime|hs|h\.?s\.?|nocte/gi, normalized: 'At bedtime' },
    { pattern: /before\s*meals?|ac|a\.?c\.?/gi, normalized: 'Before meals' },
    { pattern: /after\s*meals?|pc|p\.?c\.?/gi, normalized: 'After meals' },
    { pattern: /as\s*needed|prn|p\.?r\.?n\.?/gi, normalized: 'As needed' },
    { pattern: /with\s*food/gi, normalized: 'With food' },
    { pattern: /morning/gi, normalized: 'Morning' },
    { pattern: /evening|night/gi, normalized: 'Evening' },
];

// Known ICD-10 diagnosis patterns
const DIAGNOSIS_CODE_PATTERNS = [
    /\b(E1[0-4])\b/gi,  // Diabetes
    /\b(I1[0-5])\b/gi,  // Hypertensive diseases
    /\b(I50)\b/gi,       // Heart failure
    /\b(J4[0-7])\b/gi,  // Chronic lower respiratory
    /\b(E0[0-7])\b/gi,  // Thyroid disorders
    /\b(J45)\b/gi,       // Asthma
    /\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/g, // General ICD-10 pattern
];

// ============================================================================
// OCR EXTRACTION
// ============================================================================

/**
 * Extract text from an image buffer using Tesseract.js
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Object>} Extracted text and confidence score
 */
async function extractTextFromImage(imageBuffer, mimeType) {
    try {
        console.log('🔍 Starting OCR extraction...');

        const result = await Tesseract.recognize(
            imageBuffer,
            'eng', // English language
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`  OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        const rawText = result.data.text;
        const confidence = result.data.confidence;

        console.log(`✅ OCR extraction complete. Confidence: ${confidence}%`);
        console.log(`📄 Raw text length: ${rawText.length} characters`);

        return {
            rawText,
            confidence,
            words: result.data.words ? result.data.words.length : 0,
            lines: rawText.split('\n').filter(l => l.trim()).length,
        };
    } catch (error) {
        console.error('❌ OCR extraction failed:', error.message);
        throw new Error(`OCR extraction failed: ${error.message}`);
    }
}

// ============================================================================
// TEXT CLEANING & NORMALIZATION
// ============================================================================

/**
 * Clean and normalize raw OCR text from a prescription
 * @param {string} rawText - Raw text from OCR
 * @returns {Object} Cleaned text and metadata
 */
function cleanPrescriptionText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return { cleanedText: '', corrections: [], quality: 'poor' };
    }

    const corrections = [];
    let text = rawText;

    // 1. Fix common OCR misreads
    const ocrCorrections = [
        { from: /[|l](?=\d)/g, to: '1', desc: 'pipe/l → 1 before digit' },
        { from: /(?<=\d)[oO]/g, to: '0', desc: 'o/O → 0 after digit' },
        { from: /(?<=\d)\s+(?=mg|mcg|ml|g\b)/gi, to: '', desc: 'remove space before unit' },
        { from: /rng/gi, to: 'mg', desc: 'rng → mg' },
        { from: /rnl/gi, to: 'ml', desc: 'rnl → ml' },
        { from: /\bTab\b\.?/gi, to: 'Tablet', desc: 'Tab → Tablet' },
        { from: /\bCap\b\.?/gi, to: 'Capsule', desc: 'Cap → Capsule' },
        { from: /\bInj\b\.?/gi, to: 'Injection', desc: 'Inj → Injection' },
        { from: /\bSyr\b\.?/gi, to: 'Syrup', desc: 'Syr → Syrup' },
        { from: /\bOint\b\.?/gi, to: 'Ointment', desc: 'Oint → Ointment' },
        { from: /\bSusp\b\.?/gi, to: 'Suspension', desc: 'Susp → Suspension' },
    ];

    for (const correction of ocrCorrections) {
        const before = text;
        text = text.replace(correction.from, correction.to);
        if (before !== text) {
            corrections.push(correction.desc);
        }
    }

    // 2. Normalize whitespace
    text = text.replace(/[ \t]+/g, ' '); // collapse spaces
    text = text.replace(/\n{3,}/g, '\n\n'); // max 2 newlines
    text = text.replace(/^\s+|\s+$/gm, ''); // trim each line

    // 3. Remove garbage characters from OCR noise
    text = text.replace(/[^\w\s\.\,\;\:\-\/\(\)\#\@\%\+\=\'\"\!\?\n]/g, '');

    // 4. Fix broken lines (merge short lines that are likely continuations)
    const lines = text.split('\n');
    const mergedLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            mergedLines.push('');
            continue;
        }
        // If line is very short and next line exists and doesn't start with a
        // known section header, merge them
        if (line.length < 15 && i + 1 < lines.length && lines[i + 1].trim() &&
            !/^(Rx|Dr|Patient|Date|Diagnosis|Medication|Dosage|Note|#|\d+\.)/i.test(lines[i + 1])) {
            mergedLines.push(line + ' ' + lines[i + 1].trim());
            i++; // skip next line
            corrections.push('merged broken line');
        } else {
            mergedLines.push(line);
        }
    }
    text = mergedLines.join('\n');

    // 5. Assess quality
    const totalChars = text.length;
    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const ratio = totalChars > 0 ? alphanumericCount / totalChars : 0;
    let quality = 'good';
    if (ratio < 0.5 || totalChars < 20) quality = 'poor';
    else if (ratio < 0.7) quality = 'fair';

    return {
        cleanedText: text.trim(),
        corrections,
        quality,
        stats: {
            originalLength: rawText.length,
            cleanedLength: text.trim().length,
            correctionsApplied: corrections.length,
            alphanumericRatio: Math.round(ratio * 100) + '%',
        }
    };
}

// ============================================================================
// MEDICATION EXTRACTION
// ============================================================================

/**
 * Extract structured medication data from cleaned prescription text
 * @param {string} cleanedText - Cleaned OCR text
 * @returns {Array} Array of medication objects with name, dosage, frequency
 */
function extractMedications(cleanedText) {
    const medications = [];
    const lines = cleanedText.split('\n').filter(l => l.trim());
    const textLower = cleanedText.toLowerCase();

    // Look for known medication names in the text
    for (const med of KNOWN_MEDICATIONS) {
        const medRegex = new RegExp(`\\b${med}\\b`, 'gi');
        const matches = textLower.match(medRegex);

        if (matches) {
            // Find the line containing this medication
            const medLine = lines.find(l => l.toLowerCase().includes(med));
            if (medLine) {
                // Extract dosage from the same line or nearby
                let dosage = null;
                for (const dp of DOSAGE_PATTERNS) {
                    const dosageMatch = medLine.match(dp);
                    if (dosageMatch) {
                        dosage = dosageMatch[0];
                        break;
                    }
                }

                // Extract frequency
                let frequency = null;
                for (const fp of FREQUENCY_PATTERNS) {
                    if (fp.pattern.test(medLine)) {
                        frequency = fp.normalized;
                        fp.pattern.lastIndex = 0; // reset regex
                        break;
                    }
                }

                // Avoid duplicates
                if (!medications.find(m => m.name.toLowerCase() === med)) {
                    medications.push({
                        name: med.charAt(0).toUpperCase() + med.slice(1),
                        dosage: dosage || 'Not specified',
                        frequency: frequency || 'Not specified',
                        rawLine: medLine.trim(),
                        confidence: 'high',
                    });
                }
            }
        }
    }

    // If no known medications found, try to extract medication-like patterns
    if (medications.length === 0) {
        // Look for patterns like: "1. MedicationName 500mg twice daily"
        const rxPattern = /(?:^\d+[\.)\]]\s*|^Rx\s*:?\s*|^[-•]\s*)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(\d+\.?\d*\s*(?:mg|mcg|ml|g|iu|units?))/gim;
        let match;
        while ((match = rxPattern.exec(cleanedText)) !== null) {
            const name = match[1].trim();
            const dosage = match[2].trim();

            // Find frequency in the same line
            const lineEndIdx = cleanedText.indexOf('\n', match.index);
            const fullLine = cleanedText.substring(match.index, lineEndIdx > -1 ? lineEndIdx : undefined);

            let frequency = 'Not specified';
            for (const fp of FREQUENCY_PATTERNS) {
                if (fp.pattern.test(fullLine)) {
                    frequency = fp.normalized;
                    fp.pattern.lastIndex = 0;
                    break;
                }
            }

            if (!medications.find(m => m.name.toLowerCase() === name.toLowerCase())) {
                medications.push({
                    name,
                    dosage,
                    frequency,
                    rawLine: fullLine.trim(),
                    confidence: 'medium',
                });
            }
        }
    }

    return medications;
}

// ============================================================================
// DIAGNOSIS CODE EXTRACTION
// ============================================================================

/**
 * Extract diagnosis codes from cleaned prescription text
 * @param {string} cleanedText - Cleaned OCR text
 * @returns {Array} Array of found ICD-10 diagnosis codes
 */
function extractDiagnosisCodes(cleanedText) {
    const codes = new Set();

    for (const pattern of DIAGNOSIS_CODE_PATTERNS) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(cleanedText)) !== null) {
            codes.add(match[1] || match[0]);
        }
    }

    return Array.from(codes);
}

// ============================================================================
// PATIENT INFO EXTRACTION
// ============================================================================

/**
 * Extract patient information from prescription text
 * @param {string} cleanedText - Cleaned OCR text
 * @returns {Object} Extracted patient details (name, id, age, gender, date, doctor)
 */
function extractPatientInfo(cleanedText) {
    const info = {
        name: null,
        id: null,
        age: null,
        gender: null,
        date: null,
        doctor: null,
    };

    // Patient Name
    const nameMatch = cleanedText.match(/Patient\s*(?:Name)?\s*:?\s*([A-Z][a-zA-Z\s\.]+?)(?:\n|$|Age|Gender|DOB|ID)/i);
    if (nameMatch) info.name = nameMatch[1].trim();

    // Patient ID
    const idMatch = cleanedText.match(/(?:Patient\s*)?ID\s*:?\s*([A-Za-z0-9\-]+)/i);
    if (idMatch) info.id = idMatch[1].trim();

    // Age
    const ageMatch = cleanedText.match(/Age\s*:?\s*(\d{1,3})\s*(?:years?|yrs?|y)?/i);
    if (ageMatch) info.age = parseInt(ageMatch[1]);

    // Gender
    const genderMatch = cleanedText.match(/(?:Gender|Sex)\s*:?\s*(Male|Female|M|F|Other)/i);
    if (genderMatch) {
        const g = genderMatch[1].toUpperCase();
        info.gender = g === 'M' ? 'Male' : g === 'F' ? 'Female' : genderMatch[1];
    }

    // Date
    const dateMatch = cleanedText.match(/Date\s*:?\s*(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/i);
    if (dateMatch) info.date = dateMatch[1];

    // Doctor
    const doctorMatch = cleanedText.match(/(?:Dr\.?|Doctor)\s*:?\s*([A-Z][a-zA-Z\s\.]+?)(?:\n|$|Reg|Spec)/i);
    if (doctorMatch) info.doctor = doctorMatch[1].trim();

    return info;
}

// ============================================================================
// FULL PIPELINE
// ============================================================================

/**
 * Run the full OCR + extraction pipeline on a prescription image
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Object>} Complete extraction result with OCR, cleaned text and entities
 */
async function processPrescriptionImage(imageBuffer, mimeType) {
    // Step 1: OCR Extraction
    const ocrResult = await extractTextFromImage(imageBuffer, mimeType);

    // Step 2: Clean text
    const cleanResult = cleanPrescriptionText(ocrResult.rawText);

    // Step 3: Extract medications
    const medications = extractMedications(cleanResult.cleanedText);

    // Step 4: Extract diagnosis codes
    const diagnosisCodes = extractDiagnosisCodes(cleanResult.cleanedText);

    // Step 5: Extract patient info
    const patientInfo = extractPatientInfo(cleanResult.cleanedText);

    return {
        ocr: {
            rawText: ocrResult.rawText,
            confidence: ocrResult.confidence,
            wordCount: ocrResult.words,
            lineCount: ocrResult.lines,
        },
        cleaned: {
            text: cleanResult.cleanedText,
            quality: cleanResult.quality,
            corrections: cleanResult.corrections,
            stats: cleanResult.stats,
        },
        extracted: {
            medications,
            diagnosisCodes,
            patientInfo,
        },
    };
}

module.exports = {
    extractTextFromImage,
    cleanPrescriptionText,
    extractMedications,
    extractDiagnosisCodes,
    extractPatientInfo,
    processPrescriptionImage,
};

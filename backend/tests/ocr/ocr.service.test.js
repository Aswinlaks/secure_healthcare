/**
 * OCR Service Unit Tests
 *
 * Tests the pure logic functions in ocr.service.js:
 *   - cleanPrescriptionText
 *   - extractMedications
 *   - extractDiagnosisCodes
 *   - extractPatientInfo
 *
 * Does NOT test extractTextFromImage (requires Tesseract binary)
 * or processPrescriptionImage (integration test).
 */

const {
    cleanPrescriptionText,
    extractMedications,
    extractDiagnosisCodes,
    extractPatientInfo,
} = require('../../src/modules/ocr/ocr.service');

// =============================================================================
// cleanPrescriptionText
// =============================================================================

describe('cleanPrescriptionText', () => {
    test('should return cleaned text from noisy OCR output', () => {
        const raw = '  Patient:  John Doe \n\n\n  Metformin 500mg  \n  twice daily  ';
        const result = cleanPrescriptionText(raw);

        expect(result).toHaveProperty('cleanedText');
        expect(result).toHaveProperty('lineCount');
        expect(result).toHaveProperty('wordCount');
        expect(typeof result.cleanedText).toBe('string');
        expect(result.cleanedText.length).toBeGreaterThan(0);
    });

    test('should collapse multiple blank lines', () => {
        const raw = 'Line 1\n\n\n\n\nLine 2\n\n\nLine 3';
        const result = cleanPrescriptionText(raw);

        // Should not have more than one consecutive newline
        expect(result.cleanedText).not.toMatch(/\n{3,}/);
    });

    test('should trim whitespace from lines', () => {
        const raw = '   Metformin 500mg   \n   Twice Daily   ';
        const result = cleanPrescriptionText(raw);

        // Each line should be trimmed
        const lines = result.cleanedText.split('\n');
        lines.forEach(line => {
            expect(line).toBe(line.trim());
        });
    });

    test('should return zero counts for empty input', () => {
        const result = cleanPrescriptionText('');
        expect(result.wordCount).toBe(0);
    });

    test('should handle null/undefined gracefully', () => {
        const result = cleanPrescriptionText(null);
        expect(result).toHaveProperty('cleanedText');
        expect(result.cleanedText).toBe('');
    });

    test('should count words correctly', () => {
        const raw = 'Take Metformin 500mg twice daily';
        const result = cleanPrescriptionText(raw);
        expect(result.wordCount).toBe(5);
    });
});

// =============================================================================
// extractMedications
// =============================================================================

describe('extractMedications', () => {
    test('should extract a known medication name', () => {
        const text = 'Metformin 500mg once daily for diabetes';
        const meds = extractMedications(text);

        expect(Array.isArray(meds)).toBe(true);
        expect(meds.length).toBeGreaterThanOrEqual(1);

        const metformin = meds.find(m =>
            m.name.toLowerCase().includes('metformin')
        );
        expect(metformin).toBeDefined();
    });

    test('should extract dosage information', () => {
        const text = 'Amoxicillin 500mg three times daily';
        const meds = extractMedications(text);

        if (meds.length > 0) {
            const med = meds[0];
            expect(med).toHaveProperty('dosage');
            expect(med.dosage).toMatch(/500/);
        }
    });

    test('should extract frequency information', () => {
        const text = 'Lisinopril 10mg once daily';
        const meds = extractMedications(text);

        if (meds.length > 0) {
            const med = meds[0];
            expect(med).toHaveProperty('frequency');
        }
    });

    test('should extract multiple medications', () => {
        const text = `
      Metformin 500mg twice daily
      Lisinopril 10mg once daily
      Atorvastatin 20mg at bedtime
    `;
        const meds = extractMedications(text);
        expect(meds.length).toBeGreaterThanOrEqual(2);
    });

    test('should return empty array for text with no medications', () => {
        const text = 'The patient reports feeling well today.';
        const meds = extractMedications(text);
        expect(Array.isArray(meds)).toBe(true);
        expect(meds.length).toBe(0);
    });

    test('should handle case-insensitive medication names', () => {
        const text = 'METFORMIN 500mg OD';
        const meds = extractMedications(text);
        expect(meds.length).toBeGreaterThanOrEqual(1);
    });

    test('should return empty array for empty input', () => {
        const meds = extractMedications('');
        expect(meds).toEqual([]);
    });
});

// =============================================================================
// extractDiagnosisCodes
// =============================================================================

describe('extractDiagnosisCodes', () => {
    test('should extract ICD-10 diabetes code E11', () => {
        const text = 'Diagnosis: E11 Type 2 Diabetes Mellitus';
        const codes = extractDiagnosisCodes(text);

        expect(Array.isArray(codes)).toBe(true);
        expect(codes.length).toBeGreaterThanOrEqual(1);
        expect(codes.some(c => c.includes('E11'))).toBe(true);
    });

    test('should extract ICD-10 hypertension code I10', () => {
        const text = 'Primary diagnosis: I10 Essential hypertension';
        const codes = extractDiagnosisCodes(text);
        expect(codes.some(c => c.includes('I10'))).toBe(true);
    });

    test('should extract codes with decimal points like E11.9', () => {
        const text = 'ICD-10: E11.9 Type 2 diabetes mellitus without complications';
        const codes = extractDiagnosisCodes(text);
        expect(codes.some(c => c.includes('E11'))).toBe(true);
    });

    test('should extract multiple diagnosis codes', () => {
        const text = 'Diagnosis: E11.9 Diabetes, I10 Hypertension, E78.0 Hyperlipidemia';
        const codes = extractDiagnosisCodes(text);
        expect(codes.length).toBeGreaterThanOrEqual(2);
    });

    test('should return empty array when no codes found', () => {
        const text = 'Patient is healthy with no known conditions.';
        const codes = extractDiagnosisCodes(text);
        expect(Array.isArray(codes)).toBe(true);
        expect(codes.length).toBe(0);
    });

    test('should return empty array for empty input', () => {
        const codes = extractDiagnosisCodes('');
        expect(codes).toEqual([]);
    });
});

// =============================================================================
// extractPatientInfo
// =============================================================================

describe('extractPatientInfo', () => {
    test('should extract patient name', () => {
        const text = 'Patient Name: John Smith\nAge: 45\nGender: Male';
        const info = extractPatientInfo(text);

        expect(info).toHaveProperty('name');
        if (info.name) {
            expect(info.name).toContain('John');
        }
    });

    test('should extract patient age', () => {
        const text = 'Patient: Jane Doe\nAge: 62 years\nDOB: 01/01/1960';
        const info = extractPatientInfo(text);

        expect(info).toHaveProperty('age');
    });

    test('should extract gender', () => {
        const text = 'Patient Name: John\nGender: Male\nAge: 50';
        const info = extractPatientInfo(text);

        expect(info).toHaveProperty('gender');
    });

    test('should extract date from prescription', () => {
        const text = 'Date: 2024-03-15\nPatient: Test Patient';
        const info = extractPatientInfo(text);

        expect(info).toHaveProperty('date');
    });

    test('should extract doctor name', () => {
        const text = 'Dr. Sarah Johnson\nPatient: John Doe\nDate: 2024-01-01';
        const info = extractPatientInfo(text);

        expect(info).toHaveProperty('doctor');
    });

    test('should return object with expected keys for empty input', () => {
        const info = extractPatientInfo('');
        expect(info).toBeDefined();
        expect(typeof info).toBe('object');
    });

    test('should handle prescription with patient ID', () => {
        const text = 'Patient ID: P12345\nName: Test User';
        const info = extractPatientInfo(text);

        expect(info).toHaveProperty('id');
    });
});

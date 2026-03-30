const sharp = require('sharp');
const { processPrescriptionImage } = require('../src/modules/ocr/ocr.service');
const fs = require('fs');
const path = require('path');

const NUM_SAMPLES = 15;
const GROUND_TRUTH = {
    medication: "Metformin",
    dosage: "500mg\ntwice daily",
    icd10: "E11",
    patientName: "John Doe",
    age: "45"
};

async function generateMockPrescriptionBuffer(qualityModifier) {
    // Generate dynamic SVG text that simulates a prescription
    // Adding variations to noise and formatting to simulate real life
    
    // If quality is low, we add weird spacing to confuse OCR
    const spacing = qualityModifier < 5 ? "  " : "";
    const nameStr = qualityModifier % 2 === 0 ? "John Doe" : "JOHN DOE";
    
    const svgContent = `
    <svg width="600" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50" y="80" font-family="Arial" font-size="24" fill="black">Dr. Smith's Clinic</text>
        <line x1="50" y1="100" x2="550" y2="100" stroke="black" stroke-width="2"/>
        
        <text x="50" y="150" font-family="Courier New" font-size="18" fill="black">Patient Name: ${nameStr}</text>
        <text x="400" y="150" font-family="Courier New" font-size="18" fill="black">Age: 45</text>
        <text x="50" y="180" font-family="Courier New" font-size="18" fill="black">Date: 2026-03-30</text>
        <text x="50" y="210" font-family="Courier New" font-size="18" fill="black">Diagnosis: E11 Type 2 Diabetes</text>
        
        <text x="50" y="280" font-family="Arial" font-size="30" fill="black">Rx${spacing}</text>
        <text x="50" y="320" font-family="Courier New" font-size="20" fill="black">- Metformin 500mg</text>
        <text x="70" y="350" font-family="Courier New" font-size="18" fill="black">Take twice daily after meals</text>
        
        <text x="50" y="700" font-family="Arial" font-size="16" fill="black">Doctor Signature: __________________</text>
    </svg>
    `;

    // Convert SVG to highly compressed/noisy JPEG to simulate variable camera quality
    const simQuality = 100 - (qualityModifier * 5); // Drops to 25% quality at worst
    return await sharp(Buffer.from(svgContent))
        .jpeg({ quality: simQuality })
        .toBuffer();
}

async function runOCRBenchmarks() {
    console.log("🔍 Starting OCR Benchmarks... generating 15 synthetic prescriptions.");
    
    const metrics = {
        total: NUM_SAMPLES,
        quality: { good: 0, fair: 0, poor: 0 },
        icd10Extracted: 0,
        medicationMatched: 0
    };

    for (let i = 0; i < NUM_SAMPLES; i++) {
        console.log(`\nProcessing image ${i+1}/${NUM_SAMPLES}...`);
        
        const buffer = await generateMockPrescriptionBuffer(i);
        
        try {
            const result = await processPrescriptionImage(buffer, "image/jpeg");
            
            // Record Quality Grade
            metrics.quality[result.cleaned.quality]++;
            
            // Check ICD-10 extraction
            if (result.extracted.diagnosisCodes.includes(GROUND_TRUTH.icd10)) {
                metrics.icd10Extracted++;
            }
            
            // Check Medication matching
            const meds = result.extracted.medications;
            const hasMetformin = meds.some(m => m.name.toLowerCase() === GROUND_TRUTH.medication.toLowerCase());
            if (hasMetformin) {
                metrics.medicationMatched++;
            }
            
            console.log(`  -> Quality: ${result.cleaned.quality}`);
            console.log(`  -> ICD-10 Match: ${result.extracted.diagnosisCodes.includes(GROUND_TRUTH.icd10)}`);
            console.log(`  -> Med Match: ${hasMetformin}`);
            
        } catch (error) {
            console.error(`Error on image ${i+1}:`, error.message);
        }
    }

    console.log("\n==================================");
    console.log("🏆 Final OCR Accuracy Metrics 🏆");
    console.log("==================================");
    console.log(`Total Samples Run: ${metrics.total}`);
    console.log(`Quality Breakdown: Good (${metrics.quality.good}), Fair (${metrics.quality.fair}), Poor (${metrics.quality.poor})`);
    console.log(`ICD-10 (E11) correctly extracted: ${metrics.icd10Extracted}/${metrics.total} (${Math.round(metrics.icd10Extracted/metrics.total*100)}%)`);
    console.log(`Medication correctly fuzzy-matched: ${metrics.medicationMatched}/${metrics.total} (${Math.round(metrics.medicationMatched/metrics.total*100)}%)`);
}

runOCRBenchmarks();

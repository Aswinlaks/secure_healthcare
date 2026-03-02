// Mock Service for Sprint 2 - Intelligent Care Plan Generation

export const generateCarePlan = async (diagnosis, patientId) => {
    // Simulate network/processing delay (Knowledge Graph Traversal)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Basic Mock Logic based on keywords
    const lowerDiag = diagnosis.toLowerCase();

    let plan = {
        id: Math.floor(Math.random() * 10000),
        diagnosisNormalized: diagnosis, // Default
        conditionCode: 'U99 - Unspecified',
        alerts: [],
        medications: [],
        lifestyle: [],
        diet: [],
        rulesApplied: []
    };

    if (lowerDiag.includes('diabetes')) {
        plan.conditionCode = 'E11.9 - Type 2 Diabetes Mellitus';
        plan.alerts.push({ type: 'warning', message: 'Patient Age > 45: High risk of cardiovascular comp.' });
        plan.medications.push({
            name: 'Metformin',
            dosage: '500mg BD',
            reason: 'Rule #D12: First-line therapy for T2DM'
        });
        plan.lifestyle.push({ text: 'Daily Foot Inspection', reason: 'Rule #N2: Neuropathy prevention' });
        plan.diet.push({ text: 'Low Glycemic Index Diet', reason: 'Rule #D50: Blood sugar control' });
        plan.rulesApplied = ['#D12', '#N2', '#D50', '#KG-Traversal-Root-Endocrine'];
    }
    else if (lowerDiag.includes('hyper') || lowerDiag.includes('bp')) {
        plan.conditionCode = 'I10 - Essential Hypertension';
        plan.medications.push({
            name: 'Amlodipine',
            dosage: '5mg OD',
            reason: 'Rule #C01: Calcium Channel Blocker for Stage 1'
        });
        plan.diet.push({ text: 'DASH Diet (Low Sodium)', reason: 'Rule #C05: Sodium reduction protocol' });
        plan.lifestyle.push({ text: '30min Aerobic Exercise', reason: 'Rule #gen-01: Heart health' });
        plan.rulesApplied = ['#C01', '#C05', '#KG-Cardio-Vascular-Flow'];
    }
    else if (lowerDiag.includes('migraine') || lowerDiag.includes('headache')) {
        plan.conditionCode = 'G43.9 - Migraine, unspecified';
        plan.medications.push({
            name: 'Sumatriptan',
            dosage: '50mg as needed',
            reason: 'Rule #N90: Abortive therapy'
        });
        plan.lifestyle.push({ text: 'Sleep Hygiene Log', reason: 'Rule #N92: Trigger identification' });
        plan.rulesApplied = ['#N90', '#N92'];
    }
    else {
        // Generic Fallback
        plan.conditionCode = 'R69 - Illness, unspecified';
        plan.medications.push({ name: 'Symptomatic Relief', dosage: 'As required', reason: 'Rule #Gen-00' });
        plan.rulesApplied = ['#Default-Protocol'];
    }

    return plan;
};

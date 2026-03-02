/**
 * Clinical Knowledge Graph (CKG)
 * JSON-based graph structure representing relationships between
 * Diagnoses, Treatments, and Dietary recommendations
 */

const clinicalKnowledgeGraph = {
    // Diagnosis codes following ICD-10 style coding
    diagnoses: {
        "E11": {
            code: "E11",
            name: "Type 2 Diabetes Mellitus",
            category: "Endocrine",
            treatments: [
                {
                    id: "T001",
                    name: "Metformin",
                    type: "medication",
                    dosage: "500-2000mg daily",
                    priority: 1,
                    contraindications: ["Chronic Kidney Disease", "Heart Failure"],
                    allergyConflicts: []
                },
                {
                    id: "T002",
                    name: "GLP-1 Receptor Agonists",
                    type: "medication",
                    examples: ["Semaglutide", "Liraglutide"],
                    priority: 2,
                    contraindications: ["Medullary Thyroid Cancer", "MEN 2 Syndrome"],
                    allergyConflicts: []
                },
                {
                    id: "T003",
                    name: "SGLT2 Inhibitors",
                    type: "medication",
                    examples: ["Empagliflozin", "Dapagliflozin"],
                    priority: 2,
                    contraindications: ["Chronic Kidney Disease Stage 4+"],
                    allergyConflicts: ["Sulfa Drugs"]
                },
                {
                    id: "T004",
                    name: "Insulin Therapy",
                    type: "medication",
                    priority: 3,
                    contraindications: [],
                    allergyConflicts: []
                }
            ],
            dietaryRecommendations: [
                {
                    id: "D001",
                    name: "Low Glycemic Index Diet",
                    description: "Focus on foods with GI < 55",
                    priority: 1
                },
                {
                    id: "D002",
                    name: "Carbohydrate Counting",
                    description: "Limit to 45-60g carbs per meal",
                    priority: 1
                },
                {
                    id: "D003",
                    name: "Mediterranean Diet Pattern",
                    description: "Emphasize vegetables, whole grains, lean proteins, olive oil",
                    priority: 2
                }
            ],
            monitoringRequired: ["Glucose", "HbA1c", "Kidney Function"],
            glucoseThresholds: {
                high: 180,
                target: { min: 80, max: 130 },
                critical: 250
            }
        },

        "I10": {
            code: "I10",
            name: "Essential Hypertension",
            category: "Cardiovascular",
            treatments: [
                {
                    id: "T010",
                    name: "ACE Inhibitors",
                    type: "medication",
                    examples: ["Lisinopril", "Enalapril"],
                    priority: 1,
                    contraindications: ["Pregnancy", "Angioedema History"],
                    allergyConflicts: ["ACE Inhibitors"]
                },
                {
                    id: "T011",
                    name: "ARBs",
                    type: "medication",
                    examples: ["Losartan", "Valsartan"],
                    priority: 1,
                    contraindications: ["Pregnancy"],
                    allergyConflicts: []
                },
                {
                    id: "T012",
                    name: "Calcium Channel Blockers",
                    type: "medication",
                    examples: ["Amlodipine", "Diltiazem"],
                    priority: 2,
                    contraindications: ["Heart Failure with reduced EF"],
                    allergyConflicts: []
                },
                {
                    id: "T013",
                    name: "Thiazide Diuretics",
                    type: "medication",
                    examples: ["Hydrochlorothiazide", "Chlorthalidone"],
                    priority: 2,
                    contraindications: ["Gout", "Severe Kidney Disease"],
                    allergyConflicts: ["Sulfa Drugs"]
                }
            ],
            dietaryRecommendations: [
                {
                    id: "D010",
                    name: "DASH Diet",
                    description: "Dietary Approaches to Stop Hypertension - rich in fruits, vegetables, low-fat dairy",
                    priority: 1
                },
                {
                    id: "D011",
                    name: "Sodium Restriction",
                    description: "Limit sodium to <2300mg/day, ideally <1500mg/day",
                    priority: 1
                },
                {
                    id: "D012",
                    name: "Potassium-Rich Foods",
                    description: "Include bananas, potatoes, spinach (unless on potassium-sparing diuretics)",
                    priority: 2
                }
            ],
            monitoringRequired: ["Blood Pressure", "Kidney Function", "Electrolytes"],
            bpThresholds: {
                target: { systolic: 130, diastolic: 80 },
                stage1: { systolic: 140, diastolic: 90 },
                stage2: { systolic: 160, diastolic: 100 }
            }
        },

        "I50": {
            code: "I50",
            name: "Heart Failure",
            category: "Cardiovascular",
            treatments: [
                {
                    id: "T020",
                    name: "ACE Inhibitors / ARBs",
                    type: "medication",
                    priority: 1,
                    contraindications: ["Severe Hypotension", "Hyperkalemia"],
                    allergyConflicts: ["ACE Inhibitors"]
                },
                {
                    id: "T021",
                    name: "Beta Blockers",
                    type: "medication",
                    examples: ["Carvedilol", "Metoprolol Succinate", "Bisoprolol"],
                    priority: 1,
                    contraindications: ["Severe Bradycardia", "Decompensated HF"],
                    allergyConflicts: []
                },
                {
                    id: "T022",
                    name: "Loop Diuretics",
                    type: "medication",
                    examples: ["Furosemide", "Bumetanide"],
                    priority: 1,
                    contraindications: ["Severe Hypovolemia"],
                    allergyConflicts: ["Sulfa Drugs"]
                },
                {
                    id: "T023",
                    name: "SGLT2 Inhibitors",
                    type: "medication",
                    priority: 2,
                    contraindications: [],
                    allergyConflicts: []
                },
                {
                    id: "T024",
                    name: "Aldosterone Antagonists",
                    type: "medication",
                    examples: ["Spironolactone", "Eplerenone"],
                    priority: 2,
                    contraindications: ["Hyperkalemia", "Severe Kidney Disease"],
                    allergyConflicts: []
                }
            ],
            dietaryRecommendations: [
                {
                    id: "D020",
                    name: "Fluid Restriction",
                    description: "Limit fluid intake to 1.5-2L per day",
                    priority: 1
                },
                {
                    id: "D021",
                    name: "Strict Sodium Restriction",
                    description: "Limit sodium to <1500mg/day",
                    priority: 1
                },
                {
                    id: "D022",
                    name: "Daily Weight Monitoring",
                    description: "Weigh daily, report gain >2-3 lbs in 1-2 days",
                    priority: 1
                }
            ],
            monitoringRequired: ["BNP/NT-proBNP", "Ejection Fraction", "Daily Weight", "Electrolytes"]
        },

        "J45": {
            code: "J45",
            name: "Asthma",
            category: "Respiratory",
            treatments: [
                {
                    id: "T030",
                    name: "Inhaled Corticosteroids",
                    type: "medication",
                    examples: ["Fluticasone", "Budesonide"],
                    priority: 1,
                    contraindications: [],
                    allergyConflicts: []
                },
                {
                    id: "T031",
                    name: "Short-Acting Beta Agonists (SABA)",
                    type: "medication",
                    examples: ["Albuterol", "Levalbuterol"],
                    priority: 1,
                    contraindications: ["Severe Heart Disease"],
                    allergyConflicts: []
                },
                {
                    id: "T032",
                    name: "Long-Acting Beta Agonists (LABA)",
                    type: "medication",
                    examples: ["Salmeterol", "Formoterol"],
                    priority: 2,
                    contraindications: [],
                    allergyConflicts: []
                },
                {
                    id: "T033",
                    name: "Leukotriene Modifiers",
                    type: "medication",
                    examples: ["Montelukast"],
                    priority: 3,
                    contraindications: [],
                    allergyConflicts: []
                }
            ],
            dietaryRecommendations: [
                {
                    id: "D030",
                    name: "Anti-Inflammatory Diet",
                    description: "Rich in omega-3 fatty acids, fruits, vegetables",
                    priority: 2
                },
                {
                    id: "D031",
                    name: "Avoid Sulfites",
                    description: "Avoid wine, dried fruits, pickled foods if sulfite-sensitive",
                    priority: 2
                }
            ],
            monitoringRequired: ["Peak Flow", "Spirometry", "Symptom Diary"]
        },

        "E03": {
            code: "E03",
            name: "Hypothyroidism",
            category: "Endocrine",
            treatments: [
                {
                    id: "T040",
                    name: "Levothyroxine",
                    type: "medication",
                    priority: 1,
                    contraindications: ["Untreated Adrenal Insufficiency"],
                    allergyConflicts: []
                }
            ],
            dietaryRecommendations: [
                {
                    id: "D040",
                    name: "Consistent Iodine Intake",
                    description: "Maintain adequate but not excessive iodine intake",
                    priority: 2
                },
                {
                    id: "D041",
                    name: "Medication Timing",
                    description: "Take levothyroxine on empty stomach, 30-60 min before breakfast",
                    priority: 1
                },
                {
                    id: "D042",
                    name: "Avoid Goitrogens with Medication",
                    description: "Space soy, cruciferous vegetables from thyroid medication",
                    priority: 2
                }
            ],
            monitoringRequired: ["TSH", "Free T4", "T3"]
        }
    },

    // Drug interaction rules
    drugInteractions: [
        {
            drug1: "Metformin",
            drug2: "Iodine Contrast",
            severity: "major",
            recommendation: "Hold Metformin 48h before and after contrast"
        },
        {
            drug1: "ACE Inhibitors",
            drug2: "Potassium Supplements",
            severity: "moderate",
            recommendation: "Monitor potassium levels closely"
        },
        {
            drug1: "Warfarin",
            drug2: "Aspirin",
            severity: "major",
            recommendation: "Increased bleeding risk - use with caution"
        }
    ],

    // General allergy-drug mappings
    allergyDrugConflicts: {
        "Penicillin": ["Amoxicillin", "Ampicillin", "Penicillin V", "Piperacillin"],
        "Sulfa Drugs": ["Sulfamethoxazole", "Hydrochlorothiazide", "Furosemide", "Celecoxib"],
        "ACE Inhibitors": ["Lisinopril", "Enalapril", "Ramipril", "Benazepril"],
        "Aspirin": ["Aspirin", "NSAIDs"],
        "Iodine Contrast": ["IV Contrast Media"]
    }
};

/**
 * Get diagnosis information by code
 * @param {string} code - Diagnosis code (e.g., "E11")
 * @returns {Object|null} Diagnosis data or null
 */
function getDiagnosisByCode(code) {
    return clinicalKnowledgeGraph.diagnoses[code] || null;
}

/**
 * Get all available diagnoses
 * @returns {Array} Array of diagnosis summaries
 */
function getAllDiagnoses() {
    return Object.values(clinicalKnowledgeGraph.diagnoses).map(d => ({
        code: d.code,
        name: d.name,
        category: d.category
    }));
}

/**
 * Check for drug-allergy conflicts
 * @param {Array} allergies - Patient's allergies
 * @param {string} drugName - Drug to check
 * @returns {boolean} True if conflict exists
 */
function checkAllergyConflict(allergies, drugName) {
    for (const allergy of allergies) {
        const conflictingDrugs = clinicalKnowledgeGraph.allergyDrugConflicts[allergy] || [];
        if (conflictingDrugs.some(drug => drugName.toLowerCase().includes(drug.toLowerCase()))) {
            return true;
        }
    }
    return false;
}

module.exports = {
    clinicalKnowledgeGraph,
    getDiagnosisByCode,
    getAllDiagnoses,
    checkAllergyConflict
};

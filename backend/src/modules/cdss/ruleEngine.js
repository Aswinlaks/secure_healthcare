/**
 * Rule-Based Engine
 * Core decision logic that applies clinical rules to generate care plans
 */

const { getDiagnosisByCode, checkAllergyConflict, clinicalKnowledgeGraph } = require('./clinicalKnowledgeGraph');
const ExplainabilityEngine = require('./explainability');

class RuleEngine {
    constructor() {
        this.explainability = new ExplainabilityEngine();
    }

    /**
     * Generate a complete care plan for a patient and diagnosis
     * @param {Object} patient - Patient data from database
     * @param {string} diagnosisCode - ICD-10 style diagnosis code
     * @returns {Object} Complete care plan with treatments, diet, and reasoning
     */
    generateCarePlan(patient, diagnosisCode) {
        // Reset explainability for new plan
        this.explainability.reset();

        const diagnosis = getDiagnosisByCode(diagnosisCode);

        if (!diagnosis) {
            return {
                success: false,
                error: `Unknown diagnosis code: ${diagnosisCode}`,
                carePlan: null,
                reasoning: []
            };
        }

        // Initialize care plan structure
        const carePlan = {
            patientId: patient.id,
            patientName: patient.name,
            diagnosis: {
                code: diagnosis.code,
                name: diagnosis.name,
                category: diagnosis.category
            },
            generatedAt: new Date().toISOString(),
            treatments: [],
            excludedTreatments: [],
            dietPlan: [],
            monitoring: [],
            warnings: []
        };

        // Process treatments
        this._processTreatments(patient, diagnosis, carePlan);

        // Process dietary recommendations
        this._processDietaryRecommendations(patient, diagnosis, carePlan);

        // Process monitoring requirements
        this._processMonitoring(patient, diagnosis, carePlan);

        // Check for lab-based recommendations
        this._processLabValues(patient, diagnosis, carePlan);

        // Check for condition interactions
        this._processConditionInteractions(patient, diagnosis, carePlan);

        return {
            success: true,
            carePlan,
            reasoning: this.explainability.getFormattedSummary()
        };
    }

    /**
     * Process Treatments
     * 
     * Filters potential treatments based on patient allergies and contraindications.
     * Records reasoning for exclusions in the explainability engine.
     * 
     * Input:
     * @param {Object} patient - Patient context with allergies/conditions
     * @param {Object} diagnosis - Diagnosis object from KG
     * @param {Object} carePlan - Care plan object to populate
     * 
     * Output:
     * - Populates carePlan.treatments and carePlan.excludedTreatments
     */
    _processTreatments(patient, diagnosis, carePlan) {
        const { allergies, chronicConditions, currentMedications } = patient;

        for (const treatment of diagnosis.treatments) {
            let excluded = false;
            let exclusionReason = null;

            // Check for allergy conflicts
            for (const allergy of allergies) {
                if (treatment.allergyConflicts.includes(allergy)) {
                    excluded = true;
                    exclusionReason = `allergy to ${allergy}`;
                    this.explainability.addAllergyExclusion(treatment.name, allergy);
                    break;
                }

                // Check against general allergy-drug mappings
                const conflictingDrugs = clinicalKnowledgeGraph.allergyDrugConflicts[allergy] || [];
                if (conflictingDrugs.some(drug => treatment.name.toLowerCase().includes(drug.toLowerCase()))) {
                    excluded = true;
                    exclusionReason = `allergy to ${allergy}`;
                    this.explainability.addAllergyExclusion(treatment.name, allergy);
                    break;
                }
            }

            // Check for contraindications with chronic conditions
            if (!excluded) {
                for (const condition of chronicConditions) {
                    if (treatment.contraindications.some(c => condition.toLowerCase().includes(c.toLowerCase()))) {
                        excluded = true;
                        exclusionReason = `contraindicated with ${condition}`;
                        this.explainability.addContraindicationExclusion(treatment.name, condition);
                        break;
                    }
                }
            }

            if (excluded) {
                carePlan.excludedTreatments.push({
                    ...treatment,
                    exclusionReason
                });
            } else {
                carePlan.treatments.push({
                    id: treatment.id,
                    name: treatment.name,
                    type: treatment.type,
                    dosage: treatment.dosage,
                    examples: treatment.examples,
                    priority: treatment.priority
                });
                this.explainability.addTreatmentInclusion(
                    treatment.name,
                    diagnosis.name,
                    treatment.priority
                );
            }
        }

        // Sort treatments by priority
        carePlan.treatments.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Process Dietary Recommendations
     * 
     * Selects appropriate dietary advice based on diagnosis and existing conditions.
     * 
     * Input:
     * @param {Object} patient - Patient context
     * @param {Object} diagnosis - Diagnosis object
     * @param {Object} carePlan - Care plan object to populate
     * 
     * Output:
     * - Populates carePlan.dietPlan
     */
    _processDietaryRecommendations(patient, diagnosis, carePlan) {
        for (const diet of diagnosis.dietaryRecommendations) {
            carePlan.dietPlan.push({
                id: diet.id,
                name: diet.name,
                description: diet.description,
                priority: diet.priority
            });
            this.explainability.addDietaryRecommendation(
                diet.name,
                diagnosis.name,
                diet.description
            );
        }

        // Add condition-specific dietary modifications
        if (patient.chronicConditions.includes('Chronic Kidney Disease')) {
            const ckdDiet = {
                id: 'D_CKD',
                name: 'Renal Diet Modifications',
                description: 'Limit potassium, phosphorus, and protein as directed',
                priority: 1
            };
            carePlan.dietPlan.push(ckdDiet);
            this.explainability.addDietaryRecommendation(
                ckdDiet.name,
                'Chronic Kidney Disease',
                ckdDiet.description
            );
        }

        // Sort by priority
        carePlan.dietPlan.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Process Monitoring Requirements
     * 
     * Identifies necessary lab tests and vital checks based on the condition.
     * 
     * Input:
     * @param {Object} patient - Patient context
     * @param {Object} diagnosis - Diagnosis object
     * @param {Object} carePlan - Care plan object to populate
     * 
     * Output:
     * - Populates carePlan.monitoring
     */
    _processMonitoring(patient, diagnosis, carePlan) {
        const monitoringSet = new Set(diagnosis.monitoringRequired || []);

        // Add condition-based monitoring
        if (patient.chronicConditions.includes('Chronic Kidney Disease')) {
            monitoringSet.add('Creatinine');
            monitoringSet.add('GFR');
            monitoringSet.add('Potassium');
        }

        if (patient.chronicConditions.includes('Heart Failure')) {
            monitoringSet.add('Daily Weight');
            monitoringSet.add('Fluid Balance');
        }

        for (const param of monitoringSet) {
            carePlan.monitoring.push(param);
            this.explainability.addMonitoringRequirement(
                param,
                `Required for ${diagnosis.name} management`
            );
        }
    }

    /**
     * Process Lab Values
     * 
     * Analyzes recent lab results to generate specific warnings or treatment adjustments.
     * 
     * Input:
     * @param {Object} patient - Patient context with recentLabValues
     * @param {Object} diagnosis - Diagnosis object
     * @param {Object} carePlan - Care plan object to populate
     * 
     * Output:
     * - Populates carePlan.warnings
     */
    _processLabValues(patient, diagnosis, carePlan) {
        const labs = patient.recentLabValues || {};

        // Diabetes-specific lab checks
        if (diagnosis.code === 'E11') {
            if (labs.glucose && labs.glucose > 180) {
                this.explainability.addLabBasedReasoning(
                    'Glucose',
                    labs.glucose,
                    '180 mg/dL',
                    'Intensify glycemic control, consider medication adjustment'
                );
                carePlan.warnings.push({
                    type: 'lab',
                    message: `Elevated glucose (${labs.glucose} mg/dL) - Consider intensifying treatment`,
                    severity: 'moderate'
                });
            }

            if (labs.hba1c && labs.hba1c > 7.5) {
                this.explainability.addLabBasedReasoning(
                    'HbA1c',
                    `${labs.hba1c}%`,
                    '7.5%',
                    'Suboptimal glycemic control - treatment intensification recommended'
                );
            }
        }

        // Hypertension-specific checks
        if (diagnosis.code === 'I10' && labs.bloodPressure) {
            const bpParts = labs.bloodPressure.split('/');
            const systolic = parseInt(bpParts[0]);
            const diastolic = parseInt(bpParts[1]);

            if (systolic >= 140 || diastolic >= 90) {
                this.explainability.addLabBasedReasoning(
                    'Blood Pressure',
                    labs.bloodPressure,
                    '140/90 mmHg',
                    'Blood pressure above target - optimize antihypertensive therapy'
                );
                carePlan.warnings.push({
                    type: 'lab',
                    message: `Blood pressure ${labs.bloodPressure} above target - Consider treatment adjustment`,
                    severity: 'moderate'
                });
            }
        }

        // Heart Failure specific checks
        if (diagnosis.code === 'I50') {
            if (labs.bnp && labs.bnp > 400) {
                this.explainability.addLabBasedReasoning(
                    'BNP',
                    labs.bnp,
                    '400 pg/mL',
                    'Elevated BNP indicates heart failure severity - optimize therapy'
                );
                carePlan.warnings.push({
                    type: 'lab',
                    message: `Elevated BNP (${labs.bnp} pg/mL) - Monitor closely for decompensation`,
                    severity: 'high'
                });
            }

            if (labs.ejectionFraction && labs.ejectionFraction < 40) {
                this.explainability.addLabBasedReasoning(
                    'Ejection Fraction',
                    `${labs.ejectionFraction}%`,
                    '40%',
                    'Reduced EF - ensure guideline-directed medical therapy'
                );
            }
        }
    }

    /**
     * Process interactions between multiple chronic conditions
     */
    _processConditionInteractions(patient, diagnosis, carePlan) {
        const conditions = patient.chronicConditions;

        // Diabetes + CKD interaction
        if (conditions.includes('Type 2 Diabetes') && conditions.includes('Chronic Kidney Disease')) {
            this.explainability.addWarning(
                'Diabetes with CKD requires careful medication selection - some diabetes medications are contraindicated or need dose adjustment',
                'high'
            );
            carePlan.warnings.push({
                type: 'condition_interaction',
                message: 'Diabetes + CKD: Review all medication dosages for renal adjustment',
                severity: 'high'
            });
        }

        // Heart Failure + Diabetes
        if (conditions.includes('Heart Failure') && conditions.includes('Type 2 Diabetes')) {
            this.explainability.addWarning(
                'Consider SGLT2 inhibitors - proven benefit for both heart failure and diabetes',
                'moderate'
            );
        }

        // Multiple cardiovascular conditions
        const cvConditions = conditions.filter(c =>
            ['Hypertension', 'Heart Failure', 'Coronary Artery Disease'].includes(c)
        );
        if (cvConditions.length > 1) {
            this.explainability.addWarning(
                `Multiple cardiovascular conditions (${cvConditions.join(', ')}) - coordinate care across specialists`,
                'moderate'
            );
        }
    }
}

module.exports = RuleEngine;

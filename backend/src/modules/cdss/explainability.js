/**
 * Explainability Engine
 * Tracks and formats the reasoning behind clinical recommendations
 */

class ExplainabilityEngine {
    constructor() {
        this.reset();
    }

    /**
     * Reset the explanation state for a new care plan
     */
    reset() {
        this.inclusions = [];
        this.exclusions = [];
        this.monitoring = [];
        this.labs = [];
        this.warnings = [];
        this.diet = [];
    }

    /**
     * Add info about treatment inclusion
     */
    addTreatmentInclusion(treatment, diagnosis, priority) {
        this.inclusions.push({
            type: 'treatment',
            name: treatment,
            reason: `Standard treatment for ${diagnosis}`,
            priority
        });
    }

    /**
     * Add info about allergy-based exclusion
     */
    addAllergyExclusion(treatment, allergy) {
        this.exclusions.push({
            name: treatment,
            reason: `Allergy conflict with ${allergy}`,
            type: 'allergy'
        });
    }

    /**
     * Add info about condition-based contraindication
     */
    addContraindicationExclusion(treatment, condition) {
        this.exclusions.push({
            name: treatment,
            reason: `Contraindicated with your condition: ${condition}`,
            type: 'contraindication'
        });
    }

    /**
     * Add dietary recommendation logic
     */
    addDietaryRecommendation(dietName, condition, description) {
        this.diet.push({
            name: dietName,
            condition,
            description
        });
    }

    /**
     * Add monitoring requirement reasoning
     */
    addMonitoringRequirement(param, reason) {
        this.monitoring.push({ param, reason });
    }

    /**
     * Add reasoning based on lab values
     */
    addLabBasedReasoning(param, value, threshold, action) {
        this.labs.push({ param, value, threshold, action });
    }

    /**
     * Add general clinical warning
     */
    addWarning(message, severity) {
        this.warnings.push({ message, severity });
    }

    /**
     * Get a structured summary of the reasoning
     */
    getFormattedSummary() {
        return {
            inclusions: this.inclusions,
            exclusions: this.exclusions,
            diet: this.diet,
            monitoring: this.monitoring,
            labs: this.labs,
            warnings: this.warnings
        };
    }
}

module.exports = ExplainabilityEngine;

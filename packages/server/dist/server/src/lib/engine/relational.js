const RELATIONAL_METRIC = {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
};
const RELATIONAL_STATE = {
    ALIGNED: 'ALIGNED',
    DORMANT: 'DORMANT',
    MISALIGNED: 'MISALIGNED',
    CAPACITY_BLOCKED: 'CAPACITY_BLOCKED',
    TRUST_FRACTURED: 'TRUST_FRACTURED',
};
export const relationalStateOrder = [
    RELATIONAL_STATE.TRUST_FRACTURED,
    RELATIONAL_STATE.CAPACITY_BLOCKED,
    RELATIONAL_STATE.MISALIGNED,
    RELATIONAL_STATE.DORMANT,
    RELATIONAL_STATE.ALIGNED,
];
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
export function toMetric(value) {
    if (value >= 70)
        return RELATIONAL_METRIC.HIGH;
    if (value >= 40)
        return RELATIONAL_METRIC.MEDIUM;
    return RELATIONAL_METRIC.LOW;
}
export function evaluateRelationalState(signals) {
    const availability = clamp(signals.availability);
    const alignment = clamp(signals.alignment);
    const activation = clamp(signals.activation);
    const trust = clamp(signals.trust);
    const score = clamp((availability + alignment + activation + trust) / 4);
    if (trust < 40) {
        return {
            state: RELATIONAL_STATE.TRUST_FRACTURED,
            score,
            dimensions: buildDimensions({ availability, alignment, activation, trust }),
            explanation: 'Trust is below the safety threshold, so repair and reassurance must precede optimization.',
            nextBestAction: 'Run a trust repair conversation, name the rupture, and agree on one observable repair commitment.',
        };
    }
    if (availability < 40) {
        return {
            state: RELATIONAL_STATE.CAPACITY_BLOCKED,
            score,
            dimensions: buildDimensions({ availability, alignment, activation, trust }),
            explanation: 'The relationship has enough trust to stay engaged, but current capacity is too constrained for deeper work.',
            nextBestAction: 'Reduce demands, schedule recovery, and ask what each partner has emotional bandwidth for today.',
        };
    }
    if (alignment < 40) {
        return {
            state: RELATIONAL_STATE.MISALIGNED,
            score,
            dimensions: buildDimensions({ availability, alignment, activation, trust }),
            explanation: 'Both partners can participate, but their goals, meanings, or expectations are diverging.',
            nextBestAction: 'Clarify the shared outcome, separate positions from needs, and choose a mutually acceptable next step.',
        };
    }
    if (activation < 40) {
        return {
            state: RELATIONAL_STATE.DORMANT,
            score,
            dimensions: buildDimensions({ availability, alignment, activation, trust }),
            explanation: 'Core safety and alignment are present, but the relational system needs energy, novelty, or momentum.',
            nextBestAction: 'Create a small bid for connection, complete a mission, or schedule a meaningful shared experience.',
        };
    }
    return {
        state: RELATIONAL_STATE.ALIGNED,
        score,
        dimensions: buildDimensions({ availability, alignment, activation, trust }),
        explanation: 'Availability, alignment, activation, and trust are all above the intervention threshold.',
        nextBestAction: 'Protect the momentum by naming what is working and setting one growth-oriented intention.',
    };
}
function buildDimensions(signals) {
    return {
        availability: toMetric(signals.availability),
        alignment: toMetric(signals.alignment),
        activation: toMetric(signals.activation),
        trust: toMetric(signals.trust),
    };
}

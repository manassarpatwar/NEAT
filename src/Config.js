const Config = {
    excessCoefficient: 1.0,
    disjointCoefficient: 1.0,
    weightDifferenceCoefficient: 1,
    compatibilityThreshold: 3.0,
    compatibilityModifier: 0.3,
    compatibilityModifierTarget: 10,
    adjustCompatibilityThreshold: false,
    mutationPower: 2.5,
    reEnableGeneProbability: 0.05,
    ageSignificance: 1,
    dropoffAge: 15,
    survivalThreshold: 0.5,
    populationSize: 100,
    timesteps: 10,
    mutation: {
        node: 0.03,
        connection: 0.05,
        weight: 0.8,
        weightPerturbed: 0.9,
        mutateOnly: 0.2,
    },
    interspeciesMateRate: 0.001,
    fitnessThreshold: 0.9,
};

export default Config;
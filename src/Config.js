const Config = {
    excessCoefficient: 1.0,
    disjointCoefficient: 1.0,
    weightDifferenceCoefficient: 0.4,
    compatibilityThreshold: 3.0,
    ageSignificance: 1,
    dropOffAge: 15,
    survivalThreshold: 0.2,
    fullyConnect: true,
    mutation: {
        node: 0.03,
        connection: 0.05,
        weight: 0.8,
        weightPerturbed: 0.9,
        perturb: "uniform",
        mutateOnly: 0.25,
        power: 2.5,
        maxWeight: 8.0,
        toggle: 0.01,
        reEnable: 0.01,
    },
    interspeciesMateRate: 0.001,
};

export default Config;

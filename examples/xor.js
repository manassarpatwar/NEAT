import Population from "../src/Population";
import { shuffle } from "../src/utils";

const print = json => {
    return [...Object.keys(json)].map(k => `${k}: ${json[k]}`).join(" ");
};

const training = [
    [[0, 0], 0],
    [[1, 0], 1],
    [[0, 1], 1],
    [[1, 1], 0],
];

const evaluate = genome => {
    genome.trueScore = 0;
    genome.score = 4;
    shuffle(training).forEach(data => {
        const [o] = genome.activate(data[0]);
        genome.trueScore += (Math.round(o) === data[1]) * 1;
        genome.score -= Math.abs(o - data[1]);
    });
    genome.score *= genome.score;
};

const gen = 200;
async function run(neat, verbose = false) {
    return new Promise(async resolve => {
        let totalSpecies = 0;
        let history = "";
        let beat = false;
        while (neat.generation < gen) {
            if (beat) {
                break;
            }
            neat.genomes.forEach(evaluate);
            totalSpecies += neat.species.length;

            neat.epoch();
            const log = {
                Gen: neat.generation,
                Genomes: neat.genomes.length,
                "Number of species": neat.species.length,
                "True Score": neat.champ.trueScore,
                "Best Fitness": neat.champ.originalFitness,
                Nodes: neat.champ.nodes.size,
                Connections: neat.champ.connections.size,
            };
            history += "\n" + print(log);
            if (neat.champ.score > 15.9) {
                beat = true;
            }

            if (verbose) {
                console.log(print(log));
            }
        }
        if (verbose) {
            console.log("\n" + "-".repeat(100));
            console.log("Average species: " + totalSpecies / neat.generation);
            for (const g of neat.genomes) {
                const genome = g.copy();
                evaluate(genome);
                if (genome.trueScore === 4) {
                    console.log(
                        print({
                            Score: genome.score,
                            Nodes: genome.nodes.size,
                            Connections: [...genome.connections.values()].filter(c => c.enabled)
                                .length,
                        })
                    );
                }
            }
            const champ = neat.champ.copy();
            evaluate(champ);
            console.log(
                print({
                    TS: champ.trueScore,
                    S: champ.score,
                })
            );
        }
        process.stdout.write(beat ? "." : "x");
        // if (neat.champ.score < 15) {
        //     console.log(history);
        // }
        return resolve();
    });
}

const test = async (verbose = false) => {
    const neat = new Population(2, 1, 150, g => g.score / 16, {
        dropOffAge: 15,

        mutation: {
            connection: 0.05,
            node: 0.03,
            weight: 0.8,
            weightPerturbed: 0.9,
            mutateOnly: 0.25,
            power: 2.5,
            maxWeight: 8.0,
            toggle: 0,
            reEnable: 0,
        },
    });
    run(neat, verbose);
};

const xor = async (runs = 100) => {
    await Promise.all([...new Array(runs)].map(_ => test()));
};

// xor(1000);
test(true);

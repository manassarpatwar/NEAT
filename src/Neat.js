import InnovationHistory from "./InnovationHistory";
import Species from "./Species";
import Config from "./Config";
import Genome from "./Genome";
import { shuffle } from "./utils";

export default class Neat {
    constructor(inputs, outputs, populationSize = 0, fitnessFunction = g => Math.random()) {
        this.InnovationHistory = new InnovationHistory(inputs + outputs + 1);
        this.populationSize = populationSize;
        this.species = [];
        this.population = [];
        this.generation = 0;
        this.fitnessFunction = fitnessFunction;
        for (let i = 0; i < this.populationSize; i++) {
            const genome = new Genome();
            genome.createNetwork(inputs, outputs);
            genome.mutateAddConnection(this.InnovationHistory);
            this.population.push(genome);
        }
        if (this.population.length) {
            this.speciate();
        }
    }

    calculateFitness() {
        this.population.forEach(genome => {
            genome.fitness = this.fitnessFunction(genome);
        });
    }

    selectRandomSpecies(totalFitness) {
        const rand = Math.random() * totalFitness;
        let runningSum = 0;

        const shuffled = shuffle([...this.species]);
        shuffled.forEach(species => {
            runningSum += species.bestFitness;
            if (runningSum > rand) {
                return species;
            }
        });
        return shuffled[0];
    }

    getSuperChamp() {
        return this.population.length
            ? this.population.reduce((champ, genome) =>
                  genome.fitness > champ.fitness ? genome : champ
              )
            : null;
    }

    epoch() {
        this.calculateFitness();

        const superChamp = this.getSuperChamp();
        console.log(
            "Gen: " +
                this.generation +
                "  Number of Species: " +
                this.species.length +
                " Best Score: " +
                superChamp.score +
                " Nodes: " +
                superChamp.nodes.size +
                " Connections: " +
                superChamp.connections.size
        );

        let averageFitness = 0;
        let totalFitness = 0;
        // Adjust fitness of species' members
        this.species.forEach(species => {
            species.adjustFitness();
            if (species.members.length === 0) {
                console.log("WTF");
            }
            species.sort();
            species.cull();

            averageFitness += species.averageFitness;
            totalFitness += species.bestFitness;
        });

        for (let i = 0; i < this.population.length; i++) {
            const genome = this.population[i];
            // Remove all genomes marked for death
            if (genome.kill) {
                this.population.splice(i, 1);
                i--;
            } else {
                genome.expectedOffspring = Math.floor(genome.fitness / averageFitness);
            }
        }

        this.species.sort((a, b) => b.bestFitness - a.bestFitness);

        const children = [];
        // Reproduce all species
        this.species.forEach((species, i) => {
            species.expectedOffspring = Math.floor(
                (species.averageFitness / averageFitness) * this.populationSize
            );
            if (!species.expectedOffspring) {
                this.species.splice(i, 1);
            } else {
                children.push(
                    ...species.reproduce(
                        this.InnovationHistory,
                        superChamp,
                        this.selectRandomSpecies(totalFitness)
                    )
                );
            }
        });

        this.population = children;

        this.speciate();
        this.generation++;
    }

    speciate() {
        this.species.forEach(species => {
            species.members = [];
            species.age++;
        });

        this.population.forEach(genome => {
            const found =
                this.species.length > 0 &&
                this.species.some(species => {
                    const isCompatible = species.contains(genome);

                    if (isCompatible) {
                        species.addMember(genome);
                    }

                    return isCompatible;
                });

            if (!found) {
                const species = new Species(genome);
                this.species.push(species);
            }
        });

        for (let i = 0; i < this.species.length; i++) {
            if (this.species[i].members.length === 0) {
                this.species.splice(i, 1);
                i--;
            }
        }
    }
}

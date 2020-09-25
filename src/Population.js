import InnovationHistory from "./InnovationHistory";
import Species from "./Species";
import DefaultConfig from "./Config";
import Genome from "./Genome";
import { random, selectRandom, shuffle } from "./utils";

export default class Population {
    constructor(inputs, outputs, size = 0, fitnessFunction, Config = {}) {
        this.InnovationHistory = new InnovationHistory(inputs + outputs + 1);
        this.size = size;
        this.species = [];
        this.genomes = [];
        this.generation = 0;
        this.fitnessFunction = fitnessFunction;
        this.Config = {
            ...DefaultConfig,
            ...Config,
        };

        for (let i = 0; i < this.size; i++) {
            const genome = new Genome();
            if (this.Config.fullyConnect) {
                genome.buildNetwork(inputs, outputs, this.InnovationHistory, this.Config);
            } else {
                genome.buildNetwork(inputs, outputs);
                genome.mutateAddConnection(this.InnovationHistory, this.Config);
            }
            this.genomes.push(genome);
        }
        if (this.genomes.length) {
            this.speciate();
        }

        if (this.genomes.length > 1) {
            this.champ = this.getSuperChamp();
        }
    }

    remove(genome) {
        for (let i = 0; i < this.genomes.length; i++) {
            if (this.genomes[i] === genome) {
                this.genomes.splice(i, 1);
                return;
            }
        }
    }

    calculateFitness() {
        this.genomes.forEach(genome => {
            genome.fitness = this.fitnessFunction(genome);
        });
    }

    classify(genome) {
        const found = this.species.some(species => {
            const isCompatible = species.contains(genome, this.Config);

            if (isCompatible) {
                species.add(genome);
            }

            return isCompatible;
        });

        if (!found) {
            const species = new Species(genome);
            this.species.push(species);
        }
    }

    getRandomSpecies(exclude = null) {
        let species = this.species;
        if (this.species.length > 1 && exclude) {
            species = this.species.filter(s => s !== exclude);
        }
        species = shuffle(species);

        const sum = species.reduce((acc, s) => acc + s.averageFitness, 0);
        const r = random(0, sum);
        let cdf = 0;

        for (const s of species) {
            cdf += s.averageFitness;
            if (cdf > r) {
                return s;
            }
        }

        return species[0];
    }

    getSuperChamp() {
        return this.genomes.reduce((champ, genome) =>
            genome.fitness > champ.fitness ? genome : champ
        );
    }

    epoch() {
        this.calculateFitness();

        this.champ = this.getSuperChamp();

        this.overallAverage = 0;
        // Adjust fitness of species' members

        for (let i = 0; i < this.species.length; i++) {
            const species = this.species[i];
            if (species.members.length === 0) {
                this.species.splice(i, 1);
                i--;
                continue;
            }
            species.adjustFitness(this.Config, this.champ);
            species.sort();
            species.cull(this.Config);
           
            this.overallAverage += species.averageFitness;
        }

        for (const genome of this.genomes) {
            genome.expectedOffspring = genome.kill
                ? 0
                : Math.round(genome.fitness / this.overallAverage);
        }

        this.species.sort((a, b) => b.bestFitness - a.bestFitness);

        // Reproduce all species
        const allSpecies = [...this.species];
        for (const species of allSpecies) {
            species.expectedOffspring = Math.round(
                (species.averageFitness / this.overallAverage) * this.size
            );

            species.reproduce(this);
        }

        this.genomes = [];
        for (let i = 0; i < this.species.length; i++) {
            const species = this.species[i];
            species.members = [...species.babies];
            species.babies = [];
            if (species.members.length === 0) {
                this.species.splice(i, 1);
                i--;
                continue;
            }
            this.genomes.push(...species.members);
        }

        while (this.genomes.length > this.size) {
            const genome = selectRandom(this.genomes);
            genome.species.remove(genome);
            this.remove(genome);
        }

        while (this.genomes.length < this.size) {
            const genome = this.getRandomSpecies().getRandomMember().copy();
            genome.mutate(this.InnovationHistory, this.Config);
            this.classify(genome);
            this.genomes.push(genome);
        }

        this.generation++;
        return true;
    }

    speciate() {
        for (const genome of this.genomes) {
            this.classify(genome);
        }
    }
}

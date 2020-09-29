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
            this.activeChamp = this.champ;
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

        const sum = species.reduce((acc, s) => acc + s.totalFitness, 0);
        const r = random(0, sum);
        let cdf = 0;

        for (const s of species) {
            cdf += s.totalFitness;
            if (cdf >= r) {
                return s;
            }
        }

        console.error("no species found");
        return species[0];
    }

    getSuperChamp() {
        return this.genomes.reduce((champ, genome) =>
            genome.fitness > champ.fitness ? genome : champ
        );
    }

    epoch() {
        this.calculateFitness();

        // Adjust compatibility threshold
        if (
            this.Config.adjustCompatibilityThreshold &&
            this.species.length !== this.Config.compatibilityModifierTarget
        ) {
            this.Config.compatibilityThreshold +=
                -this.Config.compatibilityModifier *
                (this.species.length > this.Config.compatibilityModifierTarget ? -1 : 1);

            this.Config.compatibilityThreshold = Math.max(
                this.Config.compatibilityThreshold,
                this.Config.compatibilityModifier
            );
        }

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
            species.adjustFitness(this.Config);
            species.sort();
            species.cull(this.Config);

            this.overallAverage += species.totalFitness;
        }

        const average = this.genomes.reduce((s, g) => s + g.fitness, 0) / this.genomes.length;

        this.champ.expectedOffspring = this.champ.fitness / average;

        this.species.sort((a, b) => b.bestFitness - a.bestFitness);

        // Reproduce all species
        const allSpecies = [...this.species];

        for (const species of allSpecies) {
            species.expectedOffspring = Math.round(
                (species.totalFitness / this.overallAverage) * this.size
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

        while (this.genomes.length < this.size - 1) {
            const genome = this.getRandomSpecies().getRandomMember().copy();
            genome.mutate(this.InnovationHistory, this.Config);
            this.classify(genome);
            this.genomes.push(genome);
        }

        while (this.genomes.length > this.size - 1) {
            const genome = selectRandom(this.genomes);
            genome.species.remove(genome);
            this.remove(genome);
        }

        this.activeChamp = this.champ.copy();
        this.genomes.push(this.activeChamp);
        this.classify(this.activeChamp);

        this.generation++;
        return true;
    }

    speciate() {
        for (const genome of this.genomes) {
            this.classify(genome);
        }
    }
}

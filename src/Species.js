import { selectRandom, random, shuffle } from "./utils";
import Genome from "./Genome";

export default class Species {
    static getId() {
        return this.id++;
    }

    constructor(specimen) {
        this.id = Species.getId();
        this.members = [];
        this.babies = [];
        this.add(specimen);
        this.specimen = specimen;
        this.age = 0;
        this.averageFitness = 0;
        this.bestFitness = 0;
        this.totalFitness = 0;
        this.ageOfLastImprovement = 0;
        this.expectedOffsprings = 0;
        this.color = [50 + Math.random() * 150, 50 + Math.random() * 150, 50 + Math.random() * 150];
    }

    add(member) {
        member.species = this;
        this.members.push(member);
    }

    remove(member) {
        for (let i = 0; i < this.members.length; i++) {
            if (this.members[i] === member) {
                this.members.splice(i, 1);
                return;
            }
        }
    }

    contains(genome, Config) {
        const data = Genome.compatibility(genome, this.specimen, Config, true);

        return data.distance < Config.compatibilityThreshold;
    }

    getChampion() {
        return this.members[0];
    }

    getRandomMember(exclude = null) {
        let members = this.members;
        if (this.members.length > 1 && exclude) {
            members = this.members.filter(m => m !== exclude);
        }
        members = shuffle(members);

        const sum = members.reduce((s, m) => s + m.originalFitness, 0);
        const r = random(0, sum);
        let cdf = 0;

        for (const member of members) {
            cdf += member.originalFitness;
            if (cdf > r) {
                return member;
            }
        }

        return members[0];
    }

    adjustFitness(Config, superChamp) {
        if (superChamp.species === this) {
            this.extinct = false;
        } else {
            this.extinct = this.age - this.ageOfLastImprovement + 1 > Config.dropOffAge;
        }

        this.totalFitness = 0;
        for (const member of this.members) {
            member.originalFitness = member.fitness;

            if (this.extinct) {
                // Penalty for a long period of stagnation (divide fitness by 100)
                member.fitness *= 0.01;
            }

            if (this.age <= 10) {
                // boost young organisms
                member.fitness *= Config.ageSignificance;
            }

            this.totalFitness += member.fitness;
        }
        this.averageFitness = this.totalFitness / this.members.length;
    }

    sort() {
        this.members.sort((a, b) => b.originalFitness - a.originalFitness);
        this.specimen = selectRandom(this.members);

        // update age of last improvement
        if (this.members[0].originalFitness > this.bestFitness) {
            this.bestFitness = this.members[0].originalFitness;
            this.ageOfLastImprovement = this.age;
        }
    }

    cull(Config) {
        const cull = Math.floor(this.members.length * Config.survivalThreshold+1);

        for (let i = cull; i < this.members.length; i++) {
            this.members.splice(i, 1);
            i--;
        }
    }

    reproduce(population) {
        const { InnovationHistory, Config, champ: superChamp } = population;
        this.age++;
        this.babies = [];
        const champ = this.getChampion();
        let champAdded = false;

        for (let i = 0; i < this.expectedOffspring; i++) {
            let baby;
            if (superChamp && superChamp === champ && superChamp.expectedOffspring > 0) {
                // If we have a population champion, finish off some special clones
                const genome = superChamp.copy();

                if (superChamp.expectedOffspring === 1) {
                    genome.mutate(InnovationHistory, Config);
                }

                superChamp.expectedOffspring--;

                baby = genome;
            } else if (!champAdded && this.expectedOffspring > 5) {
                // Champion of species with more than 5 networks is copied unchanged
                baby = champ.copy();
                champAdded = true;
            } else if (Math.random() < Config.mutation.mutateOnly) {
                // Mutate only
                const mom = this.getRandomMember().copy();
                mom.mutate(InnovationHistory, Config);
                baby = mom;
            } else {
                // mate
                const mom = this.getRandomMember();
                let dad;

                if (Math.random() > Config.interspeciesMateRate) {
                    dad = this.getRandomMember(mom);
                } else {
                    dad = population.getRandomSpecies(this).getRandomMember();
                }

                baby = Genome.crossover(dad, mom);
                baby.mutate(InnovationHistory, Config);
            }
            const found = population.species.some(species => {
                const isCompatible = species.contains(baby, Config);

                if (isCompatible) {
                    baby.species = species;
                    species.babies.push(baby);
                }

                return isCompatible;
            });

            if (!found) {
                const species = new Species(baby);
                species.babies = [baby];
                population.species.push(species);
            }
        }
    }
}
Species.id = 0;

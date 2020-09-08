import Config from "./Config";
import { selectRandom, shuffle } from "./utils";
import Genome from "./Genome";

export default class Species {
    constructor(specimen) {
        this.members = [specimen];
        this.specimen = specimen;
        this.age = 0;
        this.averageFitness = 0;
        this.bestFitness = 0;
        this.totalFitness = 0;
        this.ageOfLastImprovement = 0;
        this.expectedOffsprings = 0;
    }

    addMember(member) {
        this.members.push(member);
    }

    contains(genome) {
        const { distance } = Genome.compatibility(genome, this.specimen);
        return distance < Config.compatibilityThreshold;
    }

    getChampion() {
        return this.members[0];
    }

    getRandomMember() {
        const rand = Math.random() * this.totalFitness;
        let runningSum = 0;

        const shuffled = shuffle([...this.members]);
        shuffled.forEach(member => {
            runningSum += member.fitness;
            if (runningSum > rand) {
                return member;
            }
        });
        return shuffled[0];
    }

    adjustFitness() {
        this.totalFitness = 0;
        this.extinct = this.age - this.ageOfLastImprovement + 1 > Config.dropoffAge;

        this.members.forEach(member => {
            if (this.extinct) {
                // Penalty for a long period of stagnation (divide fitness by 100)
                member.adjustedFitness *= 0.01;
            }

            if (this.age <= 10) {
                // boost young members
                member.adjustedFitness *= Config.ageSignificance;
            }

            member.adjustedFitness = Math.max(member.fitness, 0.0001) / this.members.length;
            this.totalFitness += member.fitness;
        });
        this.averageFitness = this.totalFitness / this.members.length;
    }

    sort() {
        this.members.sort((a, b) => b.fitness - a.fitness);
        this.specimen = selectRandom(this.members);
        // update age of last improvement
        if (this.members[0].fitness > this.bestFitness) {
            this.bestFitness = this.members[0].fitness;
            this.ageOfLastImprovement = this.age;
        }
    }

    cull() {
        if (this.members.length > 2) {
            const cull = Math.floor(this.members.length * Config.survivalThreshold);

            for (let i = cull; i < this.members.length; i++) {
                this.members[i].kill = true;
                this.members.splice(i, 1);
                i--;
            }
        }
    }

    reproduce(InnovationHistory, superChamp, randomSpecies) {
        const babies = [];
        const champ = this.getChampion();
        let champAdded = false;

        for (let i = 0; i < this.expectedOffspring; i++) {
            let baby;

            if (superChamp && superChamp === champ && superChamp.expectedOffspring > 0) {
                // If we have a population champion, finish off some special clones
                const genome = superChamp.copy();

                if (superChamp.expectedOffspring === 1) {
                    genome.mutate(InnovationHistory);
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
                mom.mutate(InnovationHistory);
                baby = mom;
            } else {
                // mate
                const mom = this.getRandomMember();
                let dad;

                let sp = false;
                if (Math.random() > Config.interspeciesMateRate) {
                    dad = this.getRandomMember();
                } else {
                    dad = randomSpecies.getChampion();
                    sp = true;
                }
                
                if(!dad){
                    console.log(`${sp ? 'interspecies dad!!' : 'THIS SPECIES MEMBER!!!'}`, randomSpecies);
                }
                baby = Genome.crossover(dad, mom);
                baby.mutate(InnovationHistory);
            }
            babies.push(baby);
        }

        return babies;
    }
}

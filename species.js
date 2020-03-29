class Species{
    constructor(mascot){
        this.members = [];
        this.members.push(mascot);
        this.mascot = mascot.clone();

        this.bestFitness = mascot.fitness;
        this.averageFitness = 0;
        this.staleness = 0;

        this.c1 = 1;
        this.c2 = 0.5;
        this.D = 3;
    }

    addMember(member){
        this.members.push(member);
    }

    getMascot(){
        return this.mascot;
    }

    sameSpecies(g){
        var compatibility;

        var excessAndDisjoint = Genome.getExcessDisjoint(g, this.mascot.brain); //get the number of excess and disjoint genes between this player and the current species this.rep
        var averageWeightDiff = Genome.averageWeightDiff(g, this.mascot.brain); //get the average weight difference between matching genes
    
        var largeGenomeNormaliser = g.connections.size - 20;
        if (largeGenomeNormaliser < 1) {
          largeGenomeNormaliser = 1;
        }
    
        compatibility = (this.c1 * excessAndDisjoint / largeGenomeNormaliser) + (this.c2 * averageWeightDiff); //compatibility formula
        return (this.D > compatibility);

        
    }


    cull() {
        if (this.members.length > 2) {
            for (var i = this.members.length/2; i < this.members.length; i++) {
                // this.members.remove(i);
                this.members.splice(i, 1);
                i--;
            }
        }
    }

    calculateAverage(){
        var sum = 0;
        for (var i = 0; i < this.members.length; i++) {
            sum += this.members[i].fitness;
        }
        this.averageFitness = sum/this.members.length;
    }


    fitnessSharing() {
        for (var i = 0; i < this.members.length; i++) {
            this.members[i].fitness = this.members[i].fitness/this.members.length;
        }
    }

    sortSpecies(){

        if (this.members.length == 0) {
            this.staleness = 200;
            return;
        }else{
            this.members.sort((a,b) => a.fitness > b.fitness ? -1 : 1);
        }
        //if new best player
        if (this.members[0].fitness > this.bestFitness) {
            this.staleness = 0;
            this.bestFitness = this.members[0].fitness;
            this.mascot = this.members[0].clone();
        } else { //if no new best player
            this.staleness++;
        }
    }

    crossover(innovationHistory){
        let child;
        if (random(1) < 0.25 || this.members.length == 1) { //25% of the time there is no crossover and the child is simply a clone of a random(ish) player
            child = this.members[this.selectPlayer()].clone();
        }else{
            let parent1Index = this.selectPlayer();
            let parent1 = this.members[parent1Index];

            let parent2 = this.members[this.selectPlayer(parent1Index)];
            if(parent1.fitness > parent2.fitness){
                child = parent1.crossover(parent2);
            }else{
                child = parent2.crossover(parent1);
            };
        }
        child.brain.mutate(innovationHistory);
        return child;
    }

    selectPlayer(skip) {
        var fitnessSum = 0;
        for (var i = 0; i < this.members.length; i++) {
            if(skip && skip == i)
                continue;
            fitnessSum += this.members[i].fitness;
        }
        var rand = random(fitnessSum);
        var runningSum = 0;
  
        for (var i = 0; i < this.members.length; i++) {
            if(skip && skip == i)
                continue;
            runningSum += this.members[i].fitness;
            if (runningSum > rand) {
                return i;
            }
        }
        //unreachable code to make the parser happy
        return 0;
    }


}
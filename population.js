class Population{
    constructor(size, inputs, outputs){
        this.populationSize = size;
        this.population = [];

        this.bestScore = 0;
        this.previousBest;
        this.innovationHistory = [];
        this.species = [];
        this.gen = 0;
        this.best = null;
        for(let i = 0; i < this.populationSize; i++){
            this.population[i] = new Player(inputs, outputs);
            this.population[this.population.length - 1].brain.mutate(this.innovationHistory);
        }

    }

    done() {
        for (var i = 0; i < this.populationSize; i++) {
            if (!this.population[i].dead) {
                return false;
            }
        }
        return true;
    }

    setBestPlayer(){
        var tempBest = this.species[0].members[0];
        tempBest.gen = this.gen;
    
    
        //if best thisthis.gen is better than the global best score then set the global best as the best thisthis.gen
    
        if (tempBest.score >= this.bestScore) {
        //   this.genPlayers.push(tempBest.clone());
        //   console.log("old best: " + this.bestScore);
        //   console.log("new best: " + tempBest.score);
          this.bestScore = tempBest.score;
          this.best = tempBest.clone();
        }
    }

    naturalSelection(){
        let bs = 0;
        for(let p of this.population){
            if(p.score > bs){
                bs = p.score;
            }
        }
        // console.log(bs);
        this.calculateFitness();
        this.speciate();


        this.sortSpecies();
    
        this.cullSpecies();
        
        this.setBestPlayer();
        this.killStaleSpecies();

        this.killBadSpecies();
        console.log("Gen: "+ this.gen + "  Number of Species: " + this.species.length  +" Node mutations: "+nodeMut+" Best Score: "+this.population.reduce((max, p) => max.score > p.score ? max : p).score);
        // console.log(this.species[0].members[0].score);
        let averageSum = this.getAvgFitnessSum();
        let children = [];

        for(let s of this.species){

            children.push(s.mascot.clone());
            let noOfChildren = Math.floor(s.averageFitness/averageSum*this.population.length)-1;

            for(let i = 0; i < noOfChildren; i++){
                children.push(s.crossover(this.innovationHistory));
            }
        }
        // console.log(score)
        while(children.length < this.populationSize){
            children.push(this.species[0].crossover(this.innovationHistory));
        }
        this.population = [];

        arrayCopy(children, this.population);

        this.gen++;
    }

    cullSpecies(){
        for(let s of this.species){
            s.cull();
            s.fitnessSharing();
            s.calculateAverage();
        }
    }

    killBadSpecies() {
        var averageSum = this.getAvgFitnessSum();
  
        for (var i = 1; i < this.species.length; i++) {
            if (this.species[i].averageFitness / averageSum * this.populationSize < 1) { //if wont be given a single child
                // this.species.remove(i); //sad
                this.species.splice(i, 1);
                i--;
            }
        }
    }

    noOfChildren(species){
        var averageSum = this.getAvgFitnessSum();
        return species.averageFitness / averageSum * this.population.length;
      }

    killStaleSpecies() {
        for (var i = 2; i < this.species.length; i++) {
            if (this.species[i].staleness >= 20) {
                this.species.splice(i, 1);
                i--;
            }
        }
    }

    calculateFitness(){
        for(let p of this.population){
            p.calculateFitness();
        }
    }

    getAvgFitnessSum() {
        var averageSum = 0;
        for (var s of this.species) {
            averageSum += s.averageFitness;
        }
        return averageSum;
    }

    sortSpecies(){
        for(let s of this.species){
            s.sortSpecies();
        }
         //sort the this.species by the fitness of its best player

        this.species.sort((a,b) => a.bestFitness > b.bestFitness ? -1 : 1);

    }

    speciate(){
        for(let s of this.species){
            s.members = [];
        }
        for(let i = 0; i < this.populationSize; i++){
            let p = this.population[i];

            let createNewSpecies = true;
            for(let s of this.species){
                if(s.sameSpecies(p.brain)){
                    createNewSpecies = false;
                    s.addMember(p);
                }
            }
            if(createNewSpecies){
                this.species.push(new Species(p));
            }
        }
    }
}
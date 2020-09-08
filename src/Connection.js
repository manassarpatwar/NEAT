import { randomGaussian, random, clamp } from "./utils";

export default class Connection {
    constructor(form, to, weight = random(-2, 2), enabled = true, innovation = 0) {
        this.from = form;
        this.to = to;
        this.weight = weight;
        this.enabled = enabled;
        this.innovation = innovation;

        this.to.addInConnection(this);
        this.from.addOutConnection(this);
    }

    disable() {
        this.enabled = false;
    }

    mutate(perturbProbability) {
        if (Math.random() < perturbProbability) {
            this.weight += randomGaussian();
            //keep this.weight between bounds
            this.weight = clamp(-2, 2, this.weight);
        } else {
            this.weight = random(-2, 2);
        }
    }

    copy(from, to) {
        //important that the from and to are the new nodes and not the old
        return new Connection(from, to, this.weight, this.enabled, this.innovation);
    }
}

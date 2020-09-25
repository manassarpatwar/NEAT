import { random, clamp, gaussian } from "./utils";

export default class Connection {
    constructor(form, to, weight, enabled = true, innovation = 0) {
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

    enable() {
        this.enabled = true;
    }

    mutate(Config) {
        const { power, weightPerturbed, maxWeight, perturb } = Config.mutation;

        if (Math.random() < weightPerturbed) {
            this.weight += perturb === "gaussian" ? gaussian() : random(-power, power);
            this.weight = clamp(-maxWeight, maxWeight, this.weight);
        } else {
            this.weight = random(-power, power);
        }
    }

    copy(from, to) {
        //important that the from and to are the new nodes and not the old
        return new Connection(from, to, this.weight, this.enabled, this.innovation);
    }
}

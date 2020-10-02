import { selectRandom } from "./utils";

export default class Node {
    constructor(type, id = 0) {
        this.type = type;
        this.id = id;
        this.in = [];
        this.out = [];
        this.output = 0;
    }

    //modified sigmoid
    activation(x, m = 4.9) {
        return 1 / (1 + Math.exp(-m * x));
    }

    activate() {
        const sum = this.in.reduce(
            (sum, con) => sum + con.from.output * con.weight * con.enabled,
            0
        );

        this.output = this.activation(sum);
    }

    addInConnection(connection) {
        this.in.push(connection);
    }

    addOutConnection(connection) {
        this.out.push(connection);
    }

    copy() {
        return new Node(this.type, this.id);
    }
}

import Config from "./Config";
import Connection from "./Connection";
import Node from "./Node";
import { OUTPUT, INPUT, HIDDEN, BIAS } from "./types";
import { selectRandom } from "./utils";

export default class Genome {
    constructor() {
        this.nodes = new Map();
        this.connections = new Map();
        this.score = 0;
        this.fitness = 0;
        this.adjustedFitness = 0;
    }

    createNetwork(inputs, outputs) {
        const bias = new Node(BIAS, 0);
        bias.output = 1.0; //important!!
        this.nodes.set(bias.id, bias);

        for (let i = 0; i < inputs; i++) {
            const node = new Node(INPUT, i + 1);
            this.nodes.set(node.id, node);
        }

        for (let j = 0; j < outputs; j++) {
            const node = new Node(OUTPUT, j + inputs + 1);
            this.nodes.set(node.id, node);
        }
    }

    fullyConnect(InnovationHistory) {
        const inputNodes = [];
        const outputNodes = [];
        this.nodes.forEach(node => {
            if (node.type === INPUT || node.type === BIAS) {
                inputNodes.push(node);
            }
            if (node.type === OUTPUT) {
                outputNodes.push(node);
            }
        });

        inputNodes.forEach(inputNode => {
            outputNodes.forEach(outputNode => {
                this.addConnection(new Connection(inputNode, outputNode), InnovationHistory);
            });
        });
    }

    activate(inputs) {
        const hidden = [];
        const outputs = [];
        this.nodes.forEach(node => {
            if (node.type === INPUT) {
                node.output = inputs.shift();
            }
            if (node.type === HIDDEN) {
                hidden.push(node);
            }
            if (node.type === OUTPUT) {
                outputs.push(node);
            }
        });

        for (let i = 0; i < Config.timesteps; i++) {
            hidden.forEach(node => node.activate());
        }
        outputs.forEach(node => node.activate());

        return outputs.map(node => node.output);
    }

    copy() {
        const genome = new Genome();

        this.nodes.forEach((node, key) => {
            genome.nodes.set(key, node.copy());
        });

        this.connections.forEach((connection, key) => {
            const from = genome.nodes.get(connection.from.id);
            const to = genome.nodes.get(connection.to.id);
            genome.connections.set(key, connection.copy(from, to));
        });

        return genome;
    }

    addNode(node, connection, InnovationHistory) {
        node.id = InnovationHistory.getNodeId(connection);
        this.nodes.set(node.id, node);
    }

    addConnection(connection, InnovationHistory) {
        connection.innovation = InnovationHistory.getInnovation(connection);
        this.connections.set(connection.innovation, connection);
    }

    connectionExists(node1, node2) {
        return [...this.connections.values()].some(
            connection => connection.from.id === node1.id && connection.to.id === node2.id
        );
    }

    mutateAddNode(InnovationHistory) {
        if (!this.connections.size) return;

        const connection = selectRandom(Array.from(this.connections.values()));
        const node = new Node(HIDDEN);

        connection.disable();

        this.addConnection(new Connection(connection.from, node), InnovationHistory);
        this.addConnection(
            new Connection(node, connection.to, connection.weight),
            InnovationHistory
        );
        this.addNode(node, connection, InnovationHistory);
    }

    mutateAddConnection(InnovationHistory) {
        const nodes = Array.from(this.nodes.values());

        const from = selectRandom(nodes.filter(node => node.type !== OUTPUT));

        const to = selectRandom(nodes.filter(node => node.type !== INPUT && node !== from));

        const connection = new Connection(from, to);
        const isValid = !this.connectionExists(from, to);

        if (isValid) {
            this.addConnection(connection, InnovationHistory);
            return;
        }
    }

    mutateWeights() {
        this.connections.forEach(connection => {
            connection.mutate(Config.mutation.weightPerturbed);
        });
    }

    mutate(InnovationHistory) {
        if (Config.mutation.connection && Math.random() < Config.mutation.connection) {
            this.mutateAddConnection(InnovationHistory);
        } else if (Config.mutation.node && Math.random() < Config.mutation.node) {
            this.mutateAddNode(InnovationHistory);
        } else if (Config.mutation.weight && Math.random() < Config.mutation.weight) {
            this.mutateWeights();
        }
    }

    static crossover(genome1, genome2) {
        //assuming genome1 is more fit than genome2
        if (genome1.fitness < genome2) {
            const temp = genome1;
            genome1 = genome2;
            genome2 = temp;
        }

        const child = new Genome();

        genome1.nodes.forEach(node => {
            if (node.type === INPUT || node.type === OUTPUT) {
                const copy = node.copy();
                child.nodes.set(copy.id, copy);
            }
        });

        const innovationNumbers = new Set([
            ...genome1.connections.keys(),
            ...genome2.connections.keys(),
        ]);
        innovationNumbers.forEach(innovation => {
            const con1 = genome1.connections.get(innovation);
            const con2 = genome2.connections.get(innovation);

            const con = con1 && con2 ? (Math.random() > 0.5 ? con1 : con2) : con1;
            if (con) {
                let from = child.nodes.get(con.from.id);
                if (!from) {
                    from = con.from.copy();
                    child.nodes.set(from.id, from);
                }

                let to = child.nodes.get(con.to.id);
                if (!to) {
                    to = con.to.copy();
                    child.nodes.set(to.id, to);
                }

                child.connections.set(innovation, con.copy(from, to));
            }
        });

        return child;
    }

    static compatibility(genome1, genome2) {
        const connections1 = [...genome1.connections.keys()];
        const connections2 = [...genome2.connections.keys()];
        const innovationNumbers = new Set([...connections1, ...connections2]);

        const excess = Math.abs(Math.max(...connections1) - Math.max(...connections2)) || 0;
        let disjoint = -excess;
        const matching = [];
        const N = Math.max(genome1.connections.size, genome2.connections.size, 1);

        innovationNumbers.forEach(innovation => {
            const con1 = genome1.connections.get(innovation);
            const con2 = genome2.connections.get(innovation);

            if (con1 && con2) {
                matching.push(Math.abs(con1.weight - con2.weight));
            } else if (!con1 || !con2) {
                disjoint++;
            }
        });

        disjoint = Math.max(disjoint, 0);

        const weightDiff =
            matching.length > 1
                ? matching.reduce((a, b) => a + b) / matching.length
                : matching[0] || 0;

        return {
            excess,
            disjoint,
            matching: matching.length,
            distance:
                (excess * Config.excessCoefficient + disjoint * Config.disjointCoefficient) / N +
                weightDiff * Config.weightDifferenceCoefficient,
        };
    }
}

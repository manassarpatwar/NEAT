import Connection from "./Connection";
import Node from "./Node";
import { OUTPUT, INPUT, HIDDEN, BIAS } from "./types";
import { selectRandom, random } from "./utils";

export default class Genome {
    constructor() {
        this.nodes = new Map();
        this.connections = new Map();
        this.score = 0;
        this.fitness = 0;
        this.originalFitness = 0;
    }

    buildNetwork(inputs, outputs, InnovationHistory = null, Config = null) {
        const bias = new Node(BIAS, 0);
        this.nodes.set(bias.id, bias);

        for (let i = 0; i < inputs; i++) {
            const node = new Node(INPUT, i + 1);
            this.nodes.set(node.id, node);
        }

        for (let j = 0; j < outputs; j++) {
            const node = new Node(OUTPUT, j + inputs + 1);
            this.nodes.set(node.id, node);
        }

        this.initializeNetwork();
        if (InnovationHistory && Config) {
            // fully connect
            for (const input of this.inputs) {
                //including bias node
                for (const output of this.outputs) {
                    this.addConnection(
                        new Connection(
                            input,
                            output,
                            random(-Config.mutation.power, Config.mutation.power)
                        ),
                        InnovationHistory
                    );
                }
            }
        }
    }

    initializeNetwork() {
        this.inputs = [];
        this.outputs = [];
        this.nodes.forEach(node => {
            if (node.type === BIAS || node.type === INPUT) {
                this.inputs.push(node);
            } else if (node.type === OUTPUT) {
                this.outputs.push(node);
            }
        });
        this.sortNetwork();
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

        genome.initializeNetwork();
        return genome;
    }

    activate(activations) {
        const inputs = [1, ...activations];

        this.inputs.forEach(node => (node.output = inputs.shift()));

        this.hidden.forEach(node => node.activate()); //already sorted by topology
        this.outputs.forEach(node => node.activate());

        return this.outputs.map(node => node.output);
    }

    sortNetwork() {
        this.hidden = [];
        const removed = new Set();
        const nodes = [...this.inputs];
        while (nodes.length) {
            const node = nodes.shift();
            if (node.type === HIDDEN) {
                this.hidden.push(node);
            }
            for (const con of node.out) {
                removed.add(con.innovation);
                if (
                    con.enabled &&
                    con.to.type === HIDDEN &&
                    con.to.in.every(edge => removed.has(edge.innovation))
                ) {
                    nodes.push(con.to);
                }
            }
        }
    }

    addNode(node, connection, InnovationHistory) {
        node.id = InnovationHistory.getNodeId(connection);
        this.nodes.set(node.id, node);
    }

    addConnection(connection, InnovationHistory) {
        connection.innovation = InnovationHistory.getInnovation(connection);
        this.connections.set(connection.innovation, connection);
    }

    connectionExists(from, to) {
        return [...this.connections.values()].some(
            connection => connection.from.id === from.id && connection.to.id === to.id
        );
    }

    isRecurrent(from, to) {
        const queue = [...to.out];

        while (queue.length) {
            const connection = queue.shift();

            if (connection.to.id === from.id) return true;

            queue.push(...connection.to.out);
        }

        return false;
    }

    mutateAddNode(InnovationHistory) {
        const connection = selectRandom([...this.connections.values()].filter(c => c.enabled));
        if (connection) {
            const node = new Node(HIDDEN);
            connection.disable();

            this.addNode(node, connection, InnovationHistory);

            this.addConnection(new Connection(connection.from, node, 1), InnovationHistory);
            this.addConnection(
                new Connection(node, connection.to, connection.weight),
                InnovationHistory
            );
            return true;
        }
        return false;
    }

    mutateAddConnection(InnovationHistory, Config, tries = 20) {
        const nodes = Array.from(this.nodes.values());

        while (tries--) {
            const from = selectRandom(nodes.filter(node => node.type !== OUTPUT));

            const to = selectRandom(
                nodes.filter(node => node.type !== INPUT && node.type !== BIAS && node !== from)
            );

            const isValid =
                from && to && !this.connectionExists(from, to) && !this.isRecurrent(from, to);

            if (isValid) {
                const connection = new Connection(
                    from,
                    to,
                    random(-Config.mutation.power, Config.mutation.power)
                );
                this.addConnection(connection, InnovationHistory);
                return true;
            }
        }

        return false;
    }

    mutateWeights(Config) {
        this.connections.forEach(connection => {
            if (connection.enabled) {
                connection.mutate(Config);
            }
        });
    }

    mutateReEnable() {
        this.connections.forEach(con => {
            if (!con.enabled) {
                con.enable();
                return true;
            }
        });
        return false;
    }

    mutateToggleEnable(times = 1) {
        while (times--) {
            const connection = selectRandom([...this.connections.values()]);
            if (connection.enabled) {
                connection.disable();
                if (!connection.to.in.some(c => c.enabled)) {
                    connection.enable();
                }
            } else {
                connection.enable();
            }
        }
        return true;
    }

    mutate(InnovationHistory, Config) {
        let sort = false;

        const r = Math.random()
        if (r < (Config.mutation.connection || 0)) {
            sort = sort || this.mutateAddConnection(InnovationHistory, Config);
        }
        if (r < (Config.mutation.node || 0)) {
            sort = sort || this.mutateAddNode(InnovationHistory);
        }
        if (r < (Config.mutation.weight || 0)) {
            this.mutateWeights(Config);
        }
        if (r < (Config.mutation.toggle || 0)) {
            sort = sort || this.mutateToggleEnable();
        }
        if (r < (Config.mutation.reEnable || 0)) {
            sort = sort || this.mutateReEnable();
        }

        if (sort) {
            this.sortNetwork();
        }
    }

    graph() {
        const network = [];
        network[0] = this.inputs.map(n => {
            n.layer = 0;
            return n;
        });

        for (const node of this.hidden) {
            const layer = node.in.reduce((l, c) => Math.max(l, c.from.layer), 0) + 1;
            node.layer = layer;
            if (network[layer] === undefined) {
                network[layer] = [];
            }
            network[layer].push(node);
        }
        network.push(
            this.outputs.map(n => {
                n.layer = network.length;
                return n;
            })
        );

        return network;
    }

    static crossover(genome1, genome2) {
        //assuming genome1 is more fit than genome2
        if (genome1.fitness < genome2.fitness) {
            const temp = genome1;
            genome1 = genome2;
            genome2 = temp;
        }

        const child = new Genome();
        genome1.nodes.forEach((node, key) => {
            child.nodes.set(key, node.copy());
        });

        for (const innovation of genome1.connections.keys()) {
            const con1 = genome1.connections.get(innovation);
            const con2 = genome2.connections.get(innovation);

            const matching = con1 && con2;

            const con = matching ? (Math.random() > 0.5 ? con1 : con2) : con1;
            const from = child.nodes.get(con.from.id);

            const to = child.nodes.get(con.to.id);

            const copy = con.copy(from, to);

            copy.enable();
            if (matching && (!con1.enabled || !con2.enabled)) {
                if (Math.random() < 0.75) {
                    copy.disable();
                }
            }
            child.connections.set(innovation, copy);
        }

        child.initializeNetwork();

        return child;
    }

    static compatibility(genome1, genome2, Config, verbose = false) {
        const connections1 = [...genome1.connections.keys()];
        const connections2 = [...genome2.connections.keys()];
        const innovationNumbers = new Set([...connections1, ...connections2]);

        let excess = 0;
        let disjoint = 0;
        const matching = [];
        const smaller = Math.min(Math.max(...connections1), Math.max(...connections2));

        for (const innovation of innovationNumbers) {
            const con1 = genome1.connections.get(innovation);
            const con2 = genome2.connections.get(innovation);

            if (con1 && con2) {
                matching.push(Math.abs(con1.weight - con2.weight));
            } else if (!con1 || !con2) {
                if (innovation > smaller) {
                    excess++;
                } else {
                    disjoint++;
                }
            }
        }

        const weightDiff = matching.reduce((a, b) => a + b, 0) / matching.length || 0;

        const distance =
            excess * Config.excessCoefficient +
            disjoint * Config.disjointCoefficient +
            weightDiff * Config.weightDifferenceCoefficient;

        if (verbose) {
            return {
                excess,
                disjoint,
                distance,
                weightDiff,
                matching: matching.length,
            };
        }

        return distance;
    }
}

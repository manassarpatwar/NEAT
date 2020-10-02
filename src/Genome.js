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
                if (con.to.in.every(edge => removed.has(edge.innovation))) {
                    nodes.push(con.to);
                }
            }
        }
        const hidden = [...this.nodes.values()].filter(n => n.type === HIDDEN);
        if (this.hidden.length !== hidden.length) {
            console.error("network has a cycle");
            console.error(
                hidden.map(h => ({ id: h.id })),
                " | ",
                this.hidden.map(h => ({ id: h.id }))
            );
        }
    }

    addNode(node, connection, InnovationHistory) {
        node.id = InnovationHistory.getNodeId(connection);
        if (this.nodes.has(node.id)) {
            return false;
        }
        this.nodes.set(node.id, node);
        return true;
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
        const connections = [...this.connections.values()].filter(c => c.enabled);
        const connection = selectRandom(connections);

        if (connection) {
            const node = new Node(HIDDEN);

            const valid = this.addNode(node, connection, InnovationHistory);
            if (valid) {
                connection.disable();

                this.addConnection(new Connection(connection.from, node, 1.0), InnovationHistory);
                this.addConnection(
                    new Connection(node, connection.to, connection.weight),
                    InnovationHistory
                );
                return true;
            }
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

            const valid =
                from && to && !this.connectionExists(from, to) && !this.isRecurrent(from, to);

            if (valid) {
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

        if (Math.random() < (Config.mutation.node || 0)) {
            sort = sort || this.mutateAddNode(InnovationHistory);
        } else if (Math.random() < (Config.mutation.connection || 0)) {
            sort = sort || this.mutateAddConnection(InnovationHistory, Config);
        } else {
            if (Math.random() < (Config.mutation.weight || 0)) {
                this.mutateWeights(Config);
            }
            if (Math.random() < (Config.mutation.toggle || 0)) {
                this.mutateToggleEnable();
            }
            if (Math.random() < (Config.mutation.reEnable || 0)) {
                this.mutateReEnable();
            }
        }
        if (sort) {
            this.sortNetwork();
        }
    }

    graph(width, height, pad = { x: 0, y: 0 }) {
        const network = [];
        network[0] = this.inputs.map((n, y) => {
            n.layer = 0;
            n.vector = {
                x: width * pad.x,
                y:
                    this.inputs.length > 1
                        ? pad.y * height +
                          (((1 - 2 * pad.y) * height) / (this.inputs.length + 1)) * (y + 1)
                        : 0.5 * height,
            };
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

        const hidden = network.length - 1;
        for (let x = 1; x < network.length; x++) {
            const layer = network[x];
            for (let y = 0; y < layer.length; y++) {
                const node = layer[y];
                node.vector = {
                    x: width * pad.x + ((width * (1 - 2 * pad.x)) / (hidden + 1)) * x,
                    y:
                        layer.length > 1
                            ? pad.y * height +
                              (((1 - 2 * pad.y) * height) / (layer.length + 1)) * (y + 1)
                            : height * 0.5,
                };
            }
        }

        network.push(
            this.outputs.map((n, y) => {
                n.layer = network.length;
                n.vector = {
                    x: width * (1 - pad.x),
                    y:
                        this.outputs.length > 1
                            ? pad.y * height +
                              (((1 - 2 * pad.y) * height) / (this.outputs.length + 1)) * (y + 1)
                            : height * 0.5,
                };
                return n;
            })
        );

        return network;
    }

    static crossover(genome1, genome2) {
        //assuming genome1 is more fit than genome2
        if (genome1.originalFitness < genome2.originalFitness) {
            const temp = genome1;
            genome1 = genome2;
            genome2 = temp;
        }

        const equal = genome1.originalFitness === genome2.originalFitness;

        const child = new Genome();

        // Ensure that all sensors and ouputs are added to the organism
        genome1.nodes.forEach((node, key) => {
            if (node.type === BIAS || node.type === INPUT || node.type === OUTPUT) {
                child.nodes.set(key, node.copy());
            }
        });

        const innovationNumbers = [
            ...new Set([...genome1.connections.keys(), ...genome2.connections.keys()]),
        ].sort((a, b) => a - b);

        for (const innovation of innovationNumbers) {
            const con1 = genome1.connections.get(innovation);
            const con2 = genome2.connections.get(innovation);

            const matching = con1 && con2;
            const con = matching
                ? Math.random() > 0.5
                    ? con1
                    : con2
                : equal
                ? con1 || con2
                : con1;

            if (!con) {
                continue;
            }

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

            if (child.isRecurrent(from, to)) {
                continue;
            }
            const trait = con.copy(from, to);
            trait.enable();
            if (matching && (!con1.enabled || !con2.enabled)) {
                if (Math.random() < 0.75) {
                    trait.disable();
                }
            }
            child.connections.set(innovation, trait);
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

        const N = Math.max(connections1.length, connections2.length, 1);
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
            (excess * Config.excessCoefficient) / N +
            (disjoint * Config.disjointCoefficient) / N +
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

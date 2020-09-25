import test from "ava";
import Neat from "../src/Population";
import Genome from "../src/Genome";
import Node from "../src/Node";
import Connection from "../src/Connection";
import types from "../src/types";

test("Genome compatibility distance", t => {
    const inputs = 3;
    const outputs = 1;
    const neat = new Neat(inputs, outputs);

    const { InnovationHistory } = neat;

    const genome1 = new Genome();
    genome1.buildNetwork(inputs, outputs);

    genome1.addConnection(
        new Connection(genome1.nodes.get(1), genome1.nodes.get(4)),
        InnovationHistory
    );
    let con = new Connection(genome1.nodes.get(2), genome1.nodes.get(4), 1, false);
    con.innovation = InnovationHistory.getInnovation(con);
    genome1.addConnection(con, InnovationHistory);

    genome1.addNode(new Node(types.HIDDEN), con, InnovationHistory);

    genome1.addConnection(
        new Connection(genome1.nodes.get(3), genome1.nodes.get(4)),
        InnovationHistory
    );
    genome1.addConnection(
        new Connection(genome1.nodes.get(2), genome1.nodes.get(5)),
        InnovationHistory
    );
    genome1.addConnection(
        new Connection(genome1.nodes.get(5), genome1.nodes.get(4)),
        InnovationHistory
    );

    const genome2 = new Genome();
    genome2.buildNetwork(inputs, outputs);

    genome2.addConnection(
        new Connection(genome2.nodes.get(1), genome2.nodes.get(4)),
        InnovationHistory
    );
    con = new Connection(genome2.nodes.get(2), genome2.nodes.get(4), 1, false);
    genome2.addNode(new Node(types.HIDDEN), con, InnovationHistory);
    genome2.addConnection(con, InnovationHistory);

    genome2.addConnection(
        new Connection(genome2.nodes.get(3), genome2.nodes.get(4)),
        InnovationHistory
    );

    con = new Connection(genome2.nodes.get(2), genome2.nodes.get(5));
    con.innovation = InnovationHistory.getInnovation(con);
    genome2.addConnection(
        new Connection(genome2.nodes.get(2), genome2.nodes.get(5)),
        InnovationHistory
    );

    con = new Connection(genome2.nodes.get(5), genome2.nodes.get(4), 1, false);
    genome2.addConnection(con, InnovationHistory);
    genome2.addNode(new Node(types.HIDDEN), con, InnovationHistory);

    genome2.addConnection(
        new Connection(genome2.nodes.get(5), genome2.nodes.get(6)),
        InnovationHistory
    );
    genome2.addConnection(
        new Connection(genome2.nodes.get(6), genome2.nodes.get(4)),
        InnovationHistory
    );
    genome1.addConnection(
        new Connection(genome1.nodes.get(1), genome1.nodes.get(5)),
        InnovationHistory
    );
    genome2.addConnection(
        new Connection(genome2.nodes.get(3), genome2.nodes.get(5)),
        InnovationHistory
    );
    genome2.addConnection(
        new Connection(genome2.nodes.get(1), genome2.nodes.get(6)),
        InnovationHistory
    );

    genome2.sortNetwork();

    const { matching, disjoint, excess } = Genome.compatibility(
        genome1,
        genome2,
        neat.Config,
        true
    );
    t.is(excess, 2);
    t.is(disjoint, 3);
    t.is(matching, 5);
});

test("Genome recurrent", t => {
    const inputs = 3;
    const outputs = 1;
    const neat = new Neat(inputs, outputs);

    const { InnovationHistory } = neat;

    const genome = new Genome();
    genome.buildNetwork(inputs, outputs);
    let con = new Connection(genome.nodes.get(1), genome.nodes.get(4), 1, false);
    genome.addConnection(con, InnovationHistory);

    let node1 = new Node(types.HIDDEN);
    genome.addNode(node1, con, InnovationHistory);
    genome.addConnection(
        new Connection(genome.nodes.get(1), genome.nodes.get(5)),
        InnovationHistory
    );
    genome.addConnection(
        new Connection(genome.nodes.get(5), genome.nodes.get(4)),
        InnovationHistory
    );

    con = new Connection(genome.nodes.get(2), genome.nodes.get(4), 1, false);
    let node2 = new Node(types.HIDDEN);
    genome.addConnection(con, InnovationHistory);

    genome.addNode(node2, con, InnovationHistory);
    genome.addConnection(
        new Connection(genome.nodes.get(2), genome.nodes.get(6)),
        InnovationHistory
    );
    genome.addConnection(
        new Connection(genome.nodes.get(6), genome.nodes.get(4)),
        InnovationHistory
    );

    con = new Connection(genome.nodes.get(3), genome.nodes.get(4), 1, false);
    genome.addConnection(con, InnovationHistory);

    let node3 = new Node(types.HIDDEN);
    genome.addNode(node3, con, InnovationHistory);
    genome.addConnection(
        new Connection(genome.nodes.get(3), genome.nodes.get(7)),
        InnovationHistory
    );
    genome.addConnection(
        new Connection(genome.nodes.get(7), genome.nodes.get(4)),
        InnovationHistory
    );

    genome.addConnection(
        new Connection(genome.nodes.get(5), genome.nodes.get(6)),
        InnovationHistory
    );

    genome.addConnection(
        new Connection(genome.nodes.get(6), genome.nodes.get(7)),
        InnovationHistory
    );

    const recurrent = new Connection(genome.nodes.get(7), genome.nodes.get(5));
    genome.addConnection(recurrent, InnovationHistory);

    t.is(genome.isRecurrent(recurrent.from, recurrent.to), true);
});

test("Genome activate", t => {
    const inputs = 3;
    const outputs = 1;
    const neat = new Neat(inputs, outputs);

    const { InnovationHistory } = neat;

    const genome = new Genome();
    genome.buildNetwork(inputs, outputs);
    genome.addConnection(
        new Connection(genome.nodes.get(1), genome.nodes.get(4), 1),
        InnovationHistory
    );

    genome.addConnection(
        new Connection(genome.nodes.get(2), genome.nodes.get(4), 1),
        InnovationHistory
    );

    genome.addConnection(
        new Connection(genome.nodes.get(3), genome.nodes.get(4), 1),
        InnovationHistory
    );

    genome.initializeNetwork();
    const [output] = genome.activate([1, 1, 1]);
    t.is(output, 0.999999587075229);
});
window.onload = () => {
    const chart = (width, height, labels) => {
        console.log(d3);
        const svg = d3.select("main").append("svg").attr("width", width).attr("height", height);

        const simulation = d3
            .forceSimulation()
            .force(
                "radial",
                d3
                    .forceRadial()
                    .radius(height/8)
                    .x(width / 2)
                    .y(height / 2)
                    .strength(1)
            )
            .force(
                "charge",
                d3
                    .forceManyBody()
                    .strength(-1000)
                    .distanceMin(height / 16)
            )
            .force(
                "link",
                d3
                    .forceLink()
                    .id(d => d.id)
                    .distance(height / 8)
            )
            .on("tick", ticked);

        let link = svg
            .append("g")
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .selectAll("line");

        let node = svg
            .append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle");

        function ticked() {
            node.attr("cx", d => d.x).attr("cy", d => d.y);

            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        }
        const color = d3.scaleOrdinal(d3.schemeTableau10);

        return Object.assign(svg.node(), {
            update({ nodes, links }) {
                // Make a shallow copy to protect against mutation, while
                // recycling old nodes to preserve position and velocity.

                const old = new Map(node.data().map(d => [d.id, d]));
                nodes.forEach(node => {
                    const data = old.get(node.id);
                    if (data) {
                        const { x, y } = data;
                        node.x = x;
                        node.y = y;
                    }
                });

                nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));
                links = links.map(d => Object.assign({}, d));

                node = node
                    .data(nodes, d => d.id)
                    .join(enter =>
                        enter
                            .append("circle")
                            .attr("r", 8)
                            .attr("name", d => d.name)
                            .attr("fill", d => color(d.id))
                    );

                link = link
                    .data(links, d => [d.source, d.target])
                    .join(enter =>
                        enter
                            .append("line")
                            .attr("stroke", d =>
                                d.enabled ? (d.weight > 0 ? "#00FF00" : "#1167B1") : "#8B0000"
                            )
                            .attr("stroke-width", d => Math.abs(d.weight) + 1)
                    );

                simulation.nodes(nodes);
                simulation.force("link").links(links);
                simulation.alpha(1);
            },
        });
    };

    const labels = ["BIAS", "INPUT1", "INPUT2", "INPUT3", "OUTPUT1", "OUTPUT2"];

    const svg = chart(300, 200, labels);
    const { Neat, utils } = neatjs;

    const training = [
        [[0, 0, 0], 0],
        [[1, 0, 0], 1],
        [[0, 1, 0], 1],
        [[1, 1, 0], 0],
    ];
    const neat = new Neat(3, 2, 150, g => g.score / 16);
    setTimeout(function evolve() {
        neat.population.forEach(genome => {
            genome.trueScore = 0;
            genome.score = 0;
            utils.shuffle(training).forEach(data => {
                const [o] = genome.activate(data[0]);
                genome.trueScore += (Math.round(o) === data[1]) * 1;
                genome.score += Math.abs(o - data[1]);
            });
            genome.score = 4 - genome.score;
            genome.score *= genome.score;
        });
        if (neat.generation < 300) {
            neat.epoch();
            svg.update(neat.champ.graph(300, 200));
            setTimeout(evolve, 1000);
        }
    }, 1000);
};

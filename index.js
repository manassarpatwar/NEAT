import Neat from "./src/Population.js";
import GraphNN from "./graph/Graph.js";

const inputs = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
];
const outputs = [0, 1, 1, 0];

window.onload = setup();

function setup() {
    const canvas = document.getElementById("canvas");
    const size = 200;
    const offset = 100;
    canvas.width = size + offset;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const neat = new Neat(150, 2, 1);
    console.log(neat);

    function draw() {
        requestAnimationFrame(draw);

        if (neat.gen < 5000) {
            for (const g of neat.population) {
                for (let i = 0; i < inputs.length; i++) {
                    g.score +=
                        1 - Math.abs(g.feedForward(inputs[i]) - outputs[i]);

                    // console.log(p.think() + " "+ outputs[i]+" "+p.score);
                }
            }
            neat.naturalSelection();
            if (neat.best) {
                GraphNN(
                    ctx,
                    {
                        size,
                        offset,
                        font: "14px Helvetica",
                        labels: ["BIAS", "IN", "IN"],
                    },
                    neat.best
                );
            }
        }
    }
    draw();
}

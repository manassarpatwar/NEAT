import Neat from "./src/Neat.js";
import GraphNN from "./src/GraphNN.js";

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
    canvas.width = size;
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
                GraphNN(ctx, size, neat.best);
            }
        }
    }
    draw();
}

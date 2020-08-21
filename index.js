import Neat from "./src/Neat.js";

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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const neat = new Neat(150, 2, 1);
    console.log(neat);

    function draw() {
        requestAnimationFrame(draw);

        if (neat.gen < 500) {
            for (const g of neat.population) {
                for (let i = 0; i < inputs.length; i++) {
                    g.score +=
                        1 - Math.abs(g.feedForward(inputs[i]) - outputs[i]);

                    // console.log(p.think() + " "+ outputs[i]+" "+p.score);
                }
            }
            neat.naturalSelection();
            if (neat.best) {
                drawBest(ctx, neat.best);
            }
        }
    }
    draw();
}

function drawBest(ctx, g) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    g.computeDrawCoordinates();
    let xOffset = 20;

    for (const c of g.connections.values()) {
        ctx.beginPath();
        if (c.isEnabled()) {
            ctx.strokeStyle = "rgb(0, 255, 0)";
        } else {
            ctx.strokeStyle = "rgb(255, 0, 0)";
        }
        ctx.moveTo(
            g.nodes.get(c.inNode).vector.x + xOffset,
            g.nodes.get(c.inNode).vector.y
        );
        ctx.lineTo(
            g.nodes.get(c.outNode).vector.x + xOffset,
            g.nodes.get(c.outNode).vector.y
        );
        ctx.stroke();
    }

    for (const n of g.nodes.values()) {
        // if (n.type == "INPUT") {
        //     text("INPUT", xOffset - 10, n.vector.y + n.radius / 2);
        // } else if (n.type == "BIAS") {
        //     text("BIAS", xOffset - 10, n.vector.y + n.radius / 2);
        // }
        ctx.beginPath();
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.arc(n.vector.x + xOffset, n.vector.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

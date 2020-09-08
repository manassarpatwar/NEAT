import Neat from "../src/Neat";

const inputs = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
];
const outputs = [0, 1, 1, 0];
const neat = new Neat(2, 1, 100, g => g.score / 4);
setTimeout(function evolve() {
    neat.population.forEach(genome => {
        inputs.forEach((input, i) => {
            const [o] = genome.activate(input);
            genome.score += 1 - Math.abs(o - outputs[i]);
        });
    });
    neat.epoch();
    if (neat.generation < 500) {
        setTimeout(evolve, 1);
    }
}, 100);
export default function GraphNN(ctx, { size, offset, font, labels }, genome) {
    const layers = genome.computeNodeCoordinates(size - offset, size);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const c of genome.connections.values()) {
        ctx.beginPath();
        if (c.isEnabled()) {
            ctx.strokeStyle = "rgb(0, 255, 0)";
        } else {
            ctx.strokeStyle = "rgb(255, 0, 0)";
        }
        ctx.moveTo(
            genome.nodes.get(c.inNode).vector.x + offset,
            genome.nodes.get(c.inNode).vector.y
        );
        ctx.lineTo(
            genome.nodes.get(c.outNode).vector.x + offset,
            genome.nodes.get(c.outNode).vector.y
        );
        ctx.stroke();
    }

    for (const n of genome.nodes.values()) {
        ctx.beginPath();
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.arc(n.vector.x + offset, n.vector.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.font = font || "12px Arial";
    ctx.textBaseline = "middle";

    labels.forEach((l, i) => {
        ctx.fillText(l, offset / 10, layers[0][i].vector.y);
    });
}

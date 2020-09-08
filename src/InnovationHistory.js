export default class InnovationHistory {
    constructor(nodes=0) {
        this.innovation = 0;
        this.nodes = nodes;
        this.history = [];
    }

    getNodeId(connection) {
        for (const marker of this.history) {
            if (marker.from === connection.from.id && marker.to === connection.to.id) {
                if (marker.node) {
                    return marker.node.id;
                } else {
                    const id = this.nodes++;
                    marker.node = { id };
                    return id;
                }
            }
        }
        return false; //error
    }

    getInnovation(connection) {
        for (const marker of this.history) {
            if (marker.from === connection.from.id && marker.to === connection.to.id) {
                return marker.innovation;
            }
        }
        //new connection
        this.innovation++;
        this.history.push({
            innovation: this.innovation,
            from: connection.from.id,
            to: connection.to.id,
        });
        return this.innovation;
    }
}
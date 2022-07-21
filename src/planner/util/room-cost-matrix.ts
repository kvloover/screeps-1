export function getRoomCostMatrix(roomName: string): CostMatrix {
    if (global.roomCostMatrix && global.roomCostMatrix.hasOwnProperty(roomName)) {
        const stored = global.roomCostMatrix[roomName];
        if (stored) { return stored.clone(); }
    }

    const costs = new PathFinder.CostMatrix();
    const terrain = Game.map.getRoomTerrain(roomName);
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            const terrainType = terrain.get(x, y);
            if (terrainType == TERRAIN_MASK_WALL) {
                costs.set(x, y, 0xff);
            } else {
                costs.set(x, y, -1);
            }
        }
    }

    // store for easy reuse
    if (!global.roomCostMatrix) global.roomCostMatrix = {};
    global.roomCostMatrix[roomName] = costs;

    return costs.clone();
}

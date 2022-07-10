export interface Rectangle {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface SeededPoint extends Point {
    seedIndex: number;
}

const getAdjacentForDirect = (point: Point): Point[] =>
    findPositionsInDirections(point, { x1: point.x - 1, y1: point.y - 1, x2: point.x + 1, y2: point.y + 1 });

const getAdjacentForRectangle = (point: Point): Point[] =>
    findPositionsInsideRect({ x1: point.x - 1, y1: point.y - 1, x2: point.x + 1, y2: point.y + 1 });

export const findPositionsInsideRect = function (rect: Rectangle): Point[] {
    const positions = []
    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {
            if (x < 0 || x >= 50 ||
                y < 0 || y >= 50) continue
            positions.push({ x: x, y: y })
        }
    }
    return positions
}

export const findPositionsInDirections = function (point: Point, rect: Rectangle): Point[] {
    const positions = []
    for (let x = rect.x1; x <= rect.x2; x++) {
        if (x < 0 || x >= 50) continue;
        positions.push({ x: x, y: point.y });
    }
    for (let y = rect.y1; y <= rect.y2; y++) {
        if (y < 0 || y >= 50) continue;
        positions.push({ x: point.x, y: y });
    }
    return positions;
}

export enum distanceType {
    Chebyshev = 1,
    Manhattan = 2,
}

const getAdjacentFunction = function (type: distanceType): (point: Point) => Point[] {
    switch (type) {
        case distanceType.Chebyshev:
            return getAdjacentForRectangle;
        case distanceType.Manhattan:
            return getAdjacentForDirect;
        default:
            return getAdjacentForRectangle;
    }
}

export const distanceTransform =
    function (room: Room, initialCM: CostMatrix | undefined, type: distanceType = distanceType.Manhattan,
        enableVisuals: boolean = false, cutOff: number = 255, mapSize: Rectangle = { x1: 0, y1: 0, x2: 49, y2: 49 })
        : CostMatrix {


        const getAdjacent = getAdjacentFunction(type);

        // Use a costMatrix to record distances. Use the initialCM if provided, otherwise create one
        const distanceCM = initialCM?.clone() || new PathFinder.CostMatrix()

        for (let x = mapSize.x1; x <= mapSize.x2; x++) {
            for (let y = mapSize.y1; y <= mapSize.y2; y++) {

                // Iterate if pos is to be avoided
                if (distanceCM.get(x, y) >= cutOff) continue

                // Otherwise construct a rect and get the positions in a range of 1
                const adjacentPositions = getAdjacent({ x: x, y: y })

                // Construct the distance value as the avoid value
                let distanceValue = 255

                // Iterate through positions
                for (const adjacentPos of adjacentPositions) {
                    // Get the value of the pos in distanceCM
                    const value = distanceCM.get(adjacentPos.x, adjacentPos.y)
                    // Iterate if the value has yet to be configured
                    if (value == 0) continue
                    // If the value is to be avoided, stop the loop
                    if (value >= cutOff) { distanceValue = 1; break; }
                    // Otherwise check if the depth is less than the distance value. If so make it the new distance value plus one
                    if (value < distanceValue) distanceValue = 1 + value
                }

                // If the distance value is that of avoid, set it to 1
                if (distanceValue == 255) distanceValue = 1

                // Record the distanceValue in the distance cost matrix
                distanceCM.set(x, y, distanceValue)
            }
        }

        for (let x = mapSize.x2; x >= mapSize.x1; x--) {
            for (let y = mapSize.y2; y >= mapSize.y1; y--) {

                // Iterate if pos is to be avoided
                if (distanceCM.get(x, y) >= cutOff) continue

                // Otherwise construct a rect and get the positions in a range of 1
                const adjacentPositions = getAdjacent({ x: x, y: y })

                // Construct the distance value as the avoid value
                let distanceValue = 255

                // Iterate through positions
                for (const adjacentPos of adjacentPositions) {
                    // Get the value of the pos in distanceCM
                    const value = distanceCM.get(adjacentPos.x, adjacentPos.y)
                    // Iterate if the value has yet to be configured
                    if (value == 0) { continue; }
                    // If the value is to be avoided, stop the loop
                    if (value >= cutOff) { distanceValue = 1; break; }
                    // Otherwise check if the depth is less than the distance value. If so make it the new distance value plus one
                    if (value < distanceValue) { distanceValue = 1 + value; }
                }

                // If the distance value is that of avoid, set it to 1
                if (distanceValue == 255) distanceValue = 1

                // Record the distanceValue in the distance cost matrix
                distanceCM.set(x, y, distanceValue)

                // If roomVisuals are enabled, show the terrain's distanceValue
                if (enableVisuals && Memory.roomVisuals) {
                    room.visual.text(distanceValue.toFixed(0), x, y);
                    // room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    //     fill: 'hsl(' + 200 + distanceValue * 10 + ', 100%, 60%)',
                    //     opacity: 0.4,
                    // });
                }
            }
        }

        return distanceCM
    }

// export const floodFill =
//     function (room: Room, seeds: Point[], enableVisuals: boolean = false)
//         : CostMatrix {

//         // Construct a cost matrix for the flood
//         const floodCM = new PathFinder.CostMatrix();
//         // Get the terrain cost matrix
//         const terrain = room.getTerrain();
//         // Construct a cost matrix for visited tiles and add seeds to it
//         const visitedCM = new PathFinder.CostMatrix();

//         // Construct values for the flood
//         let depth = 0,
//             thisGeneration = seeds,
//             nextGeneration = new Array<Point>();

//         // Loop through positions of seeds
//         for (const pos of seeds) {
//             // Record the seedsPos as visited
//             visitedCM.set(pos.x, pos.y, 1);
//         }

//         // So long as there are positions in this gen
//         while (thisGeneration.length) {
//             // Reset next gen
//             nextGeneration = [];

//             // Iterate through positions of this gen
//             for (const pos of thisGeneration) {

//                 // If the depth isn't 0
//                 if (depth != 0) {
//                     // Iterate if the terrain is a wall
//                     if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) { continue; }
//                     // Otherwise so long as the pos isn't a wall record its depth in the flood cost matrix
//                     floodCM.set(pos.x, pos.y, depth);
//                     // If visuals are enabled, show the depth on the pos
//                     if (enableVisuals && Memory.roomVisuals) {
//                         room.visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, {
//                             fill: 'hsl(' + 200 + depth * 2 + ', 100%, 60%)',
//                             opacity: 0.4,
//                         });
//                     }
//                 }

//                 // Construct a rect and get the positions in a range of 1
//                 const adjacentPositions = findPositionsInsideRect({ x1: pos.x - 1, y1: pos.y - 1, x2: pos.x + 1, y2: pos.y + 1 });

//                 // Loop through adjacent positions
//                 for (const adjacentPos of adjacentPositions) {
//                     // Iterate if the adjacent pos has been visited or isn't a tile
//                     if (visitedCM.get(adjacentPos.x, adjacentPos.y) == 1) { continue; }
//                     // Otherwise record that it has been visited
//                     visitedCM.set(adjacentPos.x, adjacentPos.y, 1);
//                     // Add it to the next gen
//                     nextGeneration.push(adjacentPos);
//                 }
//             }

//             // Set this gen to next gen
//             thisGeneration = nextGeneration;
//             // Increment depth
//             depth++;
//         }

//         return floodCM
//     }

export const conditionalFloodFill =
    function (room: Room, searchMatrix: CostMatrix, seeds: Point[],
        check: (v: number) => boolean, hitByAllSeeds: boolean = false, enableVisuals: boolean = false, cutOff: number = 255)
        : Point | undefined {

        // Construct a cost matrix for visited tiles and add seeds to it

        // array of costmatrix with new constmatrix for each seed
        const visitedCMs: CostMatrix[] = [];
        const potentials: Point[][] = [];
        seeds.forEach(_ => {
            potentials.push([]);
            visitedCMs.push(new PathFinder.CostMatrix());
        });

        // Construct values for the flood
        let depth = 0;
        let thisGeneration: SeededPoint[] = seeds.map((seed, ind) => ({ x: seed.x, y: seed.y, seedIndex: ind }));
        let nextGeneration: SeededPoint[] = [];

        // Loop through positions of seeds
        for (const pos of seeds) {
            // Record the seedsPos as visited
            visitedCMs.forEach(cm => cm.set(pos.x, pos.y, 1));
        }

        // So long as there are positions in this gen
        while (thisGeneration.length) {
            // Reset next gen
            nextGeneration = [];

            // Iterate through positions of this gen
            for (const pos of thisGeneration) {

                const visitedCM = visitedCMs[pos.seedIndex];

                // If the depth isn't 0
                if (depth != 0) {
                    const value = searchMatrix.get(pos.x, pos.y);
                    // Iterate if the terrain is to be avoided
                    if (value == 255) { continue; }
                    // If visuals are enabled, show the depth on the pos
                    if (enableVisuals && Memory.roomVisuals) {
                        room.visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, {
                            fill: 'hsl(' + pos.seedIndex * 200 / (seeds.length - 1) + depth * 2 + ', 100%, 60%)',
                            opacity: 0.4,
                        });
                    }

                    if (value < cutOff && check(value)) {
                        if (!hitByAllSeeds) {
                            return pos as Point;
                        }
                        potentials[pos.seedIndex].push(pos);
                        // if all potentials have this pos return the position
                        if (!potentials.some(arr => arr.length == 0 || !arr.some(p => p.x == pos.x && p.y == pos.y))) {
                            return pos as Point;
                        }
                    }
                }

                // Construct a rect and get the positions in a range of 1
                const adjacentPositions = findPositionsInsideRect({ x1: pos.x - 1, y1: pos.y - 1, x2: pos.x + 1, y2: pos.y + 1 });

                // Loop through adjacent positions
                for (const adjacentPos of adjacentPositions) {
                    // Iterate if the adjacent pos has been visited or isn't a tile
                    if (visitedCM.get(adjacentPos.x, adjacentPos.y) == 1) { continue; }
                    // Otherwise record that it has been visited
                    visitedCM.set(adjacentPos.x, adjacentPos.y, 1);
                    // Add it to the next gen
                    nextGeneration.push({ x: adjacentPos.x, y: adjacentPos.y, seedIndex: pos.seedIndex });
                }
            }

            // Set this gen to next gen
            thisGeneration = nextGeneration;
            // Increment depth
            depth++;
        }

        return undefined
    }

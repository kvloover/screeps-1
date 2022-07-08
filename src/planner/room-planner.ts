// import * as mincut from "utils/mincut"
// import "utils/floodFill";
// import "utils/distanceTransform";

import { RoomDrawings } from "room/room-drawings";
import { singleton } from "tsyringe";
import { SOURCE } from "utils/custom-types";
import { conditionalFloodFill, distanceTransform, floodFill } from "utils/distance-util";
import { Plan } from "./data";
import data from "./data/core-stamps.json";

@singleton()
export class RoomPlanner {

    constructor(private drawings: RoomDrawings) { }

    public runDistanceTransform(room: Room): void {
        const distMatrix = distanceTransform(room, this.getRoomCostMatrix(room), true);
        floodFill(room, [])
    }

    public getRoomCostMatrix(room: Room): CostMatrix {
        const costs = new PathFinder.CostMatrix();
        const terrain = Game.map.getRoomTerrain(room.name);
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
        return costs;
    }

    public getStampsFromCoreFile(): Plan {
        return data as Plan;
    }

    public planRoom(room: Room): void {
        const sources = room.memory.objects?.[SOURCE];
        const controller = global.refs?.[room.name]?.objects?.[STRUCTURE_CONTROLLER];
        if (!controller || !sources) return;
        if (controller.length == 0 || sources.length == 0) return;

        const locs = sources.map(s => s.pos).concat(controller[0].pos);

        const terrainMatrix = this.getRoomCostMatrix(room);
        const reserveLocations = terrainMatrix.clone();
        // add squares around source locations to terainMatrix as value 255 - cost of unwalkable terrain
        for (let loc of locs) {
            for (let x = loc.x - 1; x <= loc.x + 1; x++) {
                for (let y = loc.y - 1; y <= loc.y + 1; y++) {
                    reserveLocations.set(x, y, 255);
                }
            }
        }
        const distMatrix = distanceTransform(room, reserveLocations, false);
        // add locations around seeds back for floodFill
        for (let loc of locs) {
            for (let x = loc.x - 1; x <= loc.x + 1; x++) {
                for (let y = loc.y - 1; y <= loc.y + 1; y++) {
                    const terrain = terrainMatrix.get(x, y);
                    distMatrix.set(x, y, terrain);
                }
            }
        }

        const visual = new RoomVisual(room.name);
        // store current visual for later
        const tickVisuals = visual.export();
        visual.clear();

        const data = this.getStampsFromCoreFile();
        // for each plan in plan.plans, run conditionalFloodFill and exit if point found for the given size (max x/y)
        for (let plan of data.plans) {
            const size = Math.max(plan.size.x, plan.size.y);
            // run flood fill from seeds and exit as soon as we find a point hit by all
            const seeds = locs.map(pos => { return { x: pos.x, y: pos.y } });
            const point = conditionalFloodFill(room, distMatrix, seeds, n => n >= size, true);
            if (!point) { continue; }
            console.log(`point: ${point.x}, ${point.y}`);

            // add buildings in plan to matrix
            for (let building of Object.entries(plan.buildings)) {
                const buildingData = building[1];
                for (let pos of buildingData.pos) {
                    terrainMatrix.set(point.x + pos.x, point.y + pos.y, 255);
                    visual.structure(point.x + pos.x, point.y + pos.y, building[0] as StructureConstant, { opacity: 0.5 });
                }
            }
        }

        // store plan for keeping it visualized
        this.drawings.persist('plan', visual);

        visual.clear();
        visual.import(tickVisuals);

        const matrix2 = distanceTransform(room, terrainMatrix, true)

    }

}

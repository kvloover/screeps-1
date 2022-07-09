// import * as mincut from "utils/mincut"
// import "utils/floodFill";
// import "utils/distanceTransform";

import { RoomDrawings } from "room/room-drawings";
import { singleton } from "tsyringe";
import { SOURCE } from "utils/custom-types";
import { conditionalFloodFill, distanceTransform, Point } from "utils/distance-util";
import { Plan } from "./data";

import core from "./data/core-stamps.json";
import extension from "./data/extension-stamps.json";
import lab from "./data/lab-stamps.json";

@singleton()
export class RoomPlanner {

    private _buildingMap = new Map<StructureConstant, number>(
        [
            [STRUCTURE_ROAD, 201],
            [STRUCTURE_SPAWN, 221],
            [STRUCTURE_EXTENSION, 222],
            [STRUCTURE_CONTAINER, 223],
            [STRUCTURE_STORAGE, 224],
            [STRUCTURE_LINK, 225],
            [STRUCTURE_TERMINAL, 226],
            [STRUCTURE_RAMPART, 227],
            [STRUCTURE_WALL, 228],
            [STRUCTURE_TOWER, 229],
            [STRUCTURE_OBSERVER, 230],
            [STRUCTURE_NUKER, 231],
            [STRUCTURE_POWER_SPAWN, 232],
            [STRUCTURE_EXTRACTOR, 233],
            [STRUCTURE_LAB, 234],
            [STRUCTURE_FACTORY, 235],
        ]);


    constructor(private drawings: RoomDrawings) { }

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

    public getCorestamps(): Plan {
        return core as Plan;
    }

    public getExtensionStamps(): Plan {
        return extension as Plan;
    }

    public getLabStamps(): Plan {
        return lab as Plan;
    }

    public planRoom(room: Room): void {
        const sources = room.memory.objects?.[SOURCE];
        const controller = global.refs?.[room.name]?.objects?.[STRUCTURE_CONTROLLER];
        if (!controller || !sources) return;
        if (controller.length == 0 || sources.length == 0) return;

        const locs = sources.map(s => s.pos).concat(controller[0].pos);

        let terrainMatrix = this.getRoomCostMatrix(room);
        // add squares around source locations to terainMatrix as value 255 - cost of unwalkable terrain
        for (let loc of locs) {
            for (let x = loc.x - 1; x <= loc.x + 1; x++) {
                for (let y = loc.y - 1; y <= loc.y + 1; y++) {
                    terrainMatrix.set(x, y, 254);
                }
            }
        }
        const distMatrix = distanceTransform(room, terrainMatrix, false);

        const visual = new RoomVisual(room.name);
        // store current visual for later
        const tickVisuals = visual.export();
        visual.clear();

        const data = this.getCorestamps();
        let anchor: Point | undefined = undefined;
        // for each plan in plan.plans, run conditionalFloodFill and exit if point found for the given size (max x/y)
        for (let plan of data.plans) {
            const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
            // run flood fill from seeds and exit as soon as we find a point hit by all
            const seeds = locs.map(pos => { return { x: pos.x, y: pos.y } });
            anchor = conditionalFloodFill(room, distMatrix, seeds, n => n >= size, true);
            if (!anchor) { continue; }
            console.log(`point: ${anchor.x}, ${anchor.y}`);

            // add buildings in plan to matrix
            for (let building of Object.entries(plan.buildings)) {
                const buildingData = building[1];

                const type = building[0] as StructureConstant;
                if (!type) { continue; }
                const buildValue = this._buildingMap.get(type) || 254;

                for (let pos of buildingData.pos) {
                    terrainMatrix.set(anchor.x + pos.x, anchor.y + pos.y, buildValue);
                    visual.structure(anchor.x + pos.x, anchor.y + pos.y, building[0] as StructureConstant, { opacity: 0.5 });
                }
            }
        }

        // store plan for keeping it visualized
        this.drawings.persist('core', visual);

        visual.clear();
        visual.import(tickVisuals);

        if (anchor) {
            terrainMatrix = this.planLab(room, anchor, terrainMatrix);
            terrainMatrix = this.planExtensions(room, anchor, terrainMatrix);
        }

    }

    private planLab(room: Room, anchor: Point, terrainMatrix: CostMatrix): CostMatrix {

        const visual = new RoomVisual(room.name);
        const tickVisuals = visual.export();
        visual.clear();

        const data = this.getLabStamps();

        const dt = distanceTransform(room, terrainMatrix, false, 220); // do not include roads
        let center: Point | undefined = undefined;
        for (let plan of data.plans) {
            const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
            center = conditionalFloodFill(room, dt, [anchor], n => n >= size, true, false, 220);
            if (!center) { continue; }
            console.log(`center for ${plan.name}: ${center.x}, ${center.y} - size: ${size}`);

            // add buildings in plan to matrix
            for (let building of Object.entries(plan.buildings)) {
                const buildingData = building[1];

                const type = building[0] as StructureConstant;
                if (!type) { continue; }
                const buildValue = this._buildingMap.get(type) || 254;

                for (let pos of buildingData.pos) {
                    const point = { x: center.x + pos.x, y: center.y + pos.y };

                    // compare current location with building
                    const locValue = terrainMatrix.get(point.x, point.y);
                    if (locValue > 200 && (locValue == 254 || locValue != buildValue)) { continue; }

                    terrainMatrix.set(point.x, point.y, buildValue);
                    visual.structure(point.x, point.y, building[0] as StructureConstant, { opacity: 0.3 });
                }
            }
        }

        // store plan for keeping it visualized
        this.drawings.persist('lab', visual);

        visual.clear();
        visual.import(tickVisuals);

        return terrainMatrix;
    }

    private planExtensions(room: Room, anchor: Point, terrainMatrix: CostMatrix): CostMatrix {

        const visual = new RoomVisual(room.name);
        const tickVisuals = visual.export();
        visual.clear();

        const data = this.getExtensionStamps();
        const sorted = data.plans.sort((a, b) => a.priority - b.priority);
        let extensions = 0;
        while (extensions < 50) {
            const dt = distanceTransform(room, terrainMatrix, false, 220); // do not include roads
            let center: Point | undefined = undefined;
            let index = 0;
            while (!center && index < sorted.length) {
                // try to fit the plan in the room
                const plan = sorted[index];
                index++;

                const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2)) - 1; // naive attempt to overlap with other extensions
                center = conditionalFloodFill(room, dt, [anchor], n => n >= size, true, false, 220);
                if (!center) { continue; }

                // add buildings in plan to matrix
                console.log(`center for ${plan.name}: ${center.x}, ${center.y} - size: ${size}`);
                for (let building of Object.entries(plan.buildings)) {
                    const buildingData = building[1];

                    const type = building[0] as StructureConstant;
                    if (!type) { continue; }
                    const buildValue = this._buildingMap.get(type) || 254;

                    for (let pos of buildingData.pos) {
                        const point = { x: center.x + pos.x, y: center.y + pos.y };

                        // compare current location with building
                        const locValue = terrainMatrix.get(point.x, point.y);
                        if (locValue > 200 && (locValue == 254 || locValue != buildValue)) { continue; }
                        console.log(`locValue: ${locValue} for point ${point.x}, ${point.y}`);

                        if (building[0] == STRUCTURE_EXTENSION && extensions >= 50) { break; }
                        if (building[0] == STRUCTURE_EXTENSION) { extensions++; }
                        terrainMatrix.set(point.x, point.y, buildValue);
                        visual.structure(point.x, point.y, building[0] as StructureConstant, { opacity: 0.3 });
                    }
                }
            }
            if (!center) { break; } // couldn't fit any more extensions
        }

        // store plan for keeping it visualized
        this.drawings.persist('extensions', visual);

        visual.clear();
        visual.import(tickVisuals);

        return terrainMatrix;
    }

}

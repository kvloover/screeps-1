import { RoomDrawings } from "room/room-drawings";
import { singleton } from "tsyringe";
import { SOURCE } from "utils/custom-types";
import { conditionalFloodFill, distanceTransform, distanceType, Point } from "utils/distance-util";
import { Plan } from "./data";

import core from "./data/core-stamps.json";
import extension from "./data/extension-stamps.json";
import lab from "./data/lab-stamps.json";

import util_mincut, { Rect } from "../utils/mincut";

export interface PlannedStructure {
    type: BuildableStructureConstant;
    pos: RoomPosition;
}

@singleton()
export class RoomPlanner {

    private _buildingMap = new Map<BuildableStructureConstant, number>(
        [
            [STRUCTURE_ROAD, 201],
            [STRUCTURE_SPAWN, 260],
            [STRUCTURE_EXTENSION, 261],
            [STRUCTURE_CONTAINER, 262],
            [STRUCTURE_STORAGE, 263],
            [STRUCTURE_LINK, 264],
            [STRUCTURE_TERMINAL, 265],
            [STRUCTURE_RAMPART, 266],
            [STRUCTURE_WALL, 267],
            [STRUCTURE_TOWER, 268],
            [STRUCTURE_OBSERVER, 269],
            [STRUCTURE_NUKER, 270],
            [STRUCTURE_POWER_SPAWN, 271],
            [STRUCTURE_EXTRACTOR, 272],
            [STRUCTURE_LAB, 273],
            [STRUCTURE_FACTORY, 274],
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

    public test(room: Room): void {
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

        const visual = new RoomVisual(room.name);
        // store current visual for later
        const tickVisuals = visual.export();
        visual.clear();

        const distMatrix = distanceTransform(room, terrainMatrix, distanceType.Chebyshev, true, undefined, { x1: 2, y1: 2, x2: 47, y2: 47 });

        this.drawings.persist('distance', visual);

        visual.clear();
        visual.import(tickVisuals);
    }

    public planRoom(room: Room): void {
        // todo determine algorithm on type of stamp
        // symmetric manhattan
        // asymmetric chebyshev

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
                    if (terrainMatrix.get(x, y) < 255) {
                        terrainMatrix.set(x, y, 254);
                    }
                }
            }
        }
        const distMatrix = distanceTransform(room, terrainMatrix, distanceType.Chebyshev, false, undefined, { x1: 2, y1: 2, x2: 47, y2: 47 });

        const visual = new RoomVisual(room.name);
        // store current visual for later
        const tickVisuals = visual.export();
        visual.clear();

        const data = this.getCorestamps();
        let anchor: Point | undefined = undefined;
        // for each plan in plan.plans, run conditionalFloodFill and exit if point found for the given size (max x/y)
        const planned: PlannedStructure[] = [];
        for (let plan of data.plans) {
            const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
            // run flood fill from seeds and exit as soon as we find a point hit by all
            const seeds = locs.map(pos => { return { x: pos.x, y: pos.y } });
            anchor = conditionalFloodFill(room, distMatrix, seeds, n => n >= size, true);
            if (!anchor) { continue; }

            // add buildings in plan to matrix
            for (let building of Object.entries(plan.buildings)) {
                const buildingData = building[1];

                const type = building[0] as BuildableStructureConstant;
                if (!type) { continue; }
                const buildValue = this._buildingMap.get(type) || 254;

                for (let pos of buildingData.pos) {
                    const point = { x: anchor.x + pos.x, y: anchor.y + pos.y }
                    terrainMatrix.set(point.x, point.y, buildValue);
                    visual.structure(point.x, point.y, type, { opacity: 0.5 });
                    planned.push({ type, pos: new RoomPosition(point.x, point.y, room.name) });
                }
                visual.connectRoads({ width: 0.2 });
            }
        }

        // store plan for keeping it visualized
        this.drawings.persist('core', visual);

        visual.clear();
        visual.import(tickVisuals);

        if (anchor) {
            const labs = this.planLab(room, anchor, terrainMatrix);
            const extensions = this.planExtensions(room, anchor, terrainMatrix);
            const roads = this.planMainRoads(room, anchor, locs, terrainMatrix);

            this.planPerimeter(room, labs.concat(extensions));
        }

        // this.visualizeTerrainMatrix(room, terrainMatrix);
    }

    private visualizeTerrainMatrix(room: Room, terrainMatrix: CostMatrix): void {
        const visual = new RoomVisual(room.name);
        // store current visual for later
        const tickVisuals = visual.export();
        visual.clear();

        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const value = terrainMatrix.get(x, y);
                visual.text(value.toString(), x, y, { color: 'white' });
            }
        }

        this.drawings.persist('terrain', visual);

        visual.clear();
        visual.import(tickVisuals);
    }

    private planMainRoads(room: Room, anchor: Point, locs: RoomPosition[], terrainMatrix: CostMatrix): PlannedStructure[][] {

        const planned: PlannedStructure[][] = [];

        const visual = new RoomVisual(room.name);
        const tickVisuals = visual.export();
        visual.clear();

        const roadValue = this._buildingMap.get(STRUCTURE_ROAD) || 254;
        const matrix = terrainMatrix.clone();
        // substitute roadValue in matrix with 0
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                if (matrix.get(x, y) == roadValue) {
                    matrix.set(x, y, 0);
                }
            }
        }

        // this.visualizeTerrainMatrix(room, matrix);

        // plot roads to seed locations
        const roomPos = new RoomPosition(anchor.x, anchor.y, room.name);
        for (const loc of locs) {
            const ret = PathFinder.search(roomPos, { pos: loc, range: 1 }, { roomCallback: _ => matrix });
            if (ret.incomplete) { continue; }

            const strutures: PlannedStructure[] = [];
            for (let path of ret.path) {
                terrainMatrix.set(path.x, path.y, roadValue);
                visual.structure(path.x, path.y, STRUCTURE_ROAD, { opacity: 0.5 });
                strutures.push({ type: STRUCTURE_ROAD, pos: new RoomPosition(path.x, path.y, room.name) });
            }
            planned.push(strutures);
        }
        visual.connectRoads({ width: 0.2 });

        // store plan for keeping it visualized
        this.drawings.persist('mains', visual);

        visual.clear();
        visual.import(tickVisuals);

        return planned;
    }

    private planLab(room: Room, anchor: Point, terrainMatrix: CostMatrix): PlannedStructure[][] {

        const planned: PlannedStructure[][] = [];

        const visual = new RoomVisual(room.name);
        const tickVisuals = visual.export();
        visual.clear();

        const data = this.getLabStamps();

        const dt = distanceTransform(room, terrainMatrix, distanceType.Chebyshev, false, 220, { x1: 2, y1: 2, x2: 47, y2: 47 }); // do not include roads
        let center: Point | undefined = undefined;
        for (let plan of data.plans) {
            const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
            center = conditionalFloodFill(room, dt, [anchor], n => n >= size, true, false, 220);
            if (!center) { continue; }

            // add buildings in plan to matrix
            const strutures: PlannedStructure[] = [];
            for (let building of Object.entries(plan.buildings)) {
                const buildingData = building[1];

                const type = building[0] as BuildableStructureConstant;
                if (!type) { continue; }
                const buildValue = this._buildingMap.get(type) || 254;

                for (let pos of buildingData.pos) {
                    const point = { x: center.x + pos.x, y: center.y + pos.y };

                    // compare current location with building
                    const locValue = terrainMatrix.get(point.x, point.y);
                    if (locValue > 200 && (locValue == 254 || locValue != buildValue)) { continue; }

                    terrainMatrix.set(point.x, point.y, buildValue);
                    visual.structure(point.x, point.y, building[0] as BuildableStructureConstant, { opacity: 0.3 });

                    strutures.push({ type, pos: new RoomPosition(point.x, point.y, room.name) });
                }
                visual.connectRoads({ width: 0.2 });
            }
            planned.push(strutures);
        }

        // store plan for keeping it visualized
        this.drawings.persist('lab', visual);

        visual.clear();
        visual.import(tickVisuals);

        return planned;
    }

    private planExtensions(room: Room, anchor: Point, terrainMatrix: CostMatrix): PlannedStructure[][] {

        const planned: PlannedStructure[][] = [];

        const visual = new RoomVisual(room.name);
        const tickVisuals = visual.export();
        visual.clear();

        const data = this.getExtensionStamps();
        const sorted = data.plans.sort((a, b) => a.priority - b.priority);
        let extensions = 0;
        while (extensions < 50) {
            const dt = distanceTransform(room, terrainMatrix, distanceType.Manhattan, false, 220, { x1: 2, y1: 2, x2: 47, y2: 47 }); // do not include roads
            let center: Point | undefined = undefined;
            let index = 0;
            while (!center && index < sorted.length) {
                // try to fit the plan in the room
                const plan = sorted[index];
                index++;

                const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
                center = conditionalFloodFill(room, dt, [anchor], n => n >= size, true, false, 220);
                if (!center) { continue; }

                // add buildings in plan to matrix
                const strutures: PlannedStructure[] = [];
                for (let building of Object.entries(plan.buildings)) {
                    const buildingData = building[1];

                    const type = building[0] as BuildableStructureConstant;
                    if (!type) { continue; }
                    const buildValue = this._buildingMap.get(type) || 254;

                    for (let pos of buildingData.pos) {
                        const point = { x: center.x + pos.x, y: center.y + pos.y };

                        // compare current location with building
                        const locValue = terrainMatrix.get(point.x, point.y);
                        if (locValue > 200 && (locValue == 254 || locValue != buildValue)) { continue; }
                        if (building[0] == STRUCTURE_EXTENSION && extensions >= 50) { break; }
                        if (building[0] == STRUCTURE_EXTENSION) { extensions++; }
                        terrainMatrix.set(point.x, point.y, buildValue);
                        visual.structure(point.x, point.y, building[0] as StructureConstant, { opacity: 0.3 });

                        strutures.push({ type, pos: new RoomPosition(point.x, point.y, room.name) });
                    }
                    visual.connectRoads({ width: 0.2 });
                }
                planned.push(strutures);
            }
            if (!center) { break; } // couldn't fit any more extensions
        }

        // store plan for keeping it visualized
        this.drawings.persist('extensions', visual);

        visual.clear();
        visual.import(tickVisuals);

        return planned;
    }

    private planPerimeter(room: Room, protect: PlannedStructure[][]): PlannedStructure[] {
        const cuts = util_mincut.GetCutTiles(room.name, protect.map(p => this.plannedToRect(p)));

        const visual = new RoomVisual(room.name);
        // store current visual for later
        const tickVisuals = visual.export();
        visual.clear();

        for (let cut of cuts) {
            visual.structure(cut.x, cut.y, STRUCTURE_RAMPART, { opacity: 0.5 });
        }

        this.drawings.persist('perimeter', visual);

        visual.clear();
        visual.import(tickVisuals);

        return [];
    }

    private plannedToRect(plan: PlannedStructure[]): Rect {
        return {
            x1: plan.map(s => s.pos.x).reduce((a, b) => Math.min(a, b)),
            y1: plan.map(s => s.pos.y).reduce((a, b) => Math.min(a, b)),
            x2: plan.map(s => s.pos.x).reduce((a, b) => Math.max(a, b)),
            y2: plan.map(s => s.pos.y).reduce((a, b) => Math.max(a, b))
        }
    }

}

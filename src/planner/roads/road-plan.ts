import { singleton } from 'tsyringe';

import { BUILDING_MAP, IPlan, PlanCreateFn, PlannedStructure } from '../plan';

@singleton()
export class RoadPlan implements IPlan {
    name = 'road';

    constructor() { }

    create: PlanCreateFn = (roomName, poi, terrain): PlannedStructure[][] => {
        const planned: PlannedStructure[][] = [];
        const visual = new RoomVisual(roomName);

        if (!('anchor' in poi)) { return planned; }

        const roadValue = BUILDING_MAP.get(STRUCTURE_ROAD) || 254;
        const matrix = terrain.clone();
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
        const anchor = poi['anchor'][0];
        const roomPos = new RoomPosition(anchor.x, anchor.y, roomName);
        const locs = poi['source'].concat(poi['controller']);

        for (const loc of locs) {
            const ret = PathFinder.search(roomPos, { pos: loc, range: 1 }, { roomCallback: _ => matrix });
            if (ret.incomplete) { continue; }

            const structures: PlannedStructure[] = [];
            for (let path of ret.path) {
                terrain.set(path.x, path.y, roadValue);
                visual.structure(path.x, path.y, STRUCTURE_ROAD, { opacity: 0.5 });
                structures.push({ type: STRUCTURE_ROAD, pos: new RoomPosition(path.x, path.y, roomName) });
            }
            planned.push(structures);
        }
        visual.connectRoads({ width: 0.2 });

        return planned;
    }

}

import { Logger } from 'logger';
import { singleton } from 'tsyringe';

import { IPlan, PlanCreateFn, PlanKey, StructurePlan } from '../../entities/plan';
import { BUILDING_MAP, RESERVED_LOCATION } from '../../util/constants';

@singleton()
export class RoadPlan implements IPlan {
    name: PlanKey = 'road';

    constructor(private log: Logger) { }

    create: PlanCreateFn = (roomName, poi, terrain): StructurePlan[][] => {

        this.log.info(roomName, 'Planning main roads');

        const planned: StructurePlan[][] = [];
        const visual = new RoomVisual(roomName);

        if (!('anchor' in poi)) { return planned; }

        const roadValue = BUILDING_MAP.get(STRUCTURE_ROAD) || 254;
        const matrix = terrain.clone();
        // substitute roadValue in matrix with 0
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const value = matrix.get(x, y);
                if (value == roadValue || value == RESERVED_LOCATION) {
                    matrix.set(x, y, 0);
                } else if (value > roadValue) {
                    matrix.set(x, y, 255); // buildings
                }
            }
        }

        visual.costMatrix(matrix);

        // plot roads to seed locations
        const anchor = poi['anchor']?.[0];
        if (!anchor) return planned;
        this.log.trace(roomName, `Planning roads from anchor: ${anchor.x},${anchor.y}`);

        const roomPos = new RoomPosition(anchor.x, anchor.y, roomName);
        const locs = poi['source']?.concat(poi['controller'] || []);

        for (const loc of locs || []) {
            this.log.trace(roomName, `Planning road to ${loc.x},${loc.y}`);

            const ret = PathFinder.search(roomPos, { pos: loc, range: 1 }, { roomCallback: _ => matrix });
            if (ret.incomplete) { continue; }

            this.log.trace(roomName, `Planning road to ${loc.x},${loc.y} using path ${ret.path.map(i => `${i.x},${i.y}`).join(';')}`);

            const structures: StructurePlan[] = [];
            for (let path of ret.path) {
                terrain.set(path.x, path.y, roadValue);
                visual.structure(path.x, path.y, STRUCTURE_ROAD, { opacity: 0.5 });
                structures.push({ plan: this.name, type: STRUCTURE_ROAD, pos: new RoomPosition(path.x, path.y, roomName) });
            }
            planned.push(structures);
        }
        visual.connectRoads({ width: 0.2 });

        return planned;
    }

}

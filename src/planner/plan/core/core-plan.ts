import { singleton } from 'tsyringe';

import { BUILDING_MAP, IPlan, PlanCreateFn, PlanKey, StructurePlan } from '../../plan';
import { Plan } from '../../data';

import { conditionalFloodFill, distanceTransform, distanceType, Point } from 'utils/distance-util';

import stamps from "./core-stamps.json";

@singleton()
export class CorePlan implements IPlan {
    name: PlanKey = 'core';

    constructor() { }

    public getStamps(): Plan {
        return stamps as Plan;
    }

    create: PlanCreateFn = (roomName, poi, terrain): StructurePlan[][] => {
        const structures: StructurePlan[] = [];
        const visual = new RoomVisual(roomName);
        const data = this.getStamps();

        const distMatrix = distanceTransform(roomName, terrain, distanceType.Chebyshev, false, undefined, { x1: 2, y1: 2, x2: 47, y2: 47 });

        const locs = poi['source']?.concat(poi['controller'] || [])  || [];

        let anchor: Point | undefined = undefined;
        // for each plan in plan.plans, run conditionalFloodFill and exit if point found for the given size (max x/y)
        for (let plan of data.plans) {
            const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
            // run flood fill from seeds and exit as soon as we find a point hit by all
            const seeds = locs.map(pos => { return { x: pos.x, y: pos.y } });
            anchor = conditionalFloodFill(roomName, distMatrix, seeds, n => n >= size, true);
            if (!anchor) { continue; }

            // add buildings in plan to matrix
            for (let building of Object.entries(plan.buildings)) {
                const buildingData = building[1];

                const type = building[0] as BuildableStructureConstant;
                if (!type) { continue; }
                const buildValue = BUILDING_MAP.get(type) || 254;

                for (let pos of buildingData.pos) {
                    const point = { x: anchor.x + pos.x, y: anchor.y + pos.y }
                    terrain.set(point.x, point.y, buildValue);
                    visual.structure(point.x, point.y, type, { opacity: 0.5 });
                    structures.push({ plan: this.name, type, pos: new RoomPosition(point.x, point.y, roomName) });
                }
                visual.connectRoads({ width: 0.2 });
            }
        }

        if (anchor) { poi['anchor'] = [new RoomPosition(anchor.x, anchor.y, roomName)] }

        return [structures];
    }

}

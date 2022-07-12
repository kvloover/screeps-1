import { singleton } from 'tsyringe';

import { BUILDING_MAP, IPlan, PlanCreateFn, PlanKey, StructurePlan } from '../../entities/plan';
import { StampCollection } from '../../entities/stamp';

import { conditionalFloodFill, distanceTransform, distanceType, Point } from 'utils/distance-util';

import stamps from "./lab-stamps.json";

@singleton()
export class LabPlan implements IPlan {
    name: PlanKey  = 'lab';

    constructor() { }

    public getStamps(): StampCollection {
        return stamps as StampCollection;
    }

    create: PlanCreateFn = (roomName, poi, terrain): StructurePlan[][] => {
        const planned: StructurePlan[][] = [];
        const visual = new RoomVisual(roomName);
        const data = this.getStamps();

        if (!('anchor' in poi)) { return planned; }

        const dt = distanceTransform(roomName, terrain, distanceType.Chebyshev, false, 220, { x1: 2, y1: 2, x2: 47, y2: 47 }); // do not include roads
        let center: Point | undefined = undefined;
        for (let plan of data.plans) {
            const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
            center = conditionalFloodFill(roomName, dt, poi['anchor'] || [], n => n >= size, true, false, 220);
            if (!center) { continue; }

            // add buildings in plan to matrix
            const structures: StructurePlan[] = [];
            for (let building of Object.entries(plan.buildings)) {
                const buildingData = building[1];

                const type = building[0] as BuildableStructureConstant;
                if (!type) { continue; }
                const buildValue = BUILDING_MAP.get(type) || 254;

                for (let pos of buildingData.pos) {
                    const point = { x: center.x + pos.x, y: center.y + pos.y };

                    // compare current location with building
                    const locValue = terrain.get(point.x, point.y);
                    if (locValue > 200 && (locValue == 254 || locValue != buildValue)) { continue; }

                    terrain.set(point.x, point.y, buildValue);
                    visual.structure(point.x, point.y, building[0] as BuildableStructureConstant, { opacity: 0.3 });

                    structures.push({ plan: this.name, type, pos: new RoomPosition(point.x, point.y, roomName) });
                }
                visual.connectRoads({ width: 0.2 });
            }
            planned.push(structures);
        }

        return planned;
    }

}

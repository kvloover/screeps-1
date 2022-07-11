import { singleton } from 'tsyringe';

import { BUILDING_MAP, IPlan, PlanCreateFn, PlanKey, PlannedStructure } from '../../plan';
import { Plan } from '../../data';

import { conditionalFloodFill, distanceTransform, distanceType, Point } from 'utils/distance-util';

import stamps from "./extension-stamps.json";

@singleton()
export class ExtensionsPlan implements IPlan {
    name: PlanKey  = 'extensions';

    constructor() { }

    public getStamps(): Plan {
        return stamps as Plan;
    }

    create: PlanCreateFn = (roomName, poi, terrain): PlannedStructure[][] => {
        const planned: PlannedStructure[][] = [];
        const visual = new RoomVisual(roomName);
        const data = this.getStamps();

        if (!('anchor' in poi)) { return planned; }

        const sorted = data.plans.sort((a, b) => a.priority - b.priority);
        let extensions = 0;
        while (extensions < 50) {
            const dt = distanceTransform(roomName, terrain, distanceType.Manhattan, false, 220, { x1: 2, y1: 2, x2: 47, y2: 47 }); // do not include roads
            let center: Point | undefined = undefined;
            let index = 0;
            while (!center && index < sorted.length) {
                // try to fit the plan in the room
                const plan = sorted[index];
                index++;

                const size = Math.max(Math.ceil((plan.size.x + 1) / 2), Math.ceil((plan.size.y + 1) / 2));
                center = conditionalFloodFill(roomName, dt, poi['anchor'] || [], n => n >= size, true, false, 220);
                if (!center) { continue; }

                // add buildings in plan to matrix
                const structures: PlannedStructure[] = [];
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
                        if (building[0] == STRUCTURE_EXTENSION && extensions >= 50) { break; }
                        if (building[0] == STRUCTURE_EXTENSION) { extensions++; }
                        terrain.set(point.x, point.y, buildValue);
                        visual.structure(point.x, point.y, building[0] as StructureConstant, { opacity: 0.3 });

                        structures.push({ plan: this.name, type, pos: new RoomPosition(point.x, point.y, roomName) });
                    }
                    visual.connectRoads({ width: 0.2 });
                }
                planned.push(structures);
            }
            if (!center) { break; } // couldn't fit any more extensions
        }

        return planned;
    }

}

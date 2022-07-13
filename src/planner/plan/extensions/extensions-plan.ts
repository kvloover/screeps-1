import { singleton } from 'tsyringe';

import { IPlan, PlanCreateFn, PlanKey, StructurePlan } from '../../entities/plan';
import { BUILDING_MAP, CUTOFF_WALKABLE } from '../../util/constants';
import { StampCollection } from '../../entities/stamp';

import { findPointFor, distanceTransform, distanceType, Point, outerPerimeter } from 'utils/distance-util';

import stamps from "./extension-stamps.json";
import { Logger } from 'logger';

@singleton()
export class ExtensionsPlan implements IPlan {
    name: PlanKey = 'extensions';

    constructor(private log: Logger) { }

    public getStamps(): StampCollection {
        return stamps as StampCollection;
    }

    create: PlanCreateFn = (roomName, poi, terrain): StructurePlan[][] => {
        const planned: StructurePlan[][] = [];
        const visual = new RoomVisual(roomName);
        const data = this.getStamps();

        if (!('anchor' in poi)) { return planned; }

        // get initial seeds as outer side of anchor stamp
        const seeds = outerPerimeter(roomName, terrain, poi.anchor?.map(i => { return { x: i.x, y: i.y } }) || [], false, CUTOFF_WALKABLE);
        this.log.debug(roomName, `ExtensionPlan: anchor seeds: ${seeds.map(x => `${x.x},${x.y}`).join(';')}`);

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
                center = findPointFor(roomName, dt, seeds, n => n >= size, false, false, CUTOFF_WALKABLE);
                if (!center) { continue; }

                // update seeds for next plan
                const borderStamps = this.borderStamp(center, size);
                this.log.debug(roomName, `ExtensionPlan: border seeds for center ${center.x},${center.y}: ${borderStamps.map(x => `${x.x},${x.y}`).join(';')}`);
                borderStamps.forEach(p => seeds.push(p));

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

    private borderStamp(center: Point, size: number): Point[] {
        // consider currently using a diamond stamp
        const points: Point[] = [];
        if (size = 1) return [center];

        for (let i = 0; i < size; i++) {
            points.push({ x: center.x + i, y: center.y + size - i });
            points.push({ x: center.x + i, y: center.y - size + i });
            points.push({ x: center.x - i, y: center.y + size - i });
            points.push({ x: center.x - i, y: center.y - size + i });
        }

        return points;
    }

}

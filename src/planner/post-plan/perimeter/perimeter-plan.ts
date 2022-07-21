import { singleton } from 'tsyringe';

import { IPostPlan, PostPlanCreateFn, StructurePlan, PostPlanKey } from '../../entities/plan';
import util_mincut, { Rect } from "../../../utils/mincut";
import { isDefined } from 'utils/utils';

@singleton()
export class PerimeterPlan implements IPostPlan {
    name: PostPlanKey = 'perimeter';

    constructor() { }

    create: PostPlanCreateFn = (roomName, poi, terrain, planned: StructurePlan[][]): StructurePlan[][] => {
        const structures: StructurePlan[] = [];
        const visual = new RoomVisual(roomName);

        if (planned.length == 0) { return [structures]; }

        const protect = planned.map(p => this.plannedToRect(p)).filter(isDefined);
        const cuts = util_mincut.GetCutTiles(roomName, protect);
        // util_mincut.create_graph(roomName, protect, { x1: 0, y1: 0, x2: 49, y2: 49 }, true);

        for (let cut of cuts) {
            visual.structure(cut.x, cut.y, STRUCTURE_RAMPART, { opacity: 0.5 });
            structures.push({ plan: this.name, type: STRUCTURE_RAMPART, pos: new RoomPosition(cut.x, cut.y, roomName) });
        }

        return [structures];
    }

    private plannedToRect(plan: StructurePlan[]): Rect | undefined {
        if (!plan.some(p => p.type != STRUCTURE_ROAD)) // ignore pure road sets
            return undefined;
        return {
            x1: plan.map(s => s.pos.x).reduce((a, b) => Math.min(a, b)),
            y1: plan.map(s => s.pos.y).reduce((a, b) => Math.min(a, b)),
            x2: plan.map(s => s.pos.x).reduce((a, b) => Math.max(a, b)),
            y2: plan.map(s => s.pos.y).reduce((a, b) => Math.max(a, b))
        }
    }
}

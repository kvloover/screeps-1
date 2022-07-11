import { singleton } from 'tsyringe';

import { IPostPlan, PostPlanCreateFn, PlannedStructure } from '../plan';
import util_mincut, { Rect } from "../../utils/mincut";
import { isDefined } from 'utils/utils';

@singleton()
export class PerimeterPlan implements IPostPlan {
    name = 'perimeter';

    constructor() { }

    create: PostPlanCreateFn = (roomName, poi, terrain, planned: PlannedStructure[][]): PlannedStructure[][] => {
        const structures: PlannedStructure[] = [];
        const visual = new RoomVisual(roomName);

        if (planned.length == 0) { return [structures]; }

        const cuts = util_mincut.GetCutTiles(roomName, planned.map(p => this.plannedToRect(p)).filter(isDefined));

        for (let cut of cuts) {
            visual.structure(cut.x, cut.y, STRUCTURE_RAMPART, { opacity: 0.5 });
            structures.push({ type: STRUCTURE_RAMPART, pos: new RoomPosition(cut.x, cut.y, roomName) });
        }

        return [structures];
    }

    private plannedToRect(plan: PlannedStructure[]): Rect | undefined {
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

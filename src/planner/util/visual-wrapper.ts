import { singleton } from "tsyringe";

import { RoomDrawings } from "room/room-drawings";
import { PlanFn, StructurePlan } from "../entities/plan"

@singleton()
export class VisualWrapper {

    constructor(private drawings: RoomDrawings) { }

    public WrapVisual(roomName: string, key: string, fn: PlanFn): PlanFn {
        // store current visual for later
        return (): StructurePlan[][] => {
            const visual = new RoomVisual(roomName);
            const tickVisuals = visual.export();
            visual.clear();

            const ret = fn();

            this.drawings.persist(key, visual);

            visual.clear();
            visual.import(tickVisuals);

            return ret;
        }
    }

}

import { injectable } from "tsyringe";

import { ConstructionTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import profiler from "screeps-profiler";

// let structures: { [room: string]: { id: Id<_HasId>, pos: RoomPosition }[] };

/** To be replaced with automated building -> store tasks for construction */
@injectable()
export class StructuresController implements Controller {

    constructor(private log: Logger,
    ) {
    }

    public monitor(room: Room): void {
        // if (!structures) {
        //     console.log(`not on heap ${room.name}`)
        //     structures = {};
        // } else {
        //     console.log(`on heap ${room.name}`)
        // }

        // if (!structures.hasOwnProperty(room.name)) {
        //     structures[room.name] = room.find(FIND_STRUCTURES).map(s => { return { id: s.id, pos: s.pos }; });
        // } else {
        //     console.log('already on property');
        // }
    }
}

profiler.registerClass(StructuresController, 'StructuresController');

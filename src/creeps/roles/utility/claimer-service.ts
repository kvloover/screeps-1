import { Pathing } from "creeps/pathing";
import { singleton } from "tsyringe";
import { ClaimerRole } from "./claimer-role";

import profiler from "screeps-profiler";
import { CreepState } from "utils/creep-state";

@singleton()
export class ReserverRole extends ClaimerRole {
    name: string = 'reserver';
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(protected pathing: Pathing) { super(pathing); }

    public run(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            // get setting on room:
            const roomMem = Memory.rooms[creep.memory.room];
            if (roomMem) {
                creep.memory.targetRoom = roomMem.remote;
                creep.memory.state = CreepState.reserve;
            }
        }
        super.run(creep);
    }
}

profiler.registerClass(ReserverRole, 'ReserverRole');

@singleton()
export class ConquererRole extends ClaimerRole {
    name: string = 'conquerer';
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(protected pathing: Pathing) { super(pathing); }

    public run(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            // get setting on room:
            const roomMem = Memory.rooms[creep.memory.room];
            if (roomMem) {
                creep.memory.targetRoom = roomMem.conquer;
                creep.memory.state = CreepState.claim;
            }
        }
        super.run(creep);
    }
}

profiler.registerClass(ConquererRole, 'ConquererRole');

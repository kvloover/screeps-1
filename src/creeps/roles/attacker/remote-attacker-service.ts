import { singleton } from "tsyringe";
import { Pathing } from "creeps/pathing";
import { Logger } from "logger";

import { Role } from "../role-registry";
import { RemoteAttackerRole } from "./remote-attacker-role";

import profiler from "screeps-profiler";

@singleton()
export class ConquerAttackerRole extends RemoteAttackerRole implements Role {
    name: string = 'conquer-attacker'
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(log: Logger, pathing: Pathing) {
        super(log, pathing);
    }

    public run(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].conquer;
                creep.memory.targetRoom = target;
            }
        }
        super.run(creep);
    }
}

profiler.registerClass(ConquerAttackerRole, 'ConquerAttackerRole');

@singleton()
export class RemoteDefenderRole extends RemoteAttackerRole implements Role {
    name: string = 'remote-defender'
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(log: Logger, pathing: Pathing) {
        super(log, pathing);
    }

    public run(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].remote;
                creep.memory.targetRoom = target;
            }
        }
        super.run(creep);
    }
}

profiler.registerClass(RemoteDefenderRole, 'RemoteDefenderRole');

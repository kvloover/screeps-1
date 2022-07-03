import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";
import { Role } from "../role-registry";

import profiler from "screeps-profiler";

@singleton()
export class DrainRole implements Role {

    name = 'drain';
    phase = { start: 1, end: 9 };

    constructor() { }

    public run(creep: Creep): void {

        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].attack;
                creep.memory.targetRoom = target;
            }
        }

        if (creep.memory.targetRoom) {
            creep.travelTo(new RoomPosition(25, 25, creep.memory.targetRoom), { range: 22, allowHostile: true });
        }
    }
}

profiler.registerClass(DrainRole, 'DrainRole');

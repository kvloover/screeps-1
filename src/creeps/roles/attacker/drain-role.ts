import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";
import { Role } from "../role-registry";

import profiler from "screeps-profiler";

@singleton()
export class DrainRole implements Role {

    name = 'drain';
    phase = { start: 1, end: 9 };

    constructor(private pathing: Pathing) { }

    public run(creep: Creep): void {

        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].attack;
                creep.memory.targetRoom = target;
            }
        }

        if (!creep.memory.staging) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].staging;
                creep.memory.staging = target;
            }
        }

        if (creep.hits > 0.5 * creep.hitsMax) {
            if (creep.memory.targetRoom) {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.targetRoom), { range: 22, allowHostile: true });
            }
        } else {
            if (creep.memory.staging) {
                if (creep.room.name != creep.memory.staging) {
                    this.pathing.scoutRoom(creep, creep.memory.staging, true);
                } else {
                    if (creep.memory.target) {
                        this.pathing.moveTo(creep, creep.memory.target, true);
                    } else {
                        const flag = creep.room.find(FIND_FLAGS, { filter: (fl) => fl.name.startsWith('Staging') });
                        if (flag && flag.length > 0) {
                            creep.memory.target = flag[0].pos;
                            this.pathing.moveTo(creep, flag[0].pos, true);
                        }
                    }
                }
            }
        }

    }
}

profiler.registerClass(DrainRole, 'DrainRole');

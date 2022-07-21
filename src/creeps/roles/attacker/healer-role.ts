import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";
import { Role } from "../role-registry";

import profiler from "screeps-profiler";

@singleton()
export class HealerRole implements Role {

    name = 'healer';
    prio = 1;
    phase = { start: 1, end: 9 };

    constructor(private pathing: Pathing) { }

    public run(creep: Creep): void {

        if (!creep.memory.staging) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].staging;
                creep.memory.staging = target;
            }
        }

        if (creep.memory.staging) {
            if (creep.room.name != creep.memory.staging) {
                this.pathing.scoutRoom(creep, creep.memory.staging, true);
            } else {
                // find heal target

                const hurt = creep.room.find(FIND_MY_CREEPS, { filter: c => c.hits < c.hitsMax });
                if (hurt.length > 0) {
                    const closest = hurt.sort((a, b) => a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep))[0];
                    if (creep.heal(closest) == ERR_NOT_IN_RANGE) {
                        this.pathing.moveTo(creep, closest.pos, true);
                    }
                } else {
                    if (creep.memory.target) {
                        const pos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName);
                        this.pathing.moveTo(creep, pos, true);
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

profiler.registerClass(HealerRole, 'HealerRole');

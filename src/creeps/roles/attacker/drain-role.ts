import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";
import { Role } from "../role-registry";

import profiler from "screeps-profiler";
import { CreepState } from "utils/creep-state";

@singleton()
export class DrainRole implements Role {

    name = 'drain';
    prio = 2;
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

        if (creep.memory.state == CreepState.idle) {
            creep.memory.state = CreepState.heal
        }

        if (creep.hits > 0.9 * creep.hitsMax) {
            if (creep.memory.state != CreepState.attack) { creep.memory.target = undefined; }
            creep.memory.state = CreepState.attack
        }

        if (creep.hits < 0.6 * creep.hitsMax) {
            if (creep.memory.state != CreepState.heal) { creep.memory.target = undefined; }
            creep.memory.state = CreepState.heal
        }

        if (creep.memory.state == CreepState.heal) {
            this.flee(creep);
        } else if (creep.memory.state == CreepState.attack) {
            this.drain(creep);
        }
    }

    public drain(creep: Creep): void {
        if (creep.memory.targetRoom) {
            if (creep.memory.targetRoom !== creep.room.name) {
                creep.travelTo(new RoomPosition(25, 25, creep.memory.targetRoom), { range: 23, allowHostile: true });
            } else {
                if (creep.memory.target) {
                    const pos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName);
                    if (creep.pos.getRangeTo(pos) > 2) {
                        this.pathing.moveTo(creep, pos, true);
                    }
                } else {
                    const flag = creep.room.find(FIND_FLAGS, { filter: (fl) => fl.name.startsWith('Drain') });
                    if (flag && flag.length > 0) {
                        creep.memory.target = flag[0].pos;
                        this.pathing.moveTo(creep, flag[0].pos, true);
                    }
                }
            }
        }
    }

    public flee(creep: Creep): void {
        if (creep.memory.staging) {
            if (creep.room.name != creep.memory.staging) {
                this.pathing.scoutRoom(creep, creep.memory.staging, true);
            } else {
                if (creep.memory.target) {
                    const pos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName);
                    if (creep.pos.getRangeTo(pos) > 2) {
                        this.pathing.moveTo(creep, pos, true);
                    }
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

profiler.registerClass(DrainRole, 'DrainRole');

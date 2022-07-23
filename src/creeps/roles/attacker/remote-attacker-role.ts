import { singleton } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../role-registry";
import { RangedAttackerRole } from "./ranged-attacker-role";
import { Logger } from "logger";

import profiler from "screeps-profiler";

export abstract class RemoteAttackerRole extends RangedAttackerRole implements Role {

    name: string = 'remote-attacker'
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(log: Logger, pathing: Pathing) {
        super(log, pathing);
    }

    public override run(creep: Creep): void {

        // if (!creep.memory.targetRoom) {
        //     // get setting on room:
        //     if (Memory.rooms[creep.memory.room]) {
        //         const target = Memory.rooms[creep.memory.room].attack;
        //         creep.memory.targetRoom = target;
        //     }
        // }

        // if (!creep.memory.staging) {
        //     // get setting on room:
        //     if (Memory.rooms[creep.memory.room]) {
        //         const target = Memory.rooms[creep.memory.room].staging;
        //         creep.memory.staging = target;
        //     }
        // }

        if (creep.memory.state == CreepState.idle) {
            if (creep.memory.staging) {
                creep.memory.state = CreepState.heal;
            } else {
                creep.memory.state = CreepState.attack;
            }
        }

        if (creep.hits > 0.9 * creep.hitsMax) {
            if (creep.memory.state != CreepState.attack) { creep.memory.target = undefined; }
            creep.memory.state = CreepState.attack
        }

        if (creep.hits < 0.6 * creep.hitsMax && creep.memory.staging) {
            if (creep.memory.state != CreepState.heal) { creep.memory.target = undefined; }
            creep.memory.state = CreepState.heal
        }

        if (creep.memory.state == CreepState.heal) {
            this.flee(creep);
        } else if (creep.memory.state == CreepState.attack) {
            this.act(creep);
        }
    }

    public act(creep: Creep): void {
        if (creep.memory.targetRoom
            && !creep.memory.target
            && !creep.memory.targetId
            && creep.room.name != creep.memory.targetRoom) {
            if (!Game.rooms.hasOwnProperty(creep.memory.targetRoom)) {
                // move to room
                this.pathing.scoutRoom(creep, creep.memory.targetRoom, true);
            } else {
                // move to room
                this.pathing.scoutRoom(creep, creep.memory.targetRoom, true);
                // const room = Game.rooms[creep.memory.targetRoom]
                // super.findAttack(creep, room);;
            }
        } else {
            super.findAttack(creep, creep.memory.targetRoom ? Game.rooms[creep.memory.targetRoom] : creep.room);
        }
    }

    public flee(creep: Creep): void {
        if (creep.getActiveBodyparts(HEAL) > 0) {
            const retHeal = creep.heal(creep);
        }
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

profiler.registerClass(RemoteAttackerRole, 'RemoteAttackerRole');

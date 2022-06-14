import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import profiler from "screeps-profiler";
import { isController, whoAmI } from "utils/utils";

@singleton()
export class ClaimerRole implements Role {

    name: string = 'claimer';
    phase = {
        start: 1,
        end: 9
    };

    constructor(protected pathing: Pathing) { }

    public run(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].remote;
                creep.memory.targetRoom = target;
            }
        }

        if (!creep.memory.targetId) {
            if (creep.memory.targetRoom) {
                if (!Game.rooms.hasOwnProperty(creep.memory.targetRoom)) {
                    // move to room
                    this.pathing.scoutRoom(creep, creep.memory.targetRoom);
                } else {
                    const room = Game.rooms[creep.memory.targetRoom]
                    if (room.controller && !room.controller.my) {
                        creep.memory.targetId = room.controller.id;
                        creep.memory.target = room.controller.pos;
                    }
                }
            } else {
                if (creep.room.controller && !creep.room.controller.my) {
                    creep.memory.targetId = creep.room.controller.id;
                    creep.memory.target = creep.room.controller.pos;
                }
            }

        } else {
            // Once in room: do logic
            this.claimOrMove(creep);
        }
    }

    protected claimOrMove(creep: Creep) {
        if (creep.memory.targetId) {
            const obj = Game.getObjectById(creep.memory.targetId);
            if (isController(obj)) {
                this.pathing.moveTo(creep, obj.pos);

                if (obj.room.name == creep.room.name && creep.pos.inRangeTo(obj, 1)) {
                    if (!obj.sign || obj.sign.username !== whoAmI()) {
                        creep.signController(obj, `swamp`);
                    }
                    if (creep.claimController(obj) !== OK) { // fix to claim
                        if (creep.reserveController(obj) !== OK) { // fix to claim
                            // this.log.debug(`${creep.name}: could not reserve or claim controller`);
                        }
                    }
                }
            } else {
                if (creep.memory.target) {
                    this.pathing.moveTo(creep, creep.memory.target);
                } else {
                    creep.memory.targetId = undefined; // clear
                }
            }
        }
    }

}

profiler.registerClass(ClaimerRole, 'ClaimerRole');


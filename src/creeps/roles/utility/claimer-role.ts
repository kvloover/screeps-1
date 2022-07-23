import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import profiler from "screeps-profiler";
import { isController, whoAmI } from "utils/utils";
import { CreepState } from "utils/creep-state";

export abstract class ClaimerRole implements Role {

    name: string = 'claimer';
    prio = 9;
    phase = {
        start: 1,
        end: 9
    };

    constructor(protected pathing: Pathing) { }

    public run(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            // get setting on room:
            const roomMem = Memory.rooms[creep.memory.room];
            if (roomMem) {
                creep.memory.targetRoom = roomMem.conquer ?? roomMem.remote;
                creep.memory.state = roomMem.conquer ? CreepState.claim : CreepState.reserve;
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
                this.pathing.moveTo(creep, obj.pos, undefined, 1);

                if (obj.room.name == creep.room.name && creep.pos.inRangeTo(obj, 1)) {
                    if (!obj.sign || obj.sign.username !== whoAmI()) {
                        creep.signController(obj, `swamps are made of sweat and tears`);
                    }
                    if (creep.memory.state === CreepState.claim) {
                        if (!obj.my) {
                            if (obj.owner || (obj.reservation && obj.reservation.username != whoAmI())) {
                                creep.attackController(obj);
                            } else {
                                creep.claimController(obj);
                            }
                        }
                    } else if (creep.memory.state === CreepState.reserve) {
                        if (!obj.my) {
                            if (obj.owner || (obj.reservation && obj.reservation.username != whoAmI())) {
                                creep.attackController(obj);
                            } else {
                                creep.reserveController(obj);
                            }
                        }
                    }
                }
            } else {
                if (creep.memory.target) {
                    const pos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName);
                    this.pathing.moveTo(creep, pos, undefined, 1);
                } else {
                    creep.memory.targetId = undefined; // clear
                }
            }
        }
    }

}

profiler.registerClass(ClaimerRole, 'ClaimerRole');

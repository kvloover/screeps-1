import { injectable } from "tsyringe";

import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";

import { Role } from "../role-registry";
import profiler from "screeps-profiler";
import { isController, whoAmI } from "utils/utils";

@injectable()
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

        if (!creep.memory.targetId && creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            // move to room
            this.pathing.moveTo(creep, new RoomPosition(25, 25, creep.memory.targetRoom));
        } else {
            // Once in room: do logic
            this.findClaim(creep);
            this.claimOrMove(creep);
        }
    }

    protected findClaim(creep: Creep) {
        if (!creep.memory.targetId && creep.room.name == creep.memory.targetRoom && creep.room.controller && !creep.room.controller.my) {
            creep.memory.targetId = creep.room.controller.id;
            console.log(`${creep.name}: controller found`);
        }
    }

    protected claimOrMove(creep: Creep) {
        if (creep.memory.targetId) {
            const obj = Game.getObjectById(creep.memory.targetId);
            if (isController(obj)) {
                this.pathing.moveTo(creep, obj.pos);

                if (!obj.sign || obj.sign.username !== whoAmI()) {
                    creep.signController(obj, `swamp`);
                }

                if (creep.claimController(obj) !== OK) { // fix to claim
                    if (creep.reserveController(obj) !== OK) { // fix to claim
                        console.log(`${creep.name}: could not reserve or claim controller`);
                    }
                }
            }
        }
    }
}

profiler.registerClass(ClaimerRole, 'ClaimerRole');


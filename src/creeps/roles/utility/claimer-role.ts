import { injectable } from "tsyringe";

import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";

import { Role } from "../role-registry";
import profiler from "screeps-profiler";

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

        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            // move to room
            this.pathing.moveTo(creep, new RoomPosition(25, 25, creep.memory.targetRoom));
        } else {
            // Once in room: do attack logic (TODO)
            this.findClaim(creep);
        }
    }

    protected findClaim(creep: Creep) {
        if (creep.room.controller && !creep.room.controller.my) {
            if (!CreepUtils.tryFor([creep.room.controller], (controller) => creep.claimController(controller))) { // fix to claim
                if (!CreepUtils.tryFor([creep.room.controller], (controller) => creep.reserveController(controller))) { // fix to claim
                    this.pathing.moveTo(creep, creep.room.controller.pos);
                }
            }
        }
    }
}

profiler.registerClass(ClaimerRole, 'ClaimerRole');


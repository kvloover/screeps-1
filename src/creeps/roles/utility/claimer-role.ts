import { injectable } from "tsyringe";

import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";

import { Role } from "creeps/role";

@injectable()
export class ClaimerRole implements Role {

    name: string = 'claimer';

    constructor(protected pathing: Pathing) { }

    public run(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            // find room to check
            // const exits = Game.map.describeExits(creep.memory.room);
            // _.filter(exits, e => Game.map.getRoomStatus(e).status === "normal")
            const targetRoom = 'E6S47'; // todo

            creep.memory.targetRoom = targetRoom
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
            if (!CreepUtils.tryFor([creep.room.controller], (controller) => creep.reserveController(controller))) { // fix to claim
                this.pathing.moveTo(creep, creep.room.controller.pos);
            }
        }
    }
}


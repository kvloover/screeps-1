import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { RangedAttackerRole } from "./ranged-attacker-role";

@injectable()
export class RemoteAttackerRole extends RangedAttackerRole implements Role {

    name: string = 'remote-attacker'

    constructor(pathing: Pathing) { super(pathing); }

     public override run(creep: Creep): void {
        // First entry to work: find target room
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
            super.findAttack(creep);
        }
    }

    protected override attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode {
        return creep.rangedAttack(hostile);
    }

}

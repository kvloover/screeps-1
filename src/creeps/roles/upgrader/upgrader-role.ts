import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

// @injectable()
export abstract class UpgraderRole extends TransferRole implements Role {

    name: string = 'upgrader'
    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing) { super(log, pathing) }

    // Override consume on implementing class

    protected supply(creep: Creep): void {
        if (creep.room.controller && creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            this.pathing.moveTo(creep,  creep.room.controller.pos, undefined, 3);
        }
    }

}

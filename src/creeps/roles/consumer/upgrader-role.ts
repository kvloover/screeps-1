import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { ConsumerRole } from "../_base/consumer-role";

@injectable()
export class UpgraderRole extends ConsumerRole implements Role {

    name: string = 'upgrader'

    constructor(pathing: Pathing) { super(pathing) }

    protected workState(creep: Creep): CreepState {
        return CreepState.supply;
    }

    protected work(creep: Creep): void {
        if (creep.room.controller && creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            this.pathing.moveTo(creep, creep.room.controller.pos);
        }
    }

}

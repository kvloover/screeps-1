import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../role-registry";
import { ConsumerRole } from "../_base/consumer-role";
import profiler from "screeps-profiler";

@injectable()
export class UpgraderRole extends ConsumerRole implements Role {

    name: string = 'upgrader'
    phase = {
        start: 1,
        end: 9
    };

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

profiler.registerClass(UpgraderRole, 'UpgraderRole');

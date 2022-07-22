import { singleton } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../role-registry";
import { AttackerRole } from "../_base/attacker-role";
import profiler from "screeps-profiler";
import { Logger } from "logger";

@singleton()
export class MeleeAttackerRole extends AttackerRole implements Role {

    name: string = 'melee';
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(log: Logger, pathing: Pathing) { super(log, pathing); }

    protected override attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode {
        return creep.attack(hostile);
    }
}

profiler.registerClass(MeleeAttackerRole, 'MeleeAttackerRole');

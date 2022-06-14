import { singleton } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../role-registry";
import { AttackerRole } from "../_base/attacker-role";
import profiler from "screeps-profiler";

@singleton()
export class RangedAttackerRole extends AttackerRole implements Role {

    name: string = 'ranger';
    phase = {
        start: 1,
        end: 9
    };

    constructor(pathing: Pathing) { super(pathing); }

    protected override attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode {
        return creep.rangedAttack(hostile);
    }
}

profiler.registerClass(RangedAttackerRole, 'RangedAttackerRole');

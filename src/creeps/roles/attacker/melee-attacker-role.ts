import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { AttackerRole } from "./attacker-role";

@injectable()
export class MeleeAttackerRole extends AttackerRole implements Role {

    name: string = 'melee';

    constructor(pathing: Pathing) { super(pathing); }

    protected override attack(creep: Creep, hostile: Creep): CreepActionReturnCode {
        return creep.attack(hostile);
    }
}

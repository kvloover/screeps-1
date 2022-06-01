import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { AttackerRole } from "./attacker-role";

@injectable()
export class RangedAttackerRole extends AttackerRole implements Role {

    name: string = 'ranger';

    constructor(pathing: Pathing) { super(pathing); }

    protected override attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode {
        return creep.rangedAttack(hostile);
    }
}

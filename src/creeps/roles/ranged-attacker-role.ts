import { injectable } from "tsyringe";
import { Pathing } from "creeps/pathing";
import { Role } from "../role";
import { AttackerRole } from "./base/attacker-role";


@injectable()
export class RangedAttackerRole extends AttackerRole implements Role {

    name: string = 'ranger';

    constructor(pathing: Pathing) { super(pathing); }

    protected override attack(creep: Creep, hostile: Creep): CreepActionReturnCode {
        return creep.rangedAttack(hostile);
    }
}

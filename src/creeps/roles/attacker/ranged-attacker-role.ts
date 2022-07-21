import { singleton } from "tsyringe";

import { Pathing, PathingOpts } from "creeps/pathing";

import { Role } from "../role-registry";
import { AttackerRole } from "../_base/attacker-role";
import profiler from "screeps-profiler";
import { isStructure } from "utils/utils";

@singleton()
export class RangedAttackerRole extends AttackerRole implements Role {

    name: string = 'ranger';
    phase = {
        start: 1,
        end: 9
    };

    constructor(pathing: Pathing) { super(pathing); }

    protected pathingOpts(creep: Creep): PathingOpts {
        const base = super.pathingOpts(creep);

        const defense = global.defense[creep.room.name];
        if (defense && defense.closed) {
            base.overwrite = defense.patrolmatrix; // 1 for ramps, 255 for outside closed def area
        }
        return base;
    }

    protected override attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode {
        let ret: CreepActionReturnCode;
        if (isStructure(hostile)) {
            const range = hostile.pos.getRangeTo(creep.pos);
            if (range < 3) {
                creep.rangedMassAttack();
            }
            ret = range < 2 ? OK : ERR_NOT_IN_RANGE
        } else {
            ret = creep.rangedAttack(hostile);
        }
        if (creep.getActiveBodyparts(HEAL) > 0) {
            const retHeal = creep.heal(creep);
        }
        if (creep.getActiveBodyparts(ATTACK) > 0)
            return creep.attack(hostile);
        else
            return ret;
    }
}

profiler.registerClass(RangedAttackerRole, 'RangedAttackerRole');

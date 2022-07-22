import { singleton } from "tsyringe";

import { Pathing, PathingOpts } from "creeps/pathing";

import { Role } from "../role-registry";
import { AttackerRole } from "../_base/attacker-role";
import profiler from "screeps-profiler";
import { isStructure } from "utils/utils";
import { Logger } from "logger";

@singleton()
export class RangedAttackerRole extends AttackerRole implements Role {

    name: string = 'ranged';
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(log: Logger, pathing: Pathing) { super(log, pathing); }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `${creep.name} running RangedAttackerRole`);
        super.run(creep);
    }

    protected pathingOpts(creep: Creep): PathingOpts {
        // TODO memoize this

        this.log.debug(creep.room.name, `${creep.name} getting pathOpts`);

        const base = super.pathingOpts(creep);
        if (!global.defense) return base;

        const defense = global.defense[creep.room.name];
        if (defense && defense.closed) {
            base.overwrite = defense.patrolmatrix; // 1 for ramps, 255 for outside closed def area
        }

        return base;
    }

    protected override attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode {
        this.log.debug(creep.room.name, `${creep.name} attacking ${hostile.pos.x},${hostile.pos.y}`);
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

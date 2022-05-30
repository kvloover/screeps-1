import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { SupplierRole } from "./supplier-role";


@injectable()
/**
 * Get Energy from containers and store in buildings
 */
export class HaulerRole extends SupplierRole<FIND_MY_STRUCTURES> implements Role {

    name: string = 'hauler'

    constructor(pathing: Pathing) { super(pathing); }

    protected workState(creep: Creep): CreepState {
        return CreepState.consume;
    }

    protected findConstant(): FIND_MY_STRUCTURES { return FIND_MY_STRUCTURES };
    protected filter(): FilterOptions<FIND_MY_STRUCTURES> {
        return {
            filter: (structure) =>
                (structure.structureType == STRUCTURE_SPAWN
                    || structure.structureType == STRUCTURE_EXTENSION
                    || structure.structureType == STRUCTURE_TOWER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            // todo limit range & prio sort ?
        }
    }

    protected work(creep: Creep): void {

        const prio: FilterOptions<FIND_STRUCTURES> = {
            filter: (structure) =>
                structure.structureType == STRUCTURE_CONTAINER
                && structure.store[RESOURCE_ENERGY] > 0
        };

        if (!CreepUtils.tryForFindInRoom(
            creep, this.supplyRoom(creep), FIND_STRUCTURES,
            loc => creep.withdraw(loc, RESOURCE_ENERGY), prio
        )) {
            const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, prio);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            }
        }
    }
}

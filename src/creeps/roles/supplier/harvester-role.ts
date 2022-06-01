import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { SupplierRole } from "./supplier-role";

@injectable()
/**
 * Get Energy from Sources and store in containers
 * TODO FALLBACK to base harvesting and supplying (or dropping for simple hauler)
 */
export class HarvesterRole extends SupplierRole<FIND_STRUCTURES> implements Role {

    name: string = 'harvester'

    constructor(pathing: Pathing) { super(pathing); }

    protected workState(creep: Creep): CreepState {
        return CreepState.consume;
    }

    protected findConstant(): FIND_STRUCTURES { return FIND_STRUCTURES };
    protected filter(): FilterOptions<FIND_STRUCTURES> {
        return {
            filter: (structure) =>
                structure.structureType == STRUCTURE_CONTAINER
                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            // todo limit range
        }
    }

    protected work(creep: Creep): void {
        const opt: FilterOptions<FIND_SOURCES> = { filter: (struct) => struct.energy > 0 };
        if (!CreepUtils.tryForFind(creep, FIND_SOURCES, loc => creep.harvest(loc), opt)) {
            const loc = this.pathing.findClosest(creep, FIND_SOURCES, opt);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            } else {
                creep.memory.state = CreepState.supply;
            }
        }
    }
}

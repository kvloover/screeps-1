import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { SupplierRole } from "./supplier-role";

import { HarvestTaskRepo } from "tasks/harvest-task-repo";

@injectable()
/**
 * Get Energy from Sources and store in containers
 * TODO FALLBACK to base harvesting and supplying (or dropping for simple hauler)
 */
export class HarvesterRole extends SupplierRole<FIND_STRUCTURES> implements Role {

    name: string = 'harvester'

    constructor(pathing: Pathing, private harvests: HarvestTaskRepo) { super(pathing); }

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

        // target lock on task if task not set

        if (!CreepUtils.tryForFind(creep, FIND_SOURCES, loc => creep.harvest(loc), { filter: (struct) => struct.energy > 0 })) {
            const loc = this.pathing.findClosest(creep, FIND_SOURCES);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            } else {
                creep.memory.state = CreepState.supply;
            }
        }
    }
}

declare global {
    interface CreepMemory {
        tasks: { [key: string]: string }
    }
}

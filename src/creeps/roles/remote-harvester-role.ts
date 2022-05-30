import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../role";

@injectable()
export class RemoteHarvesterRole implements Role {

    name: string = 'remote-harvester'

    constructor(private pathing: Pathing) {
    }

    public run(creep: Creep): void {
        if (creep.store.getFreeCapacity() > 0) {
            this.harvest(creep);
        }
        else {
            this.fill(creep);
        }
    }

    private harvest(creep: Creep) {
        if (!CreepUtils.tryForFind(creep, FIND_SOURCES, loc => creep.harvest(loc))) {
            const loc = this.pathing.findClosest(creep, FIND_SOURCES);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            }
        }
    }

    private fill(creep: Creep) {
        const priofill: FilterOptions<FIND_STRUCTURES> = {
            filter: (structure) =>
                (structure.structureType == STRUCTURE_EXTENSION
                    || structure.structureType == STRUCTURE_SPAWN
                    || structure.structureType == STRUCTURE_TOWER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        };

        if (!CreepUtils.tryForFind(
            creep, FIND_STRUCTURES,
            loc => creep.transfer(loc, RESOURCE_ENERGY), priofill
        )) {
            const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, priofill);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            } else {
                this.fillNonPrio(creep);
            }
        }
    }

    private fillNonPrio(creep: Creep) {
        const fill: FilterOptions<FIND_STRUCTURES> = {
            filter: (structure) =>
                (structure.structureType == STRUCTURE_CONTAINER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        };
        if (!CreepUtils.tryForFind(
            creep, FIND_STRUCTURES,
            loc => creep.transfer(loc, RESOURCE_ENERGY), fill
        )) {
            const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, fill);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            }
        }
    }
}

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { injectable } from "tsyringe";
import { Role } from "../role";

@injectable()
export class HarvesterRole implements Role {

    name: string = 'harvester'

    constructor(private pathing: Pathing) {
    }

    public run(creep: Creep): void {
        if (creep.store.getFreeCapacity() > 0) {
            if (!CreepUtils.tryForFind(creep, FIND_SOURCES, loc => creep.harvest(loc))) {
                const loc = this.pathing.findClosest(creep, FIND_SOURCES);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                }
            }
        }
        else {
            const filt: FilterOptions<FIND_STRUCTURES> = {
                filter: (structure) =>
                    (structure.structureType == STRUCTURE_EXTENSION
                        || structure.structureType == STRUCTURE_SPAWN
                        || structure.structureType == STRUCTURE_TOWER
                        || structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            };
            if (!CreepUtils.tryForFind(
                creep, FIND_STRUCTURES,
                loc => creep.transfer(loc, RESOURCE_ENERGY), filt
                )) {
                const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, filt);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                }
            }
        }
    }
}

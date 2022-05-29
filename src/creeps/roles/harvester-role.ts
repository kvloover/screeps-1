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
        if (creep.memory.working && creep.store.getUsedCapacity() == 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
        }

        if (creep.memory.working) {
            this.deposit(creep);
        }
        else {
            this.harvest(creep);
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

    private deposit(creep: Creep) {
        const opt: FilterOptions<FIND_STRUCTURES> = {
            filter: (structure) =>
                (structure.structureType == STRUCTURE_EXTENSION
                    || structure.structureType == STRUCTURE_SPAWN
                    || structure.structureType == STRUCTURE_TOWER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        };

        if (!CreepUtils.tryForFind(
            creep, FIND_STRUCTURES,
            loc => creep.transfer(loc, RESOURCE_ENERGY), opt
        )) {
            const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, opt);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            } else {
                this.depositNonPrio(creep);
            }
        }
    }

    private depositNonPrio(creep: Creep) {
        const opt: FilterOptions<FIND_STRUCTURES> = {
            filter: (structure) =>
                (structure.structureType == STRUCTURE_CONTAINER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        };
        if (!CreepUtils.tryForFind(
            creep, FIND_STRUCTURES,
            loc => creep.transfer(loc, RESOURCE_ENERGY), opt
        )) {
            const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, opt);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            }
        }
    }
}

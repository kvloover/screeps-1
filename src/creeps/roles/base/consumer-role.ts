import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";

export abstract class ConsumerRole {

    constructor(protected pathing: Pathing) { }

    protected abstract work(creep: Creep): void;

    public run(creep: Creep): void {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('⚡ work');
        }

        if (creep.memory.working) {
            this.work(creep);
        }
        else {
            this.getEnergy(creep);
        }
    }

    private getEnergy(creep: Creep) {
        const prio: FilterOptions<FIND_STRUCTURES> = {
            filter: (structure) =>
                structure.structureType == STRUCTURE_CONTAINER &&
                structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        };

        if (!CreepUtils.tryForFind(
            creep, FIND_STRUCTURES,
            loc => creep.withdraw(loc, RESOURCE_ENERGY), prio
        )) {
            const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, prio);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            } else {
                this.getEnergyNonPrio(creep);
            }
        }
    }

    private getEnergyNonPrio(creep: Creep) {
        // const nonPrio: FilterOptions<FIND_SOURCES_ACTIVE> = {};
        if (!CreepUtils.tryForFind(
            creep, FIND_SOURCES_ACTIVE,
            loc => creep.harvest(loc)
        )) {
            const loc = this.pathing.findClosest(creep, FIND_SOURCES_ACTIVE);
            if (loc != undefined) {
                this.pathing.moveTo(creep, loc.pos);
            }
        }
    }
}

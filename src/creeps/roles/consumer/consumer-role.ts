import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";
import { CreepState } from 'utils/creep-state';

export abstract class ConsumerRole {

    constructor(protected pathing: Pathing) { }

    protected abstract work(creep: Creep): void;
    protected abstract workState(creep: Creep): CreepState;

    public run(creep: Creep): void {
        this.setState(creep);
        this.switchState(creep);
    }

    protected setState(creep: Creep): void {
        if (!creep.store[RESOURCE_ENERGY] || creep.memory.state == CreepState.idle)
            creep.memory.state = CreepState.consume;

        if (creep.memory.state == CreepState.consume
            && creep.store.getFreeCapacity() == 0) {
            creep.memory.state = this.workState(creep);
        }
    }

    protected switchState(creep: Creep): void {
        if (creep.memory.state == CreepState.consume) {
            this.getEnergy(creep);
        } else if (creep.memory.state != CreepState.idle) {
            this.work(creep);
        }
    }

    private getEnergy(creep: Creep) {
        const prio: FilterOptions<FIND_STRUCTURES> = {
            filter: (structure) =>
                structure.structureType == STRUCTURE_CONTAINER &&
                structure.store[RESOURCE_ENERGY]
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

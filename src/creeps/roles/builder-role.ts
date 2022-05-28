import { injectable } from "tsyringe";
import { Pathing } from "creeps/pathing";
import { Role } from "../role";
import { CreepUtils } from "creeps/creep-utils";

@injectable()
export class BuilderRole implements Role {

    name: string = 'builder'

    constructor(private pathing: Pathing) {
    }

    public run(creep: Creep): void {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
        }

        if (creep.memory.working) {

            // priority repairs > construction > repairs
            const emergency = creep.room.find(FIND_STRUCTURES, {
                filter: (struct) => // TODO owner for tower
                    (struct.structureType === STRUCTURE_TOWER && struct.hits <= 0.50 * struct.hitsMax)      // 1.5k HP
                    || (struct.structureType == STRUCTURE_WALL && struct.hits <= 0.000005 * struct.hitsMax) // 1.5k HP
                    || (struct.structureType == STRUCTURE_RAMPART && struct.hits <= 0.005 * struct.hitsMax) // 1.5k HP
            })
            if (emergency.length > 0) {
                // emergency repairs
                if (!CreepUtils.tryFor(emergency, loc => creep.repair(loc))) {
                    const loc = this.pathing.findClosestOf(creep, emergency);
                    if (loc != undefined) {
                        this.pathing.moveTo(creep, loc.pos);
                    }
                }
            } else {
                const constructions = creep.room.find(FIND_STRUCTURES);
                if (constructions.length > 0) {
                    // construct
                    if (!CreepUtils.tryForFind(creep, FIND_CONSTRUCTION_SITES, loc => creep.build(loc))) {
                        const loc = this.pathing.findClosest(creep, FIND_CONSTRUCTION_SITES);
                        if (loc != undefined) {
                            this.pathing.moveTo(creep, loc.pos);
                        }
                    }
                } else {
                    // repair
                    if (!CreepUtils.tryForFind(creep, FIND_STRUCTURES, loc => creep.repair(loc), {
                        filter: (struct) =>
                            (struct.structureType === STRUCTURE_TOWER)                                              // 3k HP
                            || (struct.structureType == STRUCTURE_WALL && struct.hits <= 0.00005 * struct.hitsMax) // 15k HP
                            || (struct.structureType == STRUCTURE_RAMPART && struct.hits <= 0.05 * struct.hitsMax) // 15k HP
                    })) {
                        const loc = this.pathing.findClosest(creep, FIND_STRUCTURES);
                        if (loc != undefined) {
                            this.pathing.moveTo(creep, loc.pos);
                        }
                    }
                }
            }
        }
        else {
            if (!CreepUtils.tryForFind(creep, FIND_SOURCES, loc => creep.harvest(loc))) {
                const loc = this.pathing.findClosest(creep, FIND_SOURCES);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                }
            }
        }
    }
}

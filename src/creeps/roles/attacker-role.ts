import { injectable } from "tsyringe";
import { Pathing } from "creeps/pathing";
import { Role } from "../role";
import { CreepUtils } from "creeps/creep-utils";

@injectable()
export class AttackerRole implements Role {

    name: string = 'attacker'

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
            if (!CreepUtils.tryForFind(creep, FIND_CONSTRUCTION_SITES, loc => creep.build(loc))) {
                const loc = this.pathing.findClosest(creep, FIND_CONSTRUCTION_SITES);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
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

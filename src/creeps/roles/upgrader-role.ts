import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { injectable } from "tsyringe";
import { Role } from "../role";

@injectable()
export class UpgraderRole implements Role {

    name: string = 'upgrader'

    constructor(private pathing: Pathing) {
    }

    public run(creep: Creep): void {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() == 0) {
            creep.memory.working = true;
            creep.say('⚡ upgrade');
        }

        if (creep.memory.working) {
            if (creep.room.controller && creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                this.pathing.moveTo(creep, creep.room.controller.pos);
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

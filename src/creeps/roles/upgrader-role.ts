import { Pathing } from "creeps/pathing";
import { forEach } from "lodash";
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
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
        else {
            const sources = creep.room.find(FIND_SOURCES);
            let harvesting = false;
            for (let src of sources) {
                if (creep.harvest(src) != ERR_NOT_IN_RANGE) {
                    harvesting = true;
                    break;
                }
            }
            if (!harvesting) {
                this.pathing.moveToClosest(creep, sources);
            }
        }
    }

}

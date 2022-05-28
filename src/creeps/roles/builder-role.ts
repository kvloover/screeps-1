import { Pathing } from "creeps/pathing";
import { injectable } from "tsyringe";
import { Role } from "../role";

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
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            let building = false;
            for (let loc of targets) {
                if (creep.build(loc) != ERR_NOT_IN_RANGE) {
                    building = true;
                    break;
                }
            }
            if (!building) {
                this.pathing.moveToClosest(creep, targets);
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

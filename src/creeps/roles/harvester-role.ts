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
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION
                        || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }

}

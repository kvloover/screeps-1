import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { SupplierRole } from "./supplier-role";

@injectable()
export class RemoteHarvesterRole extends SupplierRole<FIND_STRUCTURES> implements Role {

    name: string = 'remote-harvester'

    constructor(pathing: Pathing) { super(pathing); }

    protected workState(creep: Creep): CreepState {
        return CreepState.consume;
    }

    // Run back to spawn room
    protected supplyRoom(creep: Creep): Room { return Game.rooms[creep.memory.room]; }
    protected findConstant(): FIND_STRUCTURES { return FIND_STRUCTURES };
    protected filter(): FilterOptions<FIND_STRUCTURES> {
        return {
            filter: (structure) =>
                structure.structureType == STRUCTURE_CONTAINER
                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            // todo limit range
        }
    }

    protected work(creep: Creep): void {
        // First entry to work: find target room
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].remote;
                creep.memory.targetRoom = target;
            }
        }

        if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
            // move to room
            this.pathing.moveTo(creep, new RoomPosition(25, 25, creep.memory.targetRoom));
        }

        // Once in room: find targetId
        if (creep.room.name === creep.memory.targetRoom && !creep.memory.targetId) {
            // find sources and set as target
            const loc = this.pathing.findClosest(creep, FIND_SOURCES);
            if (loc != undefined) {
                creep.memory.targetId = loc.id;
            } else {
                creep.memory.state = CreepState.supply;
            }
        }

        // if we have a targetId: move & harvest
        if (creep.memory.targetId) {
            const src = Game.getObjectById(creep.memory.targetId as Id<Source>);
            if (src) {
                if (!CreepUtils.tryFor([src], loc => creep.harvest(loc))) {
                    if (src.energy > 0)
                        this.pathing.moveTo(creep, src.pos);
                    else {
                        this.clearMemory(creep);
                        creep.memory.state = CreepState.supply;
                    }
                    // TODO min capacity so we don't move for nothing ?
                }
            }
        } else if (creep.memory.targetRoom) {
            // couldn't find a source in the room
            this.clearMemory(creep);
            creep.memory.state = CreepState.supply;
        }
    }

    private clearMemory(creep: Creep) {
        // clear memory so we can redetermine target when starting to work
        creep.memory.targetRoom = undefined;
        creep.memory.targetId = undefined;
    }


}

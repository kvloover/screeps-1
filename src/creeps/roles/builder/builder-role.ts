import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { CreepUtils } from "creeps/creep-utils";

// TODO rework for tasks for build/repair

// @injectable()
export abstract class BuilderRole extends TransferRole implements Role {

    name: string = 'builder'
    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing) { super(log, pathing) }

    // Override consume on implementing class

    protected supply(creep: Creep): void {
        // clear targetRoom:
        if (creep.memory.targetRoom && creep.memory.targetRoom == creep.room.name) {
            creep.memory.targetRoom = undefined;
        }

        // priority repairs > construction > repairs
        const emergency = creep.room.find(FIND_STRUCTURES, {
            filter: (struct) => struct.hits < 1500 && struct.hits < struct.hitsMax
            // (struct.structureType === STRUCTURE_TOWER && struct.hits <= 0.50 * struct.hitsMax)      // 1.5k HP
            // || (struct.structureType == STRUCTURE_WALL && struct.hits <= 0.000005 * struct.hitsMax) // 1.5k HP
            // || (struct.structureType == STRUCTURE_RAMPART && struct.hits <= 0.005 * struct.hitsMax) // 1.5k HP
        })
        if (emergency.length > 0) {
            // emergency repairs
            const closest = creep.pos.findClosestByRange(emergency);
            if (closest && creep.repair(closest) == ERR_NOT_IN_RANGE) {
                this.pathing.moveTo(creep, closest.pos);
            }
        } else {
            let constructions = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (constructions.length > 0) {
                // construct
                let target: ConstructionSite<BuildableStructureConstant> | undefined;
                if (creep.memory.targetId
                    && (target = constructions.find(i => i.id === creep.memory.targetId)) != undefined) {
                    if (creep.build(target) === ERR_NOT_IN_RANGE) {
                        this.pathing.moveTo(creep, target.pos);
                    } else if (!target) {
                        creep.memory.targetId = undefined;
                    }
                } else {
                    creep.memory.targetId = undefined;
                    const closest = creep.pos.findClosestByRange(constructions);
                    if (closest) {
                        creep.memory.targetId = closest.id;
                        if (creep.build(closest) == ERR_NOT_IN_RANGE) {
                            this.pathing.moveTo(creep, closest.pos);
                        }
                    }
                }
            } else {
                if (creep.memory.targetRoom || (constructions.length == 0 && creep.room.memory.remote)) {
                    // check remote
                    if (!creep.memory.targetRoom && creep.room.memory.remote) {
                        const room = Game.rooms[creep.room.memory.remote];
                        if (room) {
                            constructions = room.find(FIND_CONSTRUCTION_SITES);
                            if (constructions.length > 0)
                                creep.memory.targetRoom = creep.room.memory.remote;
                        }
                    } if (creep.memory.targetRoom) {
                        this.pathing.scoutRoom(creep, creep.memory.targetRoom);
                    }
                } else {
                    // repair if no nothing else
                    const opts: FilterOptions<FIND_STRUCTURES> = { filter: (struct) => struct.hits < struct.hitsMax };
                    const repairs = creep.room.find(FIND_STRUCTURES, opts);
                    const closest = creep.pos.findClosestByRange(repairs);
                    if (closest) {
                        if (creep.repair(closest) == ERR_NOT_IN_RANGE) {
                            this.pathing.moveTo(creep, closest.pos);
                        }
                    }
                }
            }
        }
    }

}

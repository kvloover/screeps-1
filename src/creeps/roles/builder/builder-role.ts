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
        // priority repairs > construction > repairs
        const emergency = creep.room.find(FIND_STRUCTURES, {
            filter: (struct) => struct.hits < 1500 && struct.hits < struct.hitsMax
            // (struct.structureType === STRUCTURE_TOWER && struct.hits <= 0.50 * struct.hitsMax)      // 1.5k HP
            // || (struct.structureType == STRUCTURE_WALL && struct.hits <= 0.000005 * struct.hitsMax) // 1.5k HP
            // || (struct.structureType == STRUCTURE_RAMPART && struct.hits <= 0.005 * struct.hitsMax) // 1.5k HP
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
            let constructions = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (constructions.length == 0 && creep.room.memory.remote) {
                // check remote
                const room = Game.rooms[creep.room.memory.remote];
                if (room)
                    constructions = room.find(FIND_CONSTRUCTION_SITES);
            }
            if (constructions.length > 0) {
                // construct
                let target: ConstructionSite<BuildableStructureConstant> | undefined;
                if (creep.memory.targetId
                    && (target = constructions.find(i => i.id === creep.memory.targetId)) != undefined) {
                    if (creep.build(target) === ERR_NOT_IN_RANGE)
                        this.pathing.moveTo(creep, target.pos);
                } else {
                    creep.memory.targetId = undefined;
                    if (!CreepUtils.tryFor(constructions, loc => {
                        if (loc) creep.memory.targetId = loc.id;
                        return creep.build(loc);
                    })) {
                        const loc = this.pathing.findClosestOf(creep, constructions);
                        if (loc != undefined) {
                            this.pathing.moveTo(creep, loc.pos);
                        }
                    }
                }
            } else {
                // repair
                const opts: FilterOptions<FIND_STRUCTURES> = { filter: (struct) => struct.hits < struct.hitsMax };
                if (!CreepUtils.tryForFind(creep, FIND_STRUCTURES, loc => creep.repair(loc), opts)) {
                    const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, opts);
                    if (loc != undefined) {
                        this.pathing.moveTo(creep, loc.pos);
                    }
                }
            }
        }
    }

}

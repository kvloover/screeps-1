import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { ConsumerRole } from "./consumer-role";

@injectable()
export class BuilderRole extends ConsumerRole implements Role {

    name: string = 'builder'
    maxHits: number = 15000;

    constructor(pathing: Pathing) { super(pathing); }

    protected workState(creep: Creep): CreepState {
        return CreepState.build;
    }

    protected work(creep: Creep): void {
        // priority repairs > construction > repairs
        const emergency = creep.room.find(FIND_STRUCTURES, {
            filter: (struct) => struct.hits < 1500 && struct.hits < struct.hitsMax
            // (struct.structureType === STRUCTURE_TOWER && struct.hits <= 0.50 * struct.hitsMax)      // 1.5k HP
            // || (struct.structureType == STRUCTURE_WALL && struct.hits <= 0.000005 * struct.hitsMax) // 1.5k HP
            // || (struct.structureType == STRUCTURE_RAMPART && struct.hits <= 0.005 * struct.hitsMax) // 1.5k HP
        })
        if (emergency.length > 0) {
            // emergency repairs
            creep.memory.state = CreepState.repair;

            if (!CreepUtils.tryFor(emergency, loc => creep.repair(loc))) {
                const loc = this.pathing.findClosestOf(creep, emergency);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                }
            }
        } else {
            const constructions = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (constructions.length > 0) {
                // construct
                creep.memory.state = CreepState.build;

                let target: ConstructionSite<BuildableStructureConstant> | undefined;
                if (creep.memory.targetId
                    && (target = constructions.find(i => i.id === creep.memory.targetId)) != undefined) {
                    if (creep.build(target) === ERR_NOT_IN_RANGE)
                        this.pathing.moveTo(creep, target.pos);
                } else {
                    creep.memory.targetId = undefined;
                    if (!CreepUtils.tryForFind(creep, FIND_CONSTRUCTION_SITES, loc => {
                        if (loc) creep.memory.targetId = loc.id;
                        return creep.build(loc);
                    })) {
                        const loc = this.pathing.findClosest(creep, FIND_CONSTRUCTION_SITES);
                        if (loc != undefined) {
                            this.pathing.moveTo(creep, loc.pos);
                        }
                    }
                }
            } else {
                // repair
                creep.memory.state = CreepState.repair;

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

import { injectable } from "tsyringe";

import { ConstructionTask, RepairTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import profiler from "screeps-profiler";
import { initHeapMemory } from "utils/structure-memory";
import { ObjectConstant } from "utils/custom-types";
import { RepairTaskRepo } from "repos/repair-task-repo";

// let structures: { [room: string]: { id: Id<_HasId>, pos: RoomPosition }[] };

interface RepairConfig {
    check: number; // game time to check
    emergency: number; // % of hitsmax
    target: number; // % of hitsmax
    max: number; // % of hitsmax
}

@injectable()
export class StructuresController implements Controller {

    // Road hits: 5.000 - 25.000 - 750.000
    // Container hits: 250.000
    // Rampart: 300.000 (2) -> 1.000.000 (3) -> ... -> 300.000.000 (8)

    // Road: decays 2% each 1000 ticks | -1 tick per creep part on step -> ~ every 10.000 ticks check for repair
    // Container: decays 2% each 500 ticks (owned) | 100 ticks (unowned) -> ~ every 10.000 ticks for owned | 2.000 unowned
    // Rampart: decays 300 hits each 100 ticks (0.1% lvl2 - 0.0001% lvl8) -> ~ every 10.000 ticks = target 60k
    // ! rampart to be repaired on constructing

    private _config = new Map<StructureConstant | ObjectConstant, RepairConfig>([
        // Decay:
        [STRUCTURE_ROAD, { check: 10000, target: 0.80, emergency: 0.20, max: 1.00 }],
        [STRUCTURE_CONTAINER, { check: 10000, target: 1.00, emergency: 0.20, max: 1.00 }],
        [STRUCTURE_RAMPART, { check: 10000, target: 0.20, emergency: 0.02, max: 1.00 }],
        // Other loss: (TODO during emergency)
        [STRUCTURE_EXTENSION, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_SPAWN, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_STORAGE, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_LINK, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_LAB, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_FACTORY, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_TERMINAL, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_EXTRACTOR, { check: 50000, target: 1.00, emergency: 0.10, max: 1.00 }],
    ]);

    constructor(private log: Logger,
        private repair: RepairTaskRepo
    ) {
    }

    public monitor(room: Room): void {
        const reset = initHeapMemory(room.name);

        const ref = global.refs ? global.refs[room.name] : undefined;
        if (!ref) return; // should be created in initHeapMemory

        const objects = ref.objects;
        if (!objects) return; // initialized with initHeapMemory

        if (reset) {
            // find all structures and add to roomRef
            const structures = room.find(FIND_STRUCTURES);
            structures.forEach(s => {
                initHeapMemory(room.name, s.structureType);
                const item = this.createObjectRef(s) as any; // TODO fix
                const values = objects[s.structureType];
                if (values && item) {
                    values.push(item);
                }
            });
        }

        if (objects) {
            Object.entries(objects).forEach(kv => {
                const key = kv[0] as StructureConstant;
                const vals = kv[1];

                const cfg = this._config.get(key);
                if (cfg) {
                    vals.forEach(obj => {
                        if (obj.visited <= Game.time - cfg.check) {
                            console.log('checking');
                            const struct = Game.getObjectById(obj.id) as Structure;
                            if (struct) {
                                if (struct.hits < cfg.emergency * struct.hitsMax) {
                                    this.repair.add(
                                        new RepairTask(room.name,
                                            1,
                                            (cfg.emergency * struct.hitsMax) - struct.hits,
                                            RESOURCE_ENERGY,
                                            struct.id,
                                            undefined,
                                            struct.pos));
                                } else if (struct.hits < 0.8 * (cfg.target * struct.hitsMax)) {
                                    this.repair.add(
                                        new RepairTask(room.name,
                                            20,
                                            (cfg.target * struct.hitsMax) - struct.hits,
                                            RESOURCE_ENERGY,
                                            struct.id,
                                            undefined,
                                            struct.pos));
                                } else if (struct.hits < 0.8 * (cfg.max * struct.hitsMax)) {
                                    this.repair.add(
                                        new RepairTask(room.name,
                                            50,
                                            (cfg.max * struct.hitsMax) - struct.hits,
                                            RESOURCE_ENERGY,
                                            struct.id,
                                            undefined,
                                            struct.pos));
                                }
                                obj.visited = Game.time;
                            }
                        }
                    })
                }
            });
        }

    }

    private createObjectRef<T extends StructureConstant>(s: Structure<T>): ObjectRef<T> {
        return {
            id: s.id,
            pos: s.pos,
            type: s.structureType,
            visited: -1
        };
    }
}

profiler.registerClass(StructuresController, 'StructuresController');

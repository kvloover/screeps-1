import { injectable } from "tsyringe";

import { RepairTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import profiler from "screeps-profiler";
import { initHeapMemory } from "structures/memory/structure-memory";
import { ObjectConstant } from "utils/custom-types";
import { RepairTaskRepo } from "repos/repair-task-repo";

// let structures: { [room: string]: { id: Id<_HasId>, pos: RoomPosition }[] };

// TODO check for new structures after reset: global refs
// TODO check for destroyed/missing structures


interface RepairConfig {
    prio: number;
    check: number; // game time to check
    under_emergency: number;
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

    private NONPRIO = 50000;
    private NON_PRIO_UNDER_EMERGENCY = 50000;

    private _config = new Map<StructureConstant | ObjectConstant, RepairConfig>([
        // Main
        [STRUCTURE_SPAWN, { prio: 1, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.50, max: 1.00 }],
        // Decay & Defense:
        [STRUCTURE_TOWER, { prio: 2, check: this.NONPRIO, under_emergency: 20, target: 1.00, emergency: 0.10, max: 1.00 }],
        [STRUCTURE_RAMPART, { prio: 3, check: 5000, under_emergency: 5, target: 0.05, emergency: 0.01, max: 1.00 }],
        [STRUCTURE_STORAGE, { prio: 3, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.50, max: 1.00 }],
        [STRUCTURE_CONTAINER, { prio: 4, check: 2500, under_emergency: 10000, target: 0.80, emergency: 0.20, max: 1.00 }],
        [STRUCTURE_EXTENSION, { prio: 4, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.0, max: 1.00 }],
        [STRUCTURE_ROAD, { prio: 5, check: 1000, under_emergency: 1000, target: 0.80, emergency: 0.20, max: 1.00 }],
        [STRUCTURE_WALL, { prio: 6, check: 5000, under_emergency: 5, target: 0.0004, emergency: 0.0002, max: 1.00 }],
        // Other loss: (TODO during emergency)
        [STRUCTURE_LINK, { prio: 6, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.0, max: 1.00 }],
        [STRUCTURE_TERMINAL, { prio: 7, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.50, max: 1.00 }],
        [STRUCTURE_LAB, { prio: 8, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.50, max: 1.00 }],
        [STRUCTURE_FACTORY, { prio: 8, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.50, max: 1.00 }],
        [STRUCTURE_EXTRACTOR, { prio: 9, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.0, max: 1.00 }],
        [STRUCTURE_NUKER, { prio: 9, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.0, max: 1.00 }],
        [STRUCTURE_OBSERVER, { prio: 9, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.0, max: 1.00 }],
        [STRUCTURE_POWER_SPAWN, { prio: 9, check: this.NONPRIO, under_emergency: this.NON_PRIO_UNDER_EMERGENCY, target: 1.00, emergency: 0.0, max: 1.00 }],
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

        const emergency = room.memory.emergency?.active ?? false;

        if (objects) {
            Object.entries(objects).forEach(kv => {
                const key = kv[0] as StructureConstant;
                const vals = kv[1];

                const cfg = this._config.get(key);
                if (cfg) {
                    const cleanUp: Id<_HasId>[] = [];
                    vals.forEach(obj => {
                        const next = obj.visited + (emergency ? cfg.under_emergency : cfg.check);
                        if (Game.time >= next) {
                            const struct = Game.getObjectById(obj.id) as Structure;
                            if (struct) {
                                // make tasks to next check level
                                if (struct.hits < cfg.emergency * struct.hitsMax) {
                                    this.tryAddTaskToRepo(
                                        new RepairTask(room.name,
                                            cfg.prio,
                                            (Math.min(cfg.target, 2 * cfg.emergency) * struct.hitsMax) - struct.hits,
                                            RESOURCE_ENERGY,
                                            struct.id,
                                            undefined,
                                            struct.pos));
                                } else if (struct.hits < 0.8 * (cfg.target * struct.hitsMax)) {
                                    // this.tryAddTaskToRepo(
                                    //     new RepairTask(room.name,
                                    //         50 + cfg.prio,
                                    //         (cfg.max * struct.hitsMax) - struct.hits,
                                    //         RESOURCE_ENERGY,
                                    //         struct.id,
                                    //         undefined,
                                    //         struct.pos));
                                }
                                obj.visited = Game.time;
                            } else {
                                if (Game.rooms[obj.pos.roomName] != undefined)
                                    cleanUp.push(obj.id);
                            }
                        }
                    });
                    objects[key] = (vals as any[]).filter(i => !cleanUp.some(id => i.id == id)); // Typesafe ?
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

    private tryAddTaskToRepo(task: RepairTask): void {
        // getTaskForRequester from repair, if not found, add to repo
        // if multiple found, remove all but the lowest prio
        // if new task is lower prio, remove old and add new
        // if same or higher prio, do nothing
        if (task.requester) {
            const taskForRequester = this.repair.getForRequester(task.requester);
            if (taskForRequester.length === 0) {
                this.repair.add(task);
            } else {
                const sortedPrio = taskForRequester.sort((a, b) => a.prio - b.prio);
                if (sortedPrio[0].prio > task.prio) {
                    taskForRequester.forEach(t => this.repair.remove(t));
                    this.repair.add(task);
                }
            }
        }
    }

}

profiler.registerClass(StructuresController, 'StructuresController');

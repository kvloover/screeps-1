import { singleton } from "tsyringe";
import { random } from "lodash";

import { Manager } from "manager";
import { Timings } from "utils/timings";
import { isMyRoom } from "utils/utils";
import { ExecutablePlan } from "./entities/executable-plan";
import { PlannedStructure } from "./entities/planned-structure";
import { RoomPlanner } from "./room-planner";

@singleton()
export class PlanManager implements Manager {

    // Keep constructions tasks monitoring seperate from planning to allow easy hook into manual building
    // TODO ignore buildings if already manually placed

    constructor(private planner: RoomPlanner) { }

    run(room: Room): void {

        if (!isMyRoom(room)) return;
        if (room.memory.manual) return;

        const [main, offset] = Timings.timingForKeyAndRoom('plan', room.name);
        if (Game.time % main != offset) return;

        if (!global.plans?.hasOwnProperty(room.name)) {
            if (!global.plans) { global.plans = {}; }
            if (!global.plans) return;

            // todo split planning over multiple ticks and skip timings check & re-enter planner
            global.plans[room.name] = this.planner.planRoom(room.name, false);
            this.cleanPlan(room);
        }

        if (global.plans[room.name]) {
            const plan = global.plans[room.name];
            const refs = global.refs?.[room.name].objects;
            const constucts = Memory.rooms[room.name]?.constructions;
            if (!plan) return;

            const structures = this.comparePlan(room.controller?.level || 0, plan, refs, constucts);
            if (structures.length > 0) {
                let counts = room.find(FIND_MY_CONSTRUCTION_SITES).length;
                for (let struct of structures) {
                    if (counts >= 20) break; // limit to 20 per room
                    if (struct.structureType == STRUCTURE_SPAWN) {
                        room.createConstructionSite(struct.pos.x, struct.pos.y, struct.structureType, `spawn_${room.name}_${random(1000, 9999)}`);
                    } else {
                        room.createConstructionSite(struct.pos.x, struct.pos.y, struct.structureType);
                    }
                    counts++;
                }
            }
        }
    }

    public showPlan(room: Room, rcl: number | undefined = undefined): void {
        if (!isMyRoom(room)) return;
        if (room.memory.manual) return;

        const plan = global.plans?.[room.name];
        if (!plan) return;

        const limit = rcl || room.controller?.level || 0;
        for (let i = 0; i <= limit; i++) {
            const rclPlan = plan.plan[i];
            for (let structure of rclPlan.structures) {
                room.visual.structure(structure.pos.x, structure.pos.y, structure.structureType, { opacity: 0.5 });
            }
        }
    }

    public cleanPlan(room: Room): void {
        if (!isMyRoom(room)) return;
        if (room.memory.manual) return;

        const plan = global.plans?.[room.name];
        if (!plan) return;

        const limit = 8;
        const structures: PlannedStructure[] = [];
        for (let i = 0; i <= limit; i++) {
            const rclPlan = plan.plan[i];
            for (let structure of rclPlan.structures) {
                structures.push(structure);
            }
        }

        room.find(FIND_STRUCTURES)
            .forEach(s => {
                if (s.structureType == STRUCTURE_CONTROLLER)
                    return;
                const planned = structures.find(p => p.structureType == s.structureType && p.pos.x == s.pos.x && p.pos.y == s.pos.y);
                if (!planned) {
                    s.destroy();
                }
            });

        room.find(FIND_CONSTRUCTION_SITES)
            .forEach(s => {
                const planned = structures.find(p => p.structureType == s.structureType && p.pos.x == s.pos.x && p.pos.y == s.pos.y);
                if (!planned) {
                    s.remove();
                }
            });
    }

    // get current rcl
    // run over each rclPlan in plan and compare with global.refs for locations
    // create constructionSite for structures not in global.refs
    private comparePlan(rcl: number, plan: ExecutablePlan, refs: ObjectRefMap | undefined, constructs: RoomConstructionMap | undefined): PlannedStructure[] {
        const structures: PlannedStructure[] = [];

        for (let i = 0; i <= rcl; i++) {
            const rclPlan = plan.plan[i];
            for (let structure of rclPlan.structures) {
                const type = structure.structureType;
                const ref = this.findObjectRef(refs, type, structure.pos);

                if (!ref) {
                    // structure not found > check if construction site exists
                    const constructionRef = this.findMemoryRef(constructs, type, structure.pos);
                    if (!constructionRef) {
                        // if no construction site: add to array for constructing
                        structures.push(structure);
                    }
                }
            }
        }

        return structures;
    }

    private findObjectRef<T extends BuildableStructureConstant>(
        refs: ObjectRefMap | undefined, type: BuildableStructureConstant, structurePos: RoomPosition
    ): ObjectRef<T> | undefined {
        if (!refs) return undefined;
        const objects = refs[type] as ObjectRef<T>[];
        if (!objects) return undefined;
        return this.lookupObjectRef(objects, structurePos);
    }

    private lookupObjectRef<T extends BuildableStructureConstant>(
        refs: ObjectRef<T>[], structurePos: RoomPosition
    ): ObjectRef<T> | undefined {
        return refs.find(o => structurePos.x == o.pos.x && structurePos.y == o.pos.y);
    }

    private findMemoryRef<T extends BuildableStructureConstant>(
        refs: RoomConstructionMap | undefined, type: BuildableStructureConstant, structurePos: RoomPosition
    ): RoomObjectMemory<T> | undefined {
        if (!refs) return undefined;
        const objects = refs[type] as RoomObjectMemory<T>[];
        if (!objects) return undefined;
        return this.lookupMemoryRef(objects, structurePos);
    }

    private lookupMemoryRef<T extends BuildableStructureConstant>(
        refs: RoomObjectMemory<T>[], structurePos: RoomPosition
    ): RoomObjectMemory<T> | undefined {
        return refs.find(o => structurePos.x == o.pos.x && structurePos.y == o.pos.y);
    }
}


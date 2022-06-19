import { injectable } from "tsyringe";

import { initConstructionMemory, initObjectMemory } from "utils/structure-memory";
import { ConstructionTask } from "repos/task";
import { ConstructionTaskRepo } from "repos/construction-task-repo";
import { Controller } from "./controller";
import { Logger } from "logger";

import profiler from "screeps-profiler";

/** To be replaced with automated building -> store tasks for construction */
@injectable()
export class ConstructionController implements Controller {


    private _config = new Map<StructureConstant, number>([
        // Defense
        [STRUCTURE_TOWER, 1],
        [STRUCTURE_RAMPART, 2],
        // Spawn
        [STRUCTURE_SPAWN, 3],
        [STRUCTURE_EXTENSION, 4],
        // Logistics
        [STRUCTURE_STORAGE, 5],
        [STRUCTURE_LINK, 6],
        // Utility
        [STRUCTURE_CONTAINER, 7],
        [STRUCTURE_ROAD, 8],
        // Factory
        [STRUCTURE_TERMINAL, 11],
        [STRUCTURE_EXTRACTOR, 12],
        [STRUCTURE_LAB, 13],
        [STRUCTURE_FACTORY, 14],
    ]);

    constructor(private log: Logger,
        private conRepo: ConstructionTaskRepo) {
    }

    public monitor(room: Room): void {
        if (Game.time % 8 != 0) return; // not too important to immediately spot

        const items =
            room.find(FIND_CONSTRUCTION_SITES);

        // Add task for each container to be supplied
        items.forEach(i => {

            initConstructionMemory(room.memory, i.structureType);
            const constr = room.memory.constructions ? room.memory.constructions[i.structureType] : undefined;
            if (constr) {
                if (!constr.some(c => c.id === i.id)) {
                    const item = this.createConstructionRef(i) as any; // TODO fix
                    constr.push(item);
                }
            }

            // Only request energy for now
            const left = i.progressTotal - i.progress;
            if (left > 0) {
                const current = this.conRepo.getForRequester(i.id, RESOURCE_ENERGY);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < left) {
                    const prio = this._config.get(i.structureType);
                    this.conRepo.add(new ConstructionTask(room.name, prio ?? 20, left - amount, RESOURCE_ENERGY, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added construction task`);
                }
            }

        })

        const constructionIds = items.map(i => i.id);

        if (room.memory.constructions){
            Object.entries(room.memory.constructions)
                .forEach(kv => {
                    const key = <BuildableStructureConstant>kv[0];
                    const vals: RoomObjectMemory<BuildableStructureConstant>[] = kv[1];

                    if (vals)
                        vals.filter(v => !constructionIds.some(i => i == v.id))
                            .forEach(v => {
                                const res = room.lookAt(v.pos)
                                    .find(i => i.structure && i.structure.structureType == key);
                                if (res && res.structure) {
                                    // Add to structures
                                    initObjectMemory(room.memory, key);
                                    const item = this.createObjectRef(res.structure) as any; // TODO fix
                                    if (room.memory.objects && room.memory.objects[key] && item) {
                                        room.memory.objects[key]?.push(item);
                                    }
                                }
                                // remove from construtions
                                _.remove(vals, i => i.id == v.id);
                            })
                });
        }

    }

    private createConstructionRef<T extends BuildableStructureConstant>(s: ConstructionSite<T>): RoomObjectMemory<T> {
        return {
            id: s.id,
            pos: s.pos,
            type: s.structureType,
        };
    }

    private createObjectRef<T extends StructureConstant>(s: Structure<T>): RoomObjectMemory<T> {
        return {
            id: s.id,
            pos: s.pos,
            type: s.structureType,
        };
    }
}

profiler.registerClass(ConstructionController, 'ConstructionController');

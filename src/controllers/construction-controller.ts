import { injectable, injectAll } from "tsyringe";

import { initConstructionMemory, initHeapMemory, initObjectMemory } from "structures/memory/structure-memory";
import { ConstructionTask } from "repos/task";
import { ConstructionTaskRepo } from "repos/construction-task-repo";
import { Controller } from "./controller";
import { Logger } from "logger";

import { InitialMemory, InitialStructMemory } from "structures/memory/initial-struct-memory";
import { OnCreate, OnStructureCreate } from "structures/side-effects/on-structure-create";

import profiler from "screeps-profiler";


/** To be replaced with automated building -> store tasks for construction */
@injectable()
export class ConstructionController implements Controller {


    private _config = new Map<StructureConstant, number>([
        // Defense
        [STRUCTURE_TOWER, 1],
        [STRUCTURE_RAMPART, 2],
        [STRUCTURE_WALL, 3],
        // Spawn
        [STRUCTURE_SPAWN, 4],
        [STRUCTURE_EXTENSION, 5],
        // Logistics
        [STRUCTURE_STORAGE, 6],
        [STRUCTURE_LINK, 7],
        // Utility
        [STRUCTURE_CONTAINER, 8],
        [STRUCTURE_ROAD, 9],
        // Factory
        [STRUCTURE_TERMINAL, 11],
        [STRUCTURE_EXTRACTOR, 12],
        [STRUCTURE_LAB, 13],
        [STRUCTURE_FACTORY, 14],
        // Late game
        [STRUCTURE_POWER_SPAWN, 15],
        [STRUCTURE_OBSERVER, 16],
        [STRUCTURE_NUKER, 17],
    ]);

    constructor(private log: Logger,
        private conRepo: ConstructionTaskRepo,
        @injectAll(InitialStructMemory.token) private initalizers: InitialMemory<StructureConstant>[],
        @injectAll(OnStructureCreate.token) private onCreates: OnCreate<StructureConstant>[]) {
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
                    this.log.debug(room.name, `${i.pos}: added construction task`);
                }
            }

        })

        const constructionIds = items.map(i => i.id);

        if (room.memory.constructions) {
            Object.entries(room.memory.constructions)
                .forEach(kv => {
                    const key = <BuildableStructureConstant>kv[0];
                    const vals: RoomObjectMemory<BuildableStructureConstant>[] = kv[1];

                    if (vals) {
                        this.checkConstructions(room, key, vals, constructionIds);
                    }

                });
        }

    }

    private checkConstructions(
        room: Room,
        key: BuildableStructureConstant,
        vals: RoomObjectMemory<BuildableStructureConstant>[],
        knownInConstruction: Id<ConstructionSite<BuildableStructureConstant>>[]
    ) {
        vals.filter(v => !knownInConstruction.some(i => i == v.id))
            .forEach(v => {

                const lookAt = room.lookAt(v.pos.x, v.pos.y);
                const res = lookAt.find(i => i.structure && i.structure.structureType == key);

                if (res && res.structure) {
                    // Add to structures heap
                    initHeapMemory(room.name, key);
                    const item = this.createObjectRef(res.structure) as any; // TODO fix
                    if (item && global.refs && global.refs[room.name]) {
                        const objs = global.refs[room.name].objects;
                        if (objs && objs[key]) {
                            objs[key]?.push(item);
                        }
                    }

                    // Set initial memory in Memory.room
                    this.log.info(room.name, `constructed ${key}`)
                    const initial = this.initalizers.find(i => i.type == key);
                    if (initial) {
                        this.log.debug(room.name, `initializing ${key}`)
                        initObjectMemory(room.memory, key);
                        const mem = initial.create(room, res.structure);
                        if (mem && room.memory.objects) { room.memory.objects[key]?.push(mem as any); }
                    }

                    // Side effects
                    const onCreate = this.onCreates.filter(i => i.type == key);
                    onCreate.forEach(effect => res.structure ? effect.onCreate(room, res.structure) : {});

                    // remove from construtions
                    _.remove(vals, i => i.id == v.id);
                }
            })
    }

    private createConstructionRef<T extends BuildableStructureConstant>(s: ConstructionSite<T>): RoomObjectMemory<T> {
        return {
            id: s.id,
            pos: s.pos,
            type: s.structureType,
        };
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

profiler.registerClass(ConstructionController, 'ConstructionController');

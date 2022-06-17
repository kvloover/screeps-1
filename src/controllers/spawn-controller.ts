import { injectable } from "tsyringe";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { Controller } from "./controller";
import { DemandTask } from "repos/task";
import { Logger } from "logger";
import { isDefined, isMyRoom, isStoreStructure } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class SpawnController implements Controller {

    constructor(private log: Logger, private demands: DemandTaskRepo) {
    }

    /// Monitor the spawn supplies: spawn + extensions for required demand
    public monitor(room: Room): void {
        if (!isMyRoom(room))
            return;

        const spawnIds = room.memory.objects?.spawn;
        if (!spawnIds || spawnIds.length == 0) return;

        const spawns = spawnIds.map(s => Game.getObjectById(s.id) as StructureSpawn).filter(isDefined);

        // Force update every x ticks or when spawning
        // Tasks will be updated by creeps finishing or unlinking
        if (Game.time % 100 != 0 && (spawns.length == 0 || !spawns.some(i => i.spawning))) return;

        const opt: FilterOptions<FIND_MY_STRUCTURES> = {
            filter: (structure) =>
                structure.structureType == STRUCTURE_EXTENSION
                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }
        const structs = room.find(FIND_MY_STRUCTURES, opt);
        spawns.forEach(s => structs.push(s));

        structs.forEach(s => {
            if (isStoreStructure(s)) {
                const free = s.store.getFreeCapacity(RESOURCE_ENERGY)
                const tasks = this.demands.getForRequester(s.id, RESOURCE_ENERGY);
                const amount = tasks.reduce((p, c) => p + (c?.amount ?? 0), 0);
                if (amount < free) {
                    this.demands.add(new DemandTask(s.room.name, 1, free - amount, RESOURCE_ENERGY, s.id, undefined, s.pos));
                    this.log.debug(s.room, `${s.pos}: added supply task`);
                }
            }
        });

    }
}

profiler.registerClass(SpawnController, 'SpawnController');


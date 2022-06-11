import { injectable } from "tsyringe";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { Controller } from "./controller";
import { DemandTask } from "repos/task";
import { Logger } from "logger";

import profiler from "screeps-profiler";

@injectable()
export class SpawnController implements Controller {

    constructor(private log: Logger, private demands: DemandTaskRepo) {
    }

    /// Monitor the spawn supplies: spawn + extensions for required demand
    public monitor(room: Room): void {

        const opt: FilterOptions<FIND_MY_STRUCTURES> = {
            filter: (structure) =>
                (structure.structureType == STRUCTURE_SPAWN
                    || structure.structureType == STRUCTURE_EXTENSION) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }
        const structs = room.find(FIND_MY_STRUCTURES, opt);

        structs.forEach(s => {
            const struct = s as StructureSpawn | StructureExtension
            if (struct) {
                const free = struct.store.getFreeCapacity(RESOURCE_ENERGY)
                const tasks = this.demands.getForRequester(struct.id);
                const amount = tasks.reduce((p, c) => p + (c?.amount ?? 0), 0);
                if (amount < free) {
                    this.demands.add(new DemandTask(struct.room.name, 1, free-amount, struct.id, undefined, struct.pos ));
                    this.log.debug(struct.room, `${struct.pos}: added supply task`);
                }
            }
        });

    }
}

profiler.registerClass(SpawnController, 'SpawnController');


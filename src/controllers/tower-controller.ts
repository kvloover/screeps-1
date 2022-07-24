import { injectable } from "tsyringe";

import { SpawnDemandTaskRepo } from "repos/tasks/spawn/spawn-demand-task-repo";
import { Controller } from "./controller";
import { Task } from "repos/tasks/task";
import { Logger } from "logger";
import { isMyRoom, isStoreStructure } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class TowerController implements Controller {

    constructor(private log: Logger, private demands: SpawnDemandTaskRepo) {
    }

    /// Monitor the spawn supplies: spawn + extensions for required demand
    public monitor(room: Room): void {
        if (!isMyRoom(room))
            return;

        const opt: FilterOptions<FIND_MY_STRUCTURES> = {
            filter: (structure) =>
                structure.structureType == STRUCTURE_TOWER
                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }
        const structs = room.find(FIND_MY_STRUCTURES, opt);

        structs.forEach(struct => {
            if (isStoreStructure(struct)) {
                if (struct.store.getUsedCapacity(RESOURCE_ENERGY) < 800) {
                    const current = this.demands.getForRequester(struct.id, RESOURCE_ENERGY);
                    const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                    if (amount < struct.store.getFreeCapacity(RESOURCE_ENERGY)) {
                        this.demands.add(new Task(struct.room.name, 2, struct.store.getFreeCapacity(RESOURCE_ENERGY) - amount, RESOURCE_ENERGY, struct.id, undefined, struct.pos));
                        this.log.debug(struct.room.name, `${struct.pos}: added supply task`);
                    }
                }
            }
        });

    }
}

profiler.registerClass(TowerController, 'TowerController');

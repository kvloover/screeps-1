import { injectable } from "tsyringe";

import { TransferTaskRepo } from "repos/tasks/transfer-task-repo";
import { Controller } from "./controller";
import { TransferTask } from "tasks/task";
import { Logger } from "logger";

@injectable()
export class SpawnController implements Controller {

    constructor(private log: Logger, private demands: TransferTaskRepo) {
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

        const demands = this.demands.list();
        structs.forEach(s => {
            const struct = s as StructureSpawn | StructureExtension
            if (struct) {
                const task = demands.find(d => d.requester === s.id);
                if (!task) {
                    console.log(`demand for ${struct.pos}`)
                    this.demands.add(new TransferTask(1, struct.store.getFreeCapacity(RESOURCE_ENERGY), struct.id, undefined, struct ));
                    this.log.debug(struct.room, `${struct.pos}: added supply task`);
                }
            }
        });

    }
}


import { injectable } from "tsyringe";

import { TransferTaskRepo } from "tasks/repos/transfer-task-repo";
import { Controller } from "./controller";

@injectable()
export class SpawnController implements Controller {

    constructor(private demands: TransferTaskRepo) {
    }

    /// Monitor the spawn supplies: spawn + extensions for required demand
    public monitor(room: Room): void {

        // const opt: FilterOptions<FIND_MY_STRUCTURES> = {
        //     filter: (structure) =>
        //         (structure.structureType == STRUCTURE_SPAWN
        //             || structure.structureType == STRUCTURE_EXTENSION
        //             || structure.structureType == STRUCTURE_TOWER) &&
        //         structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        // }
        // const room.find(FIND_MY_STRUCTURES, opt);

    }
}


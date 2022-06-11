import { injectable } from "tsyringe";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { Controller } from "./controller";
import { DemandTask } from "repos/task";
import { Logger } from "logger";

import profiler from "screeps-profiler";

@injectable()
export class TowerController implements Controller {

    constructor(private log: Logger, private demands: DemandTaskRepo) {
    }

    /// Monitor the spawn supplies: spawn + extensions for required demand
    public monitor(room: Room): void {

        const opt: FilterOptions<FIND_MY_STRUCTURES> = {
            filter: (structure) =>
                structure.structureType == STRUCTURE_TOWER
                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }
        const structs = room.find(FIND_MY_STRUCTURES, opt);

        structs.forEach(s => {
            const struct = (s as AnyStoreStructure);
            const current = this.demands.getForRequester(s.id);
            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
            if (amount < struct.store.getFreeCapacity(RESOURCE_ENERGY)) {
                this.demands.add(new DemandTask(struct.room.name, 2, struct.store.getFreeCapacity(RESOURCE_ENERGY), struct.id, undefined, struct.pos));
                this.log.debug(struct.room, `${struct.pos}: added supply task`);
            }
        });

    }
}

profiler.registerClass(TowerController, 'TowerController');

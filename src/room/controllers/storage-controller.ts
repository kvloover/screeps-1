import { injectable } from "tsyringe";

import { BatteryTask, MidstreamTask, ProviderTask, StorageTask } from "tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { MidstreamTaskRepo } from "repos/tasks/midstream-task-repo";
import { ProviderTaskRepo } from "repos/tasks/providor-task-repo";
import { BatteryTaskRepo } from "repos/tasks/battery-task-repo";
import { StorageTaskRepo } from "repos/tasks/storage-task-repo";

@injectable()
export class StorageController implements Controller {

    constructor(private log: Logger,
        private demandRepo: StorageTaskRepo,
        private providerRepo: BatteryTaskRepo) {
    }

    public monitor(room: Room): void {
        const items =
            room.find(FIND_MY_STRUCTURES, {
                filter: struct => struct.structureType === STRUCTURE_STORAGE
            }); // .map((src, ind) => { return { item: src, name: `${room.name}_source${ind}` } });

        this.log.debug(room, `found ${items?.length} containers`);

        // Add task for each container to be supplied
        items.forEach(i => {
            const struct = (i as AnyStoreStructure);

            const free = struct.store.getFreeCapacity(RESOURCE_ENERGY);
            if (free > 0) {
                const current = this.demandRepo.getForRequester(i.id);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < free) {
                    this.demandRepo.add(new StorageTask(struct.room.name, 2, free - amount, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added container midstream task`);
                }
            }

            const stored = struct.store.getUsedCapacity(RESOURCE_ENERGY);
            if (stored > 0) {
                const current = this.providerRepo.getForRequester(i.id);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < stored) {
                    this.providerRepo.add(new BatteryTask(struct.room.name, 2, stored - amount, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added container provider task`);
                }
            }
        })
    }
}

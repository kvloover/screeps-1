import { injectable } from "tsyringe";

import { ContainerTransferTask } from "tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";
import { ContainerTransferTaskRepo } from "repos/tasks/container-transfer-task-repo";

@injectable()
export class ContainerController implements Controller {

    constructor(private log: Logger, private transferRepo: ContainerTransferTaskRepo) {
    }

    public monitor(room: Room): void {
        const items =
            room.find(FIND_STRUCTURES, {
                filter: struct => struct.structureType === STRUCTURE_CONTAINER
                    && struct.store[RESOURCE_ENERGY] > 0
            }); // .map((src, ind) => { return { item: src, name: `${room.name}_source${ind}` } });

        // Add task for each container to be supplied
        items.forEach(i => {
            console.log(`tick`);
            const struct = (i as AnyStoreStructure);
            const free = struct.store.getFreeCapacity(RESOURCE_ENERGY);
            if (free > 0) {
                console.log(`tack`);
                const current = this.transferRepo.getForRequester(i.id);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                console.log(`free: ${free} vs amount ${amount}`);
                if (amount < free) {
                    console.log(`toe`);
                    this.transferRepo.add(new ContainerTransferTask(struct.room.name, 1, free - amount, i.id, undefined, i.pos));
                    this.log.debug(i.room, `${i.pos}: added container task`);
                }
            }
        })
    }
}

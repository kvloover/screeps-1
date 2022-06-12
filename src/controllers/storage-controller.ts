import { injectable } from "tsyringe";

import { SupplyTask, StorageTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { SupplyTaskRepo } from "repos/supply-task-repo";
import { StorageTaskRepo } from "repos/storage-task-repo";

import profiler from "screeps-profiler";
import { isResourceConstant, isStoreStructure } from "utils/utils";

@injectable()
export class StorageController implements Controller {

    constructor(private log: Logger,
        private demandRepo: StorageTaskRepo,
        private providerRepo: SupplyTaskRepo) {
    }

    public monitor(room: Room): void {
        const items =
            room.find(FIND_MY_STRUCTURES, {
                filter: struct => struct.structureType === STRUCTURE_STORAGE
            }); // .map((src, ind) => { return { item: src, name: `${room.name}_source${ind}` } });

        // Add task for each container to be supplied
        items.forEach(struct => {
            if (isStoreStructure(struct)) {
                const allReq = this.demandRepo.getForRequester(struct.id);

                // Request for capacity
                const free = struct.store.getFreeCapacity() ?? 0;
                if (free > 0) {
                    const current = allReq.filter(req => !req.type);
                    const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                    if (amount < free) {
                        this.demandRepo.add(new StorageTask(struct.room.name, 2, free - amount, undefined, struct.id, undefined, struct.pos));
                        this.demandRepo.mergeEmpty();
                        this.log.debug(room, `${struct.pos}: added storage demand task`);
                    }
                }

                Object.keys(struct.store).forEach(type => {
                    // console.log(`checking store ${type}`);
                    if (isResourceConstant(type)) {
                        const stored = struct.store.getUsedCapacity(type);
                        if (stored && stored > 0) {
                            const current = this.providerRepo.getForRequester(struct.id, type);
                            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                            if (amount < stored) {
                                this.providerRepo.add(new SupplyTask(struct.room.name, 2, stored - amount, type, struct.id, undefined, struct.pos));
                                this.providerRepo.mergeEmpty();
                                this.log.debug(room, `${struct.pos}: added storage provider task`);
                            }
                        }
                    }
                });
            }
        });
    }
}

profiler.registerClass(StorageController, 'StorageController');

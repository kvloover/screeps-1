import { injectable } from "tsyringe";

import { Task } from "repos/tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { StorageSupplyTaskRepo } from "repos/tasks/storage/storage-supply-task-repo";
import { StorageDemandTaskRepo } from "repos/tasks/storage/storage-demand-task-repo";
import { isMyRoom, isResourceConstant, isStoreStructure } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class StorageController implements Controller {

    _prio: { prio: number, level: number }[] = [
        { prio: 2, level: 50000 },
        { prio: 4, level: 100000 },
        { prio: 6, level: 1000000 },
    ]

    constructor(private log: Logger,
        private demandRepo: StorageDemandTaskRepo,
        private providerRepo: StorageSupplyTaskRepo) {
    }

    public monitor(room: Room): void {
        if (!isMyRoom(room))
            return;

        const items =
            room.find(FIND_MY_STRUCTURES, {
                filter: struct => struct.structureType === STRUCTURE_STORAGE
            }); // .map((src, ind) => { return { item: src, name: `${room.name}_source${ind}` } });

        // Add task for each container to be supplied
        items.forEach(struct => {
            if (isStoreStructure(struct)) {
                const allReq = this.demandRepo.getForRequester(struct.id);

                // Request for capacity prio x to certain level
                const currLevel = struct.store.getUsedCapacity(RESOURCE_ENERGY);
                let prevLevel = 0;
                this._prio.forEach(prio => {
                    if (currLevel < prio.level) {
                        const fill = prio.level - currLevel - prevLevel;
                        if (fill > 0) {
                            const current = allReq.filter(req => !req.type && req.prio == prio.prio);
                            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                            if (amount < fill) {
                                this.demandRepo.add(new Task(struct.room.name, prio.prio, fill - amount, undefined, struct.id, undefined, struct.pos));
                                this.demandRepo.mergeEmpty();
                                this.log.debug(room.name, `${struct.pos}: added storage demand task`);
                            }
                        }
                    }
                    prevLevel = prio.level;
                });

                Object.keys(struct.store).forEach(type => {
                    // console.log(`checking store ${type}`);
                    if (isResourceConstant(type)) {
                        const stored = struct.store.getUsedCapacity(type);
                        if (stored && stored > 0) {
                            const current = this.providerRepo.getForRequester(struct.id, type);
                            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                            if (amount < stored) {
                                // Same base prio as containers
                                this.providerRepo.add(new Task(struct.room.name, 1, stored - amount, type, struct.id, undefined, struct.pos));
                                this.providerRepo.mergeEmpty();
                                this.log.debug(room.name, `${struct.pos}: added storage provider task`);
                            }
                        }
                    }
                });
            }
        });
    }
}

profiler.registerClass(StorageController, 'StorageController');

import { injectable } from "tsyringe";

import { MidstreamTask, SupplyTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { MidstreamTaskRepo } from "repos/midstream-task-repo";
import { SupplyTaskRepo } from "repos/supply-task-repo";
import { isMyRoom, isRemote, isResourceConstant } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class ContainerController implements Controller {

    constructor(private log: Logger,
        private transferRepo: MidstreamTaskRepo,
        private supplyRepo: SupplyTaskRepo) {
    }

    public monitor(room: Room): void {
        if (!isMyRoom(room) && !isRemote(room))
            return;

        const items =
            room.find(FIND_STRUCTURES, {
                filter: struct => struct.structureType === STRUCTURE_CONTAINER
            }); // .map((src, ind) => { return { item: src, name: `${room.name}_source${ind}` } });

        // Add task for each container to be supplied
        items.forEach(i => {
            const struct = (i as AnyStoreStructure);

            // Only request energy for now
            const free = struct.store.getFreeCapacity(RESOURCE_ENERGY);
            if (free > 0) {
                const current = this.transferRepo.getForRequester(i.id, RESOURCE_ENERGY);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < free) {
                    this.transferRepo.add(new MidstreamTask(struct.room.name, 2, free - amount, RESOURCE_ENERGY, i.id, undefined, i.pos));
                    this.log.debug(room.name, `${i.pos}: added container midstream task`);
                }
            }

            Object.keys(struct.store).forEach(type => {
                if (isResourceConstant(type)) {
                    const stored = struct.store.getUsedCapacity(type);
                    if (stored && stored > 0) {
                        const current = this.supplyRepo.getForRequester(i.id, type);
                        const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                        if (amount < stored) {
                            this.supplyRepo.add(new SupplyTask(struct.room.name, 1, stored - amount, type, i.id, undefined, i.pos));
                            this.log.debug(room.name, `${i.pos}: added container supply task`);
                        }
                    }
                }
            })


        })
    }
}

profiler.registerClass(ContainerController, 'ContainerController');

import { injectable } from "tsyringe";

import { MidstreamTask, ProviderTask, SupplyTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { MidstreamTaskRepo } from "repos/midstream-task-repo";
import { ProviderTaskRepo } from "repos/provider-task-repo";
import { isLinkStructure, isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";
import { SupplyTaskRepo } from "repos/supply-task-repo";

@injectable()
export class LinkController implements Controller {

    constructor(private log: Logger,
        private transferRepo: MidstreamTaskRepo,
        private providerRepo: ProviderTaskRepo,
        private supplyRepo: SupplyTaskRepo
    ) {
    }

    public monitor(room: Room): void {
        if (!isMyRoom(room))
            return;

        const links = room.memory.objects?.link;

        // Add task for each container to be supplied
        if (links) {
            links.forEach(i => {
                const struct = Game.getObjectById(i.id);
                const mem = i as LinkMemory;
                if (isLinkStructure(struct) && mem) {
                    if (mem.storage) {
                        const used = struct.store.getUsedCapacity(RESOURCE_ENERGY);
                        if (used > 0) {
                            const current = this.providerRepo.getForRequester(mem.id, RESOURCE_ENERGY);
                            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                            if (amount < used) {
                                this.providerRepo.add(new ProviderTask(struct.room.name, 1, used - amount, RESOURCE_ENERGY, mem.id, undefined, mem.pos));
                                this.log.debug(room, `${mem.pos}: added link provider task`);
                            }
                        }
                    } else if (mem.supply) {
                        const used = struct.store.getUsedCapacity(RESOURCE_ENERGY);
                        if (used > 0) {
                            const current = this.supplyRepo.getForRequester(mem.id, RESOURCE_ENERGY);
                            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                            if (amount < used) {
                                this.supplyRepo.add(new SupplyTask(struct.room.name, 1, used - amount, RESOURCE_ENERGY, mem.id, undefined, mem.pos));
                                this.log.debug(room, `${mem.pos}: added link supply task`);
                            }
                        }
                    } else {
                        const free = struct.store.getFreeCapacity(RESOURCE_ENERGY);
                        if (free > 0) {
                            const current = this.transferRepo.getForRequester(mem.id, RESOURCE_ENERGY);
                            const amount = current.reduce((p, c) => p + (c?.amount ?? 0), 0);
                            if (amount < free) {
                                this.transferRepo.add(new MidstreamTask(struct.room.name, 1, free - amount, RESOURCE_ENERGY, mem.id, undefined, mem.pos));
                                this.log.debug(room, `${mem.pos}: added link midstream task`);
                            }
                        }
                    }
                }

            });
        }

    }
}

profiler.registerClass(LinkController, 'LinkController');

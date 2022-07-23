import { injectable } from "tsyringe";

import { Task } from "repos/tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { LinkDemandTaskRepo } from "repos/tasks/link/link-demand-task-repo";
import { LinkSupplyTaskRepo } from "repos/tasks/link/link-supply-task-repo";
import { LinkSupplyUtilityTaskRepo } from "repos/tasks/link/link-supply-utility-task-repo";
import { isLinkStructure, isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class LinkController implements Controller {

    constructor(private log: Logger,
        private transferRepo: LinkDemandTaskRepo,
        private providerRepo: LinkSupplyTaskRepo,
        private utilityRepo: LinkSupplyUtilityTaskRepo,
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
                                this.providerRepo.add(new Task(struct.room.name, 1, used - amount, RESOURCE_ENERGY, mem.id, undefined, mem.pos));
                                this.log.debug(room.name, `${mem.pos}: added link provider task`);
                            }
                        }
                    } else if (mem.supply) {
                        const used = struct.store.getUsedCapacity(RESOURCE_ENERGY);
                        if (used > 0) {
                            const current = this.utilityRepo.getForRequester(mem.id, RESOURCE_ENERGY);
                            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                            if (amount < used) {
                                this.utilityRepo.add(new Task(struct.room.name, 1, used - amount, RESOURCE_ENERGY, mem.id, undefined, mem.pos));
                                this.log.debug(room.name, `${mem.pos}: added link utility task`);
                            }
                        }
                    } else {
                        const free = struct.store.getFreeCapacity(RESOURCE_ENERGY);
                        if (free > 0) {
                            const current = this.transferRepo.getForRequester(mem.id, RESOURCE_ENERGY);
                            const amount = current.reduce((p, c) => p + (c?.amount ?? 0), 0);
                            if (amount < free) {
                                this.transferRepo.add(new Task(struct.room.name, 1, free - amount, RESOURCE_ENERGY, mem.id, undefined, mem.pos));
                                this.log.debug(room.name, `${mem.pos}: added link midstream task`);
                            }
                        }
                    }
                }

            });
        }

    }
}

profiler.registerClass(LinkController, 'LinkController');

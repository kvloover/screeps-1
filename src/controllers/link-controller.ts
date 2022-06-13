import { injectable } from "tsyringe";

import { MidstreamTask, ProviderTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { MidstreamTaskRepo } from "repos/midstream-task-repo";
import { ProviderTaskRepo } from "repos/provider-task-repo";
import { isLinkStructure, isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class LinkController implements Controller {

    constructor(private log: Logger,
        private transferRepo: MidstreamTaskRepo,
        private providerRepo: ProviderTaskRepo,
    ) {
    }

    public monitor(room: Room): void {
        if (!isMyRoom(room))
            return;

        const links = room.memory.links;

        // Add task for each container to be supplied
        if (links) {
            links.forEach(i => {
                const struct = Game.getObjectById(i.id);
                if (isLinkStructure(struct)) {
                    if (i.storage) {
                        const used = struct.store.getUsedCapacity(RESOURCE_ENERGY);
                        if (used > 0) {
                            const current = this.providerRepo.getForRequester(i.id, RESOURCE_ENERGY);
                            const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                            if (amount < used) {
                                this.providerRepo.add(new ProviderTask(struct.room.name, 1, used - amount, RESOURCE_ENERGY, i.id, undefined, i.pos));
                                this.log.debug(room, `${i.pos}: added link provider task`);
                            }
                        }
                    } else {
                        const free = struct.store.getFreeCapacity(RESOURCE_ENERGY);
                        if (free > 0) {
                            const current = this.transferRepo.getForRequester(i.id, RESOURCE_ENERGY);
                            const amount = current.reduce((p, c) => p + (c?.amount ?? 0), 0);
                            if (amount < free) {
                                this.transferRepo.add(new MidstreamTask(struct.room.name, 1, free - amount, RESOURCE_ENERGY, i.id, undefined, i.pos));
                                this.log.debug(room, `${i.pos}: added link midstream task`);
                            }
                        }
                    }
                }

            });
        }

    }
}

profiler.registerClass(LinkController, 'LinkController');

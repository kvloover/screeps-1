import { injectable } from "tsyringe";

import { ProviderTask } from "tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { ProviderTaskRepo } from "repos/tasks/providor-task-repo";

@injectable()
export class DropsController implements Controller {

    constructor(private log: Logger,
        private providerRepo: ProviderTaskRepo) {
    }

    public monitor(room: Room): void {
        const tombs =
            room.find(FIND_TOMBSTONES, {
                filter: tomb => tomb.store[RESOURCE_ENERGY] > 0
            });

        // Add task for each container to be supplied
        tombs.forEach(i => {
            const stored = i.store[RESOURCE_ENERGY];
            if (stored > 0) {
                const current = this.providerRepo.getForRequester(i.id);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < stored && i.room) {
                    this.providerRepo.add(new ProviderTask(i.room.name, 1, stored - amount, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added tomb provider task`);
                }
            }
        })

        const dropped =
            room.find(FIND_DROPPED_RESOURCES);

        // Add task for each container to be supplied
        dropped.forEach(i => {
            const stored = i.amount;
            if (stored > 0) {
                const current = this.providerRepo.getForRequester(i.id);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < stored && i.room) {
                    this.providerRepo.add(new ProviderTask(i.room.name, 1, stored - amount, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added dropped provider task`);
                }
            }
        })
    }
}

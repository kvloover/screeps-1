import { injectable } from "tsyringe";

import { SupplyTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { SupplyTaskRepo } from "repos/supply-task-repo";

@injectable()
export class DropsController implements Controller {

    constructor(private log: Logger,
        private supplyRepo: SupplyTaskRepo) {
    }

    public monitor(room: Room): void {
        if (!room.controller || !room.controller.my) return;

        const tombs =
            room.find(FIND_TOMBSTONES, {
                filter: tomb => tomb.store[RESOURCE_ENERGY] > 0
            });

        // Add task for each container to be supplied
        tombs.forEach(i => {
            const stored = i.store[RESOURCE_ENERGY];
            if (stored > 0) {
                const current = this.supplyRepo.getForRequester(i.id);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < stored && i.room) {
                    this.supplyRepo.add(new SupplyTask(i.room.name, 1, stored - amount, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added tomb supply task`);
                }
            }
        })

        const dropped =
            room.find(FIND_DROPPED_RESOURCES);

        // Add task for each container to be supplied
        dropped.forEach(i => {
            const stored = i.amount;
            if (stored > 0) {
                const current = this.supplyRepo.getForRequester(i.id);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < stored && i.room) {
                    this.supplyRepo.add(new SupplyTask(i.room.name, 1, stored - amount, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added dropped supply task`);
                }
            }
        })
    }
}

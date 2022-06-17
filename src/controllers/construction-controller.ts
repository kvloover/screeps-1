import { injectable } from "tsyringe";

import { ConstructionTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { ConstructionTaskRepo } from "repos/construction-task-repo";

import profiler from "screeps-profiler";

/** To be replaced with automated building -> store tasks for construction */
@injectable()
export class ConstructionController implements Controller {

    constructor(private log: Logger,
        private conRepo: ConstructionTaskRepo) {
    }

    public monitor(room: Room): void {
        if (Game.time % 8 != 0) return; // not too important to immediately spot

        const items =
            room.find(FIND_CONSTRUCTION_SITES);

        // Add task for each container to be supplied
        items.forEach(i => {

            // Only request energy for now
            const left = i.progressTotal - i.progress;
            if (left > 0) {
                const current = this.conRepo.getForRequester(i.id, RESOURCE_ENERGY);
                const amount = current.reduce((p, c) => p + (c.amount ?? 0), 0);
                if (amount < left) {
                    this.conRepo.add(new ConstructionTask(room.name, 2, left - amount, RESOURCE_ENERGY, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added construction task`);
                }
            }

        })
    }
}

profiler.registerClass(ConstructionController, 'ConstructionController');

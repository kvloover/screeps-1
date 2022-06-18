import { injectable } from "tsyringe";

import { ConstructionTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { ConstructionTaskRepo } from "repos/construction-task-repo";

import profiler from "screeps-profiler";

/** To be replaced with automated building -> store tasks for construction */
@injectable()
export class ConstructionController implements Controller {


    private _config = new Map<StructureConstant, number>([
        // Defense
        [STRUCTURE_TOWER, 1],
        [STRUCTURE_RAMPART, 2],
        // Spawn
        [STRUCTURE_SPAWN, 3],
        [STRUCTURE_EXTENSION, 4],
        // Logistics
        [STRUCTURE_STORAGE, 5],
        [STRUCTURE_LINK, 6],
        // Utility
        [STRUCTURE_CONTAINER, 7],
        [STRUCTURE_ROAD, 8],
        // Factory
        [STRUCTURE_TERMINAL, 11],
        [STRUCTURE_EXTRACTOR, 12],
        [STRUCTURE_LAB, 13],
        [STRUCTURE_FACTORY, 14],
    ]);

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
                    const prio = this._config.get(i.structureType);
                    this.conRepo.add(new ConstructionTask(room.name, prio ?? 20, left - amount, RESOURCE_ENERGY, i.id, undefined, i.pos));
                    this.log.debug(room, `${i.pos}: added construction task`);
                }
            }

        })
    }
}

profiler.registerClass(ConstructionController, 'ConstructionController');

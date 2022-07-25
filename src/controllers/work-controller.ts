import { injectable } from "tsyringe";

import { Controller } from "./controller";
import { Logger } from "logger";

import { isMyRoom, isStoreStructure } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class WorkController implements Controller {

    constructor(private log: Logger) { }

    public monitor(room: Room): void {
        if (Game.time % 23 != 0) return; // not too important to immediately spot

        if (!isMyRoom(room))
            return;
        if (!room.controller)
            return;

        const level = room.controller.level;

        const containers = room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_CONTAINER })
            .map(s => isStoreStructure(s) ? s.store.getUsedCapacity(RESOURCE_ENERGY) : 0)
            .reduce((acc, c) => acc + c, 0);

        const energy = (room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) || 0)
            + (room.terminal?.store.getUsedCapacity(RESOURCE_ENERGY) || 0)
            + containers;

        const constructions = room.find(FIND_CONSTRUCTION_SITES).length;

        if ((level < 4 && energy > 2000)
        || (level == 5 && energy > 3000)
        || (level == 6 && energy > 5000)
        || (level == 7 && energy > 20000)) {
            this.log.debug(room.name, `Room energy sufficient for additional work`);
            room.memory.building = constructions > 3;
            room.memory.upgrading = level < 8 && !room.memory.building;
        } else {
            this.log.debug(room.name, `Room energy insufficient for additional work`);
            room.memory.building = false;
            room.memory.upgrading = false;
        }
    }
}

profiler.registerClass(WorkController, 'WorkController');

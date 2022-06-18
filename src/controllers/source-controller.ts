import { injectable } from "tsyringe";

import { HarvestTaskRepo } from "repos/harvest-task-repo";
import { HarvestTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { initObjectMemory } from "utils/structure-memory";

import profiler from "screeps-profiler";

@injectable()
export class SourceController implements Controller {

    constructor(private log: Logger, private harvestRepo: HarvestTaskRepo) {
    }

    public monitor(room: Room): void {

        // TODO rooms without sources ?
        if (!room.memory.objects?.source || room.memory.objects.source.length == 0) {
            this.initializeRoom(room);
        }

    }

    // Set flags on sources and store names in room memory
    private initializeRoom(room: Room): void {

        initObjectMemory(room.memory, SOURCE);

        // Add task for each source to be mined | TODO configurable ammount of harvesters
        room.find(FIND_SOURCES).forEach(src => {
            // 3000 energy per tick, reset every 300 ticks
            this.harvestRepo.add(new HarvestTask(src.room.name, 1, 10, RESOURCE_ENERGY, src.id, undefined, src.pos)); // all use same prio for now
            this.log.debug(src.room, `${src.pos}: added harvest task`);

            room.memory.objects?.source?.push({ id: src.id, pos: src.pos, type: SOURCE });
        })
    }
}

profiler.registerClass(SourceController, 'SourceController');

import { injectable } from "tsyringe";

import { HarvestTaskRepo } from "repos/harvest-task-repo";
import { HarvestTask } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import profiler from "screeps-profiler";

@injectable()
export class SourceController implements Controller {

    constructor(private log: Logger, private harvestRepo: HarvestTaskRepo) {
    }

    public monitor(room: Room): void {

        if (!room.memory.sources || room.memory.sources.length == 0) {
            this.initializeRoom(room);
        }

    }

    // Set flags on sources and store names in room memory
    private initializeRoom(room: Room): void {

        room.memory.sources = [];

        // Add task for each source to be mined | TODO configurable ammount of harvesters
        room.find(FIND_SOURCES).forEach(src => {
            // 3000 energy per tick, reset every 300 ticks
            this.harvestRepo.add(new HarvestTask(src.room.name, 1, 10, src.id, undefined, src.pos)); // all use same prio for now
            this.log.debug(src.room, `${src.pos}: added harvest task`);

            room.memory.sources.push({ id: src.id, pos: src.pos });

        })
    }
}

profiler.registerClass(SourceController, 'SourceController');

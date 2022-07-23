import { injectable } from "tsyringe";

import { HarvestTaskRepo } from "repos/source/harvest-task-repo";
import { Task } from "repos/tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { initObjectMemory } from "structures/memory/structure-memory";
import { SOURCE } from "utils/custom-types";

import profiler from "screeps-profiler";

@injectable()
export class SourceController implements Controller {

    constructor(private log: Logger, private harvestRepo: HarvestTaskRepo) {
    }

    public monitor(room: Room): void {

        // if (Game.time % 10 != 0) return;

        // TODO rooms without sources ?
        if (!room.memory.objects?.source) { // || room.memory.objects.source.length == 0
            this.initializeRoom(room);
        }

        if (room.memory.objects && room.memory.objects.source) {
            room.memory.objects.source.forEach(src => {
                const existing = this.harvestRepo.getForRequester(src.id);
                if (!existing || existing.length == 0) {
                    this.harvestRepo.add(new Task(room.name, 1, 10, RESOURCE_ENERGY, src.id, undefined, src.pos));
                }
            })
        }

    }

    // Set flags on sources and store names in room memory
    private initializeRoom(room: Room): void {

        initObjectMemory(room.memory, SOURCE);

        // Add task for each source to be mined | TODO configurable ammount of harvesters
        room.find(FIND_SOURCES).forEach(src => {
            // 3000 energy per tick, reset every 300 ticks
            // this.log.debug(src.room, `${src.pos}: added harvest task`);
            room.memory.objects?.source?.push({ id: src.id, pos: src.pos, type: SOURCE });
        })
    }
}

profiler.registerClass(SourceController, 'SourceController');

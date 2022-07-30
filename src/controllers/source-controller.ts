import { injectable } from "tsyringe";

import { HarvestTaskRepo } from "repos/tasks/source/harvest-task-repo";
import { Task } from "repos/tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { initObjectMemory } from "structures/memory/structure-memory";
import { SOURCE } from "utils/custom-types";

import profiler from "screeps-profiler";
import { posix } from "path";

@injectable()
export class SourceController implements Controller {

    constructor(private log: Logger, private harvestRepo: HarvestTaskRepo) {
    }

    public monitor(room: Room): void {

        // if (Game.time % 10 != 0) return;

        if (!room.memory.objects?.source || room.memory.objects.source.length == 0) {
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

        const terrain = Game.map.getRoomTerrain(room.name);
        initObjectMemory(room.memory, SOURCE);

        // Add task for each source to be mined | TODO configurable ammount of harvesters
        room.find(FIND_SOURCES).forEach(src => {
            // 3000 energy per tick, reset every 300 ticks
            // this.log.debug(src.room, `${src.pos}: added harvest task`);
            const positions = this.nearestPositions(src.pos)
                .map<number>(pos => terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL ? 0 : 1)
                .reduce((sum, val) => sum + val, 0);
            const sourceMem: SourceMemory = { id: src.id, pos: src.pos, type: SOURCE, positions: positions };
            room.memory.objects?.source?.push(sourceMem);
        })
    }

    private nearestPositions(pos: RoomPosition): RoomPosition[] {
        const positions = [];
        for (let x = pos.x - 1; x <= pos.x + 1; x++) {
            for (let y = pos.y - 1; y <= pos.y + 1; y++) {
                if (x < 0 || x >= 50 ||
                    y < 0 || y >= 50) continue
                if (x == pos.x && y == pos.y) continue;
                positions.push(new RoomPosition(x, y, pos.roomName));
            }
        }
        return positions;
    }
}

profiler.registerClass(SourceController, 'SourceController');

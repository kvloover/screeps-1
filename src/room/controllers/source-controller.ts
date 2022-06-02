import { injectable } from "tsyringe";

import { HarvestTaskRepo } from "repos/tasks/harvest-task-repo";
import { HarvestTask } from "tasks/task";
import { Controller } from "./controller";
import { Logger } from "logger";

@injectable()
export class SourceController implements Controller{

    constructor(private log: Logger, private harvestRepo: HarvestTaskRepo) {
    }

    public monitor(room: Room): void {

        if (!room.memory.sources) {
            this.initializeRoom(room);
        }

        this.harvestRepo.list();

        // if (room.memory.sources) {
        //     room.memory.sources.forEach(tag => {
        //         if (Game.flags.hasOwnProperty(tag)) {
        //             const flag = Game.flags[tag];
        //             if (flag) {
        //                 if (flag.memory.maxRequests > flag.memory.requests) {
        //                     // REQUEST
        //                 }
        //             }
        //         }
        //     });
        // }
    }

    // Set flags on sources and store names in room memory
    private initializeRoom(room: Room): void {
        const srces =
            room.find(FIND_SOURCES)
                .map((src, ind) => { return { item: src, name: `${room.name}_source${ind}` } });

        // Add task for each source to be mined | TODO configurable ammount of harvesters
        srces.forEach(kv => {
            // 3000 energy per tick, reset every 300 ticks
             this.harvestRepo.add(new HarvestTask(1, 10, kv.item.id, undefined, kv.item)); // all use same prio for now
        })

        room.memory.sources = [];
        srces.forEach(src => {
            const ret = room.createFlag(src.item.pos, src.name);
            if (typeof ret === 'string') {
                const flag = Game.flags[ret]
                this.initializeFlag(flag, src.item)
                // Add to room memory for easy acces
                room.memory.sources.push(ret);
            }
        });

        room.memory.sources = srces.map(i => i.name);
    }

    private initializeFlag(flag: Flag, item: Source): void {
        flag.memory.objectId = item.id;
        flag.memory.maxRequests = 2; // default TODO
        flag.memory.requests = 0;
    }
}

declare global {
    interface RoomMemory {
        sources: string[];
    }
}

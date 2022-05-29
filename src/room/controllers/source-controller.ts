import { injectable } from "tsyringe";

@injectable()
export class SourceController {

    public monitor(room: Room): void {

        if (!room.memory.sources) {
            this.initializeRoom(room);
        }

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
        const srces = room.find(FIND_SOURCES)
            .map((src, ind) => { return { item: src, name: `${room.name}_source${ind}` } });

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
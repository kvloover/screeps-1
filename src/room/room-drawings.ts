import { singleton } from "tsyringe";

@singleton()
export class RoomDrawings {
    constructor() { }

    persist(key: string, visual: RoomVisual) {
        const roomMem = Memory.rooms[visual.roomName];
        if (roomMem) {
            const data = visual.export();
            roomMem.visuals = roomMem.visuals || {};
            roomMem.visuals[key] = data;
        }
    }

    restore(roomName: string) {
        const roomMem = Memory.rooms[roomName];
        if (roomMem) {
            const visuals = roomMem.visuals;
            if (visuals) {
                for (const key in visuals) {
                    const data = visuals[key];
                    const visual = new RoomVisual(roomName);
                    visual.import(data);
                }
            }
        }
    }
}

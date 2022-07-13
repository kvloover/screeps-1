import { singleton } from "tsyringe";

@singleton()
export class RoomDrawings {
    constructor() { }

    persist(key: string, visual: RoomVisual) {
        if (!global.visuals) { global.visuals = {}; }
        const roomMem = global.visuals[visual.roomName];
        if (!roomMem) { global.visuals[visual.roomName] = {}; }

        if (roomMem) {
            const data = visual.export();
            roomMem[key] = data;
        }
    }

    restore(roomName: string) {

        const roomMem = global.visuals?.[roomName];
        if (roomMem) {
            const visual = new RoomVisual(roomName);
            for (const key in roomMem) {
                const data = roomMem[key];
                visual.import(data);
            }
        }
    }
}

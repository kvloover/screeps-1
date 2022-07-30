import { Console } from "console";
import { SpawnManager } from "structures";

export function initializeOnRespawn(): boolean {

    let initialized = false;

    global.refs = undefined;
    global.repair = undefined;
    Memory.persistency = {} as any;

    for (const name in Memory.rooms) {
        if (!(name in Game.rooms)) {
            delete Memory.rooms[name];
        } else {
            Memory.rooms[name] = {} as any;
        }
    }

    for (let room of Object.values(Game.rooms)) {
        console.log(`Initializing room ${room.name}`);
        SpawnManager.init(room);
        initialized = true;
    }

    return initialized;
}

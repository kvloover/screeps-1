import { Console } from "console";
import { SpawnManager } from "structures";

export function initializeOnRespawn(): boolean {

    let initialized = false;
    for (let room of Object.values(Game.rooms)) {
        console.log(`Initializing room ${room.name}`);
        SpawnManager.init(room);
        initialized = true;
    }

    for (const name in Memory.rooms) {
        if (!(name in Game.rooms)) {
            delete Memory.rooms[name];
        }
    }

    return initialized;
}

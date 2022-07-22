import { SpawnManager } from "structures";

export function initializeOnRespawn(): boolean {

    let initialized = false;
    for (let room of Object.values(Game.rooms)) {
        SpawnManager.init(room);
        initialized = true;
    }

    return initialized;
}

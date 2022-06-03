import { injectable, injectAll } from "tsyringe";

import { Manager } from "manager";
import { Controller, Controllers } from "./controllers/controller";

@injectable()
export class RoomManager implements Manager {

    constructor(
        // private log: Logger
        @injectAll(Controllers.token) private controllers: Controller[]) { }

    public run(room: Room): void {
        this.initMemory(room);
        this.controllers.forEach(c => {
            c.monitor(room);
        })
    }

    private initMemory(room: Room) {
        if (!room.memory.debug) { room.memory.debug = false; }
        if (!room.memory.remote) { room.memory.remote = 'E6S48'; }
        if (!room.memory.attack) { room.memory.attack = 'E6S47'; }
    }

}

declare global {
    interface RoomMemory {
        debug: boolean
        remote: string | undefined
        attack: string | undefined
    }
}

import { injectable, injectAll } from "tsyringe";

import { Manager } from "manager";
import { Controller, Controllers } from "../controllers/controller";

import profiler from "screeps-profiler";

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
    }

}

profiler.registerClass(RoomManager, 'RoomManager');

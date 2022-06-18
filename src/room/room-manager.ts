import { singleton, injectAll } from "tsyringe";

import { Manager } from "manager";
import { Controller, Controllers } from "../controllers/controller";

import profiler from "screeps-profiler";

@singleton()
export class RoomManager implements Manager {

    constructor(
        // private log: Logger
        @injectAll(Controllers.token) private controllers: Controller[]) { }

    public run(room: Room): void {
        this.initMemory(room);
        this.controllers.forEach(c => {
            c.monitor(room);
        })
        if (room.memory.reset) room.memory.reset = false;
    }

    private initMemory(room: Room) {
        if (!room.memory.debug) { room.memory.debug = false; }
    }

}

profiler.registerClass(RoomManager, 'RoomManager');

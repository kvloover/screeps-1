import { singleton, injectAll } from "tsyringe";

import { Manager } from "manager";
import { Controller, Controllers } from "../controllers/controller";

import profiler from "screeps-profiler";
import { RoomDrawings } from "./room-drawings";

@singleton()
export class RoomManager implements Manager {

    constructor(
        // private log: Logger
        @injectAll(Controllers.token) private controllers: Controller[],
        private drawings: RoomDrawings) { }

    public run(room: Room): void {
        this.initMemory(room);
        this.controllers.forEach(c => c.monitor(room));
        this.drawings.restore(room.name);
        if (room.memory.reset) room.memory.reset = false;
    }

    private initMemory(room: Room) {
    }

}

profiler.registerClass(RoomManager, 'RoomManager');

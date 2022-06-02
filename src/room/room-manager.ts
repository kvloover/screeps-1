import { injectable } from "tsyringe";

import { Manager } from "manager";
import { SourceController } from "./controllers/source-controller";

import { EmergencyController } from "./controllers/emergency-controller";

@injectable()
export class RoomManager implements Manager {

    constructor(
        // private log: Logger,
        private sources: SourceController,
        private emergency: EmergencyController) { }

    public run(room: Room): void {

        if (!room.memory.remote) { room.memory.remote = 'E6S48'; }
        if (!room.memory.attack) { room.memory.attack = 'E6S47'; }

        this.sources.monitor(room);
        this.emergency.monitor(room);
    }

}

declare global {
    interface RoomMemory {
        remote: string | undefined
        attack: string | undefined
    }
}

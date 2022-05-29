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
        this.sources.monitor(room);
        this.emergency.monitor(room);
    }

}

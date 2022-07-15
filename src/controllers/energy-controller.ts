import { injectable } from "tsyringe";

import { Controller } from "./controller";
import { Logger } from "logger";

import { isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class EnergyController implements Controller {

    constructor(private log: Logger) { }

    public monitor(room: Room): void {
        if (Game.time % 21 != 0) return; // not too important to immediately spot

        if (!isMyRoom(room) || !room.terminal || !room.storage)
            return;

        const energy = room.storage.store.getUsedCapacity(RESOURCE_ENERGY)
            + room.terminal.store.getUsedCapacity(RESOURCE_ENERGY);

        if (energy > 100000) {
            this.log.debug(room.name, `Room energy supplying`);
            room.memory.request = false;
            room.memory.supply = true;
        } else if (energy < 50000) {
            this.log.debug(room.name, `Room energy requesting`);
            room.memory.request = true;
            room.memory.supply = false;
        } else {
            this.log.debug(room.name, `Room energy standalone`);
            room.memory.request = false;
            room.memory.supply = false;
        }
    }
}

profiler.registerClass(EnergyController, 'EnergyController');

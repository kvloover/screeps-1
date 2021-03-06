import { injectable } from "tsyringe";

import { Logger } from "logger";
import { Controller } from "./controller";
import { isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class EmergencyController implements Controller {

    leeway: number = 0.3; // x % leeway before stating emergency

    constructor(private log: Logger) { }

    public monitor(room: Room): void {
        if (!isMyRoom(room))
            return;

        if (Game.time % 5 != 0) return; // not too important to immediately spot

        if (!room.memory.emergency) {
            room.memory.emergency = {
                active: false,
                notified: false,
            }
        }

        const hostiles = room.find(FIND_HOSTILE_CREEPS)
            .map(c =>
                c.body.filter(i => i.type === ATTACK).length
                + 5 * c.body.filter(i => i.type === RANGED_ATTACK).length
                + 5 * c.body.filter(i => i.type === HEAL).length)
            .reduce((pv, v) => v + pv, 0);

        if (hostiles == 0 && !room.memory.emergency.active)
            return;

        const defenders = room.find(FIND_MY_CREEPS)
            .map(c => c.body.filter(i => i.type === ATTACK || i.type === RANGED_ATTACK).length)
            .reduce((pv, v) => v + pv, 0);

        const towers = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType === STRUCTURE_TOWER && struct.store.getUsedCapacity(RESOURCE_ENERGY) > 0 })
            .length;

        const friendly = defenders + 10 * towers;

        if (hostiles > (1 + this.leeway) * friendly) {
            room.memory.emergency.active = true;
            if (room.controller && room.controller.safeMode) {
                this.notifySafe(room, hostiles, friendly);
            } else if (room.controller && room.controller.safeModeAvailable && !room.controller.safeModeCooldown) {
                room.controller.activateSafeMode();
                this.notifySafe(room, hostiles, friendly);
            } else {
                this.notifyUnsafe(room, hostiles, friendly);
            }
        } else {
            room.memory.emergency.active = false;
            room.memory.emergency.notified = false;
        }

    }

    private notifySafe(room: Room, hostiles: number, friendly: number): void {
        this.log.critical(room.name, `room ${room.name} in emergency SAFE MODE ${room.controller?.safeMode ?? 0} ticks left`);
        if (!room.memory.emergency.notified) {
            Game.notify(`SAFE MODE ENABLED
            Emergency triggered in room ${room.name}
            hostile power = ${hostiles}
            friendly power = ${friendly}`);
            room.memory.emergency.notified = true;
        }
    }

    private notifyUnsafe(room: Room, hostiles: number, friendly: number): void {
        this.log.critical(room.name, `room ${room.name} in emergency NOT SAFE`);
        if (!room.memory.emergency.notified) {
            room.memory.emergency.active = true;
            Game.notify(`NO SAFE MODE
            Emergency triggered in room ${room.name}
            hostile power = ${hostiles}
            friendly power = ${friendly}`);
            room.memory.emergency.notified = true;
        }
    }

}

declare global {
    interface RoomMemory {
        emergency: RoomEmergency;
    }

    interface RoomEmergency {
        active: boolean;
        notified: boolean;
    }
}

profiler.registerClass(EmergencyController, 'EmergencyController');

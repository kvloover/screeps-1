import { Logger } from "logger";
import { injectable } from "tsyringe";

@injectable()
export class EmergencyController {

    leeway: number = 0.3; // x % leeway before stating emergency

    constructor(private log: Logger) { }

    public monitor(room: Room): void {
        const hostiles = room.find(FIND_HOSTILE_CREEPS)
            .map(c => c.body.filter(i => i.type === ATTACK || i.type === RANGED_ATTACK).length)
            .reduce((pv, v) => v + pv, 0);

        const defenders = room.find(FIND_MY_CREEPS)
            .map(c => c.body.filter(i => i.type === ATTACK || i.type === RANGED_ATTACK).length)
            .reduce((pv, v) => v + pv, 0);

        const towers = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType === STRUCTURE_TOWER })
            .length;

        const friendly = defenders + 10 * towers;

        if (!room.memory.emergency) {
            room.memory.emergency = {
                active: false,
                notified: false,
            }
        }

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
        this.log.Important(`room ${room.name} in emergency SAFE MODE ${room.controller?.safeMode ?? 0} ticks left`);
        if (!room.memory.emergency.notified) {
            Game.notify(`SAFE MODE ENABLED
            Emergency triggered in room ${room.name}
            hostile power = ${hostiles}
            friendly power = ${friendly}`);
            room.memory.emergency.notified = true;
        }
    }

    private notifyUnsafe(room: Room, hostiles: number, friendly: number): void {
        this.log.Critical(`room ${room.name} in emergency NOT SAFE`);
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

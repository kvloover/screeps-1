import { Persistency, Persistent } from "repos/persistent";
import { container } from "tsyringe";
import { CreepState } from "./creep-state";
import { isDefined } from "./utils";

export class ExConsole {
    static init() {
        global.debug = this.debug;
        global.stopDebug = this.stopDebug;
        global.remote = this.remote;
        global.attack = this.attack;
        global.reset = this.reset;
    }

    static debug(roomName: string): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            Memory.rooms[roomName].debug = true;
            return `Enabled debugging for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    static stopDebug(roomName: string): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            Memory.rooms[roomName].debug = false;
            return `Disabled debugging for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    static remote(roomName: string, value: string | undefined): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            Memory.rooms[roomName].remote = value;
            return `Remote set for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    static attack(roomName: string, value: string | undefined): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            Memory.rooms[roomName].attack = value;
            return `Attack set for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    // TODO rework
    static reset(roomName: string): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            const room = Memory.rooms[roomName];

            // Reset memory triggers
            // TODO creep spawn conditions
            room.remote = undefined;
            room.attack = undefined;

            // TODO rework tasks crossing rooms
            const pers = container.resolveAll<Persistent>(Persistency.token);
            pers.forEach(p => {
                p.clearRoomRef(roomName);
                p.save();
            });

            // Trigger harvest tasks (only made on initial)
            room.sources = [];

            // Trigger work
            _.filter(Memory.creeps, c => c.room === roomName)
                .forEach(m => {
                    m.tasks = {};
                    m.state = CreepState.idle;
                    m.targetId = undefined;
                });

            return `Reset room ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }
}

declare global {
    namespace NodeJS {
        interface Global {
            debug: (room: string) => string;
            stopDebug: (room: string) => string;
            reset: (room: string) => string;
            remote: (room: string, value: string | undefined) => string;
            attack: (room: string, value: string | undefined) => string;
        }
    }
}

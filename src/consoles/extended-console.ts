import { Logger } from "logger";
import { Persistency, Persistent } from "repos/persistent";
import { LinkManager, SpawnManager, TowerManager } from "structures";
import { container } from "tsyringe";
import { CreepState } from "../utils/creep-state";
import { GarbageCollector } from "../utils/garbage-collect";

export class ExConsole {
    static init() {
        global.cli = {
            gc: ExConsole.gc,

            reset: ExConsole.reset,
            logLevel: (v) => { Logger.setLevel(v); return `Log level set to ${v}`; },
            logContent: (v) => { Logger.setFilterContent(v); return `Log content set to ${v}`; },
            logRooms: (v) => { Logger.setFilterRooms(v); return `Log rooms set to ${v}`; },

            remote: (m, v) => ExConsole.toggle(m, 'remote', v),
            attack: (m, v) => ExConsole.toggle(m, 'attack', v),
            conquer: (m, v) => ExConsole.toggle(m, 'conquer', v),
            staging: (m, v) => ExConsole.toggle(m, 'staging', v),

            upgrading: (m, v) => ExConsole.toggle(m, 'upgrading', v),
            building: (m, v) => ExConsole.toggle(m, 'building', v),
            remote_attack: (m, v) => ExConsole.toggle(m, 'remote_defend', v),
            remote_mining: (m, v) => ExConsole.toggle(m, 'remote_mining', v),
            remote_hauler: (m, v) => ExConsole.toggle(m, 'remote_hauler', v),
            claim: (m, v) => ExConsole.toggle(m, 'conquerer', v),
            drain: (m, v) => ExConsole.toggle(m, 'drain', v),
            healer: (m, v) => ExConsole.toggle(m, 'healer', v),

            init_links: ExConsole.init_links,
            init_towers: ExConsole.init_towers,
            init_spawns: ExConsole.init_spawns,
            init_sources: ExConsole.init_sources,

            print: ExConsole.print
        }
    }

    static gc(): string {
        GarbageCollector.gc();
        return `Garbage collected`
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
            if (room.objects) room.objects.source = [];

            // Trigger work
            _.filter(Memory.creeps, c => c.room === roomName)
                .forEach(m => {
                    m.tasks = {};
                    m.state = CreepState.idle;
                    m.targetId = undefined;
                });

            // Reset links
            if (Game.rooms.hasOwnProperty(roomName)) {
                const room = Game.rooms[roomName];
                LinkManager.init(room);
                SpawnManager.init(room);
                TowerManager.init(room);
            }

            room.reset = true;

            return `Reset room ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    private static init_links(roomName: string): string {
        if (Game.rooms.hasOwnProperty(roomName)) {
            const room = Game.rooms[roomName];
            LinkManager.init(room)
            return `room links init for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    private static init_towers(roomName: string): string {
        if (Game.rooms.hasOwnProperty(roomName)) {
            const room = Game.rooms[roomName];
            TowerManager.init(room)
            return `room towers init for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    private static init_spawns(roomName: string): string {
        if (Game.rooms.hasOwnProperty(roomName)) {
            const room = Game.rooms[roomName];
            SpawnManager.init(room)
            return `room spawns init for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    private static init_sources(roomName: string): string {
        if (Game.rooms.hasOwnProperty(roomName)) {
            const room = Game.rooms[roomName];
            if (room.memory.objects) room.memory.objects.source = [];
            return `room sources init for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    private static toggle(roomName: string, key: keyof RoomMemory, value: any): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            const room = Memory.rooms[roomName];
            (room as any)[key] = value;
            return `${key} set for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    private static print(str: any): string {
        return JSON.stringify(str, null, "\t");
    }

}

declare global {
    namespace NodeJS {
        interface Global {
            cli?: ExConsole;
        }

        interface ExConsole {
            gc: () => string;

            logLevel: (value: number) => string;
            logContent: (value: string| undefined) => string;
            logRooms: (value: string| undefined) => string;
            reset: (room: string) => string;

            remote: (room: string, value: string | undefined) => string;
            attack: (room: string, value: string | undefined) => string;
            conquer: (room: string, value: string | undefined) => string;
            staging: (room: string, value: string | undefined) => string;

            // Toggles
            building: (roomName: string, value: boolean | undefined) => string;
            upgrading: (roomName: string, value: boolean | undefined) => string;
            remote_attack: (roomName: string, value: boolean | undefined) => string;
            remote_mining: (roomName: string, value: boolean | undefined) => string;
            remote_hauler: (roomName: string, value: boolean | undefined) => string;
            claim: (roomName: string, value: boolean | undefined) => string;
            drain: (roomName: string, value: boolean | undefined) => string;
            healer: (roomName: string, value: boolean | undefined) => string;

            // Init
            init_links: (room: string) => string;
            init_towers: (room: string) => string;
            init_spawns: (room: string) => string;
            init_sources: (room: string) => string;

            print: (str: any) => string;
        }
    }
}


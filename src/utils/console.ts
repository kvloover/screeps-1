import { Persistency, Persistent } from "repos/persistent";
import { LinkManager, SpawnManager, TowerManager } from "structures";
import { container } from "tsyringe";
import { CreepState } from "./creep-state";
import { GarbageCollector } from "./garbage-collect";

export class ExConsole {
    static init() {
        global.cli = {
            help: ExConsole.help,

            gc: ExConsole.gc,

            debug: ExConsole.debug,
            stopDebug: ExConsole.stopDebug,
            reset: ExConsole.reset,

            remote: ExConsole.remote,
            attack: ExConsole.attack,
            conquer: ExConsole.conquer,

            upgrading: (m, v) => ExConsole.toggle(m, 'upgrading', v),
            building: (m, v) => ExConsole.toggle(m, 'building', v),
            remote_attack: (m, v) => ExConsole.toggle(m, 'remote_attack', v),
            remote_mining: (m, v) => ExConsole.toggle(m, 'remote_mining', v),
            claim: (m, v) => ExConsole.toggle(m, 'claim', v),

            init_links: ExConsole.init_links,
            init_towers: ExConsole.init_towers,
            init_spawns: ExConsole.init_spawns
        }
    }

    static help(): string {
        const lines: string[] = [];
        lines.push(`gc(roomName)\t\t\t remove reference to dead artifacts`);
        lines.push(`------------------------------------------------------------------`);
        lines.push(`debug(roomName)\t\t\t turn on debugging`);
        lines.push(`stopDebug(roomName)\t\t turn off debugging`);
        lines.push(`------------------------------------------------------------------`);
        lines.push(`reset(roomName)\t\t\t reset all persistency and creeps of the room`);
        lines.push(`init_links(roomName)\t\t initialize the links and their config`);
        lines.push(`init_towers(roomName)\t\t initialize the towers and their config`);
        lines.push(`init_spawns(roomName)\t\t initialize the spawns and their config`);
        lines.push(`------------------------------------------------------------------`);
        lines.push(`remote(roomName, value)\t\t set the remote room`);
        lines.push(`attack(roomName, value)\t\t set the attack room`);
        lines.push(`attack(roomName, value)\t\t set the conquer room`);
        lines.push(`------------------------------------------------------------------`);
        lines.push(`upgrading(roomName, value)\t set upgrading toggle`);
        lines.push(`building(roomName, value)\t set building toggle`);
        lines.push(`remote_attack(roomName, value)\t set remote_attack toggle`);
        lines.push(`remote_mining(roomName, value)\t set remote_mining toggle`);
        lines.push(`claim(roomName, value)\t\t set claim toggle`);
        lines.push(`------------------------------------------------------------------`);
        return lines.join('\n');
    }

    static gc(): string {
        GarbageCollector.gc();
        return `Garbage collected`
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

    static conquer(roomName: string, value: string | undefined): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            Memory.rooms[roomName].conquer = value;
            return `Conquer set for ${roomName}.`;
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

            // Reset links
            if (Game.rooms.hasOwnProperty(roomName)) {
                const room = Game.rooms[roomName];
                LinkManager.init(room);
                SpawnManager.init(room);
                TowerManager.init(room);
            }

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

    private static toggle(roomName: string, key: keyof RoomMemory, value: boolean | undefined): string {
        if (Memory.rooms.hasOwnProperty(roomName)) {
            const room = Memory.rooms[roomName];
            (room as any)[key] = value;
            return `${key} set for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }
}

declare global {
    namespace NodeJS {
        interface Global {
            cli?: ExConsole;
        }

        interface ExConsole {
            help: () => string;

            gc: () => string;

            debug: (room: string) => string;
            stopDebug: (room: string) => string;
            reset: (room: string) => string;

            remote: (room: string, value: string | undefined) => string;
            attack: (room: string, value: string | undefined) => string;
            conquer: (room: string, value: string | undefined) => string;

            // Toggles
            building: (roomName: string, value: boolean | undefined) => string;
            upgrading: (roomName: string, value: boolean | undefined) => string;
            remote_attack: (roomName: string, value: boolean | undefined) => string;
            remote_mining: (roomName: string, value: boolean | undefined) => string;
            claim: (roomName: string, value: boolean | undefined) => string;

            // Init
            init_links: (room: string) => string;
            init_towers: (room: string) => string;
            init_spawns: (room: string) => string;
        }
    }
}


export class ExConsole {
    static init() {
        global.debug = this.debug;
        global.stopDebug = this.stopDebug;
        global.remote = this.remote;
        global.attack = this.attack;
    }

    static debug(room: string): string {
        if (Memory.rooms.hasOwnProperty(room)) {
            Memory.rooms[room].debug = true;
            return `Enabled debugging for ${room}.`;
        }
        return `Room not known: ${room}`
    }

    static stopDebug(room: string): string {
        if (Memory.rooms.hasOwnProperty(room)) {
            Memory.rooms[room].debug = false;
            return `Disabled debugging for ${room}.`;
        }
        return `Room not known: ${room}`
    }

    static remote(room: string, value: string | undefined): string {
        if (Memory.rooms.hasOwnProperty(room)) {
            Memory.rooms[room].remote = value;
            return `Remote set for ${room}.`;
        }
        return `Room not known: ${room}`
    }

    static attack(room: string, value: string | undefined): string {
        if (Memory.rooms.hasOwnProperty(room)) {
            Memory.rooms[room].attack = value;
            return `Attack set for ${room}.`;
        }
        return `Room not known: ${room}`
    }
}

declare global {
    namespace NodeJS {
        interface Global {
            debug: (room: string) => string;
            stopDebug: (room: string) => string;
            remote: (room: string, value: string | undefined) => string;
            attack: (room: string, value: string | undefined) => string;
        }
    }
}

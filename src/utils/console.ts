export class ExConsole {
    static init() {
        global.debug = this.debug;
        global.stopDebug = this.stopDebug;
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
}

declare global {
    namespace NodeJS {
        interface Global {
            debug: (room: string) => string;
            stopDebug: (room: string) => string;
        }
    }
}

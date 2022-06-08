import { singleton } from "tsyringe";

@singleton()
export class Logger {

    constructor() { }

    public info(msg: string): void {
        if (Game.time % 10 == 0) { console.log(msg); }
    }

    public important(msg: string): void {
        if (Game.time % 5 == 0) { console.log(msg); }
    }

    public critical(msg: string): void {
        console.log(msg);
    }

    public debug(room: Room, msg: string): void {
        if (room.memory.debug) {
            console.log(`[${room.name}] ${msg}`);
        }
    }

    public error(e: unknown, msg?: string): void {
        if (typeof e === "string") {
            console.log(msg ? `${msg}: ${e}` : e);
        } else if (e instanceof Error) {
            if (msg) console.log(`${msg}:`);
            console.log(e);
        }
    }
}

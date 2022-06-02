import { injectable } from "tsyringe";

@injectable()
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
            console.log(msg);
        }
    }

    public error(e: unknown): void {
        if (typeof e === "string") {
            console.log(e);
        } else if (e instanceof Error) {
            console.log(e);
        }
    }
}

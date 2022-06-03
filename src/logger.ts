import { injectable } from "tsyringe";

@injectable()
export class Logger {

    constructor() { }

    public Information(msg: string): void {
        if (Game.time % 10 == 0) { console.log(msg); }
    }

    public Important(msg: string): void {
        if (Game.time % 5 == 0) { console.log(msg); }
    }

    public Critical(msg: string): void {
        console.log(msg);
    }

    public Error(e: unknown) : void {
        if (typeof e === "string") {
            console.log(e);
        } else if (e instanceof Error) {
            console.log(e);
        }
    }
}

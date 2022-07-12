import { singleton } from "tsyringe";
import { ErrorMapper } from "utils/error-mapper";

type LogMessage = string | (() => string);

export enum LogLevel {
    Critical = 1,
    Error = 2,
    Warn = 3,
    Info = 4,
    Debug = 5,
    Trace = 6,
}

export interface LogFilter {
    content: string | undefined;
    rooms: string | undefined;
}

@singleton()
export class Logger {

    constructor() { }

    private static get settings() {
        if (!Memory.logger) {
            Memory.logger = { level: LogLevel.Warn, filter: {} as LogFilter };
        }
        return Memory.logger;
    }

    public static setLevel(level: LogLevel): void {
        this.settings.level = level;
    }

    public static setFilter(filter: LogFilter): void {
        this.settings.filter = filter;
    }

    public static setFilterContent(value: string | undefined): void {
        this.settings.filter.content = value;
    }

    public static setFilterRooms(value: string | undefined): void {
        this.settings.filter.rooms = value;
    }

    public critical(roomName: string | undefined, msg: string): void {
        this.log(msg, roomName, LogLevel.Critical);
    }

    public error(e: unknown, msg?: string): void {
        if (typeof e === "string") {
            this.log(() => msg ? `${msg}: ${e}` : e, undefined, LogLevel.Error)
        } else if (e instanceof Error) {
            if (msg) this.log(msg, undefined, LogLevel.Error);
            ErrorMapper.logError(e);
        }
    }

    public warn(roomName: string | undefined, msg: string): void {
        this.log(msg, roomName, LogLevel.Warn);
    }

    public info(roomName: string | undefined, msg: string): void {
        this.log(msg, roomName, LogLevel.Info);
    }

    public debug(roomName: string | undefined, msg: string): void {
        this.log(msg, roomName, LogLevel.Debug);
    }

    public trace(roomName: string | undefined, msg: string): void {
        this.log(msg, roomName, LogLevel.Trace);
    }

    private colorForLevel(level: LogLevel): string {
        switch (level) {
            case LogLevel.Critical:
                return 'green';
            case LogLevel.Error:
                return 'red';
            case LogLevel.Warn:
                return 'orange';
            case LogLevel.Info:
                return 'white';
            case LogLevel.Debug:
                return 'white';
            case LogLevel.Trace:
                return 'white';
        }
    }

    private log(message: LogMessage, roomName: string | undefined, level: LogLevel): void {
        if (level > Logger.settings.level) {
            return;
        }
        const filter = Logger.settings.filter;
        if (filter && filter.rooms && roomName && !filter.rooms.includes(roomName)) {
            return;
        }

        const color = this.colorForLevel(level);

        let output = '';
        output += `[${Game.time}] `;
        output += LogLevel[level].toLowerCase();
        output += `: `;

        if (roomName) {
            output += `<a href="#!/room/${Game.shard.name}/${roomName}">${roomName}</a>`;
            output += ` - `;
        }
        output += typeof message === 'function' ? message() : message;


        if (filter && filter.content && !output.includes(filter.content)) {
            return;
        }
        console.log(`<span style="color:${color}">${output}</span>`);
    }
}

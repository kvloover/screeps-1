import { LogFilter, LogLevel } from "logger";
import { Task } from "repos/task";
import { CreepState } from "./utils/creep-state";

export { };

declare global {

    interface Memory {
        avoid: string[];
        roomVisuals: boolean;
        logger: { level: LogLevel, filter: LogFilter } | undefined;
    }

    interface FlagMemory {
        objectId: Id<_HasId>; // For Game.GetObject
        maxRequests: number;
        requests: number;
    }

    interface RoomMemory {
        stage: number;
        phase: number;
        manual: boolean;

        remote: string | undefined;
        attack: string | undefined;
        staging: string | undefined;
        conquer: string | undefined;

        scout: boolean;
        upgrading: boolean;
        building: boolean;
        claim: boolean;
        drain: boolean;
        healer: boolean;
        remote_attack: boolean;
        remote_mining: boolean;
        remote_hauler: boolean;

        supply: boolean;
        request: boolean;

        reset?: boolean;
    }


    interface CreepMemory {
        id: undefined | Id<_HasId>;
        role: string;
        room: string;

        state: CreepState;
        started: number;
        staging: string | undefined;
        targetRoom: undefined | string;
        targetId: undefined | Id<_HasId>;
        target: undefined | RoomPosition;

        memoryId: undefined | Id<_HasId>; // to store useful Id in memory
        memoryPos: undefined | RoomPosition; // to store useful pos in memory

        tasks: { [key: string]: CreepTask | undefined };
        tasks_blacklist: { [key: string]: string[] }; // ignore specific requesters for the given type
    }

    interface CreepTask {
        repo: string;
        key: string,
        tick: number;
        amount?: number;
        task: Task;
    }

    namespace NodeJS {
        interface Global {
            repair?: Task[];
            timingOffset?: { [key in TimingKey]?: { [key: string]: number } }; // random stored in global for reuse
            visuals?: { [key: string]: { [key: string]: string } };
        }
    }
}

export type TimingKey = 'plan' | 'defense';
export const TIMINGS_MAIN: { [key in TimingKey]: number } = {
    plan: 30,
    defense: 50
}

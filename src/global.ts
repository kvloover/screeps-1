import { LogFilter, LogLevel } from "logger";
import { Task } from "repos/tasks/task";
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
        conquer: string | undefined;

        attack: string | undefined;
        staging: string | undefined;

        scout: boolean;
        reserver: boolean;
        conquerer: boolean;

        upgrading: boolean;
        building: boolean;
        reseve: boolean;
        drain: boolean;
        healer: boolean;

        remote_builder: boolean;
        remote_mining: number | undefined;
        remote_hauler: number | undefined;
        remote_defend: number | undefined;
        conquer_attack: number | undefined;

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

        objective: undefined | string;

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
            lastReset: number;
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

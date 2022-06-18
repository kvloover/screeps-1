import { Task } from "repos/task";
import { CreepState } from "./utils/creep-state";

export { };

declare global {

    interface Memory {
        avoid: string[];
    }

    interface FlagMemory {
        objectId: Id<_HasId>; // For Game.GetObject
        maxRequests: number;
        requests: number;
    }

    interface RoomMemory {
        stage: number;
        remote: string | undefined;
        attack: string | undefined;
        conquer: string | undefined;

        debug: boolean;
        upgrading: boolean;
        building: boolean;
        remote_mining: boolean;
        remote_attack: boolean;
        claim: boolean;
    }


    interface CreepMemory {
        id: undefined | Id<_HasId>;
        role: string;
        room: string;

        state: CreepState;
        started: number;
        targetRoom: undefined | string;
        targetId: undefined | Id<_HasId>;
        target: undefined | RoomPosition;

        tasks: { [key: string]: { repo: string; tick: number, task: Task; } | undefined };
        tasks_blacklist: { [key: string]: string[] }; // ignore specific requesters for the given type
    }

    // namespace NodeJS {
    //     interface Global {
    //     }
    // }
}

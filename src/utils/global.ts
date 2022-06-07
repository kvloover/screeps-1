import { CreepState } from "./creep-state";

export { };

declare global {
    // interface Memory {
    //     // uuid: number;
    //     // log: any;
    // }

    interface FlagMemory {
        objectId: Id<_HasId>; // For Game.GetObject
        maxRequests: number;
        requests: number;
    }

    interface RoomMemory {
        stage: number;
        remote: string | undefined
        attack: string | undefined

        debug: boolean;
        remote_mining: boolean;
        remote_attack: boolean;
        claim: boolean;
    }

    interface CreepMemory {
        id: undefined | Id<_HasId>;
        role: string;
        room: string;
        state: CreepState;
        targetRoom: undefined | string;
        targetId: undefined | Id<_HasId>;

        tasks: { [key: string]: { repo: string; id: string; } | undefined };
        tasks_blacklist: { [key: string]: string[] }; // ignore specific requesters for the given type

    }

    // namespace NodeJS {
    //     interface Global {
    //         log: any;
    //     }
    // }
}


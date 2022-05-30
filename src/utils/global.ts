import { CreepState } from "./creep-state";

export { };

declare global {
    // interface Memory {
    //     uuid: number;
    //     log: any;
    // }

    interface FlagMemory {
        objectId: Id<_HasId>; // For Game.GetObject
        maxRequests: number;
        requests: number;
    }

    interface CreepMemory {
        role: string;
        room: string;
        state: CreepState;
    }

    // namespace NodeJS {
    //     interface Global {
    //         log: any;
    //     }
    // }
}


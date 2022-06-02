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
        debug: boolean;
    }

    interface CreepMemory {
        id: undefined | Id<_HasId>;
        role: string;
        room: string;
        state: CreepState;
        targetRoom: undefined | string;
        targetId: undefined | Id<_HasId>;
    }

    // namespace NodeJS {
    //     interface Global {
    //         log: any;
    //     }
    // }
}


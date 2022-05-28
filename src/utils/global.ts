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
        working: boolean;
    }

    // namespace NodeJS {
    //     interface Global {
    //         log: any;
    //     }
    // }
}

export { };

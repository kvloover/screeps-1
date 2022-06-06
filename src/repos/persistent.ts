import { registry } from "tsyringe";

import { MidstreamTaskRepo } from "./tasks/midstream-task-repo";
import { HarvestTaskRepo } from "./tasks/harvest-task-repo";
import { DemandTaskRepo } from "./tasks/demand-task-repo";
import { ProviderTaskRepo } from "./tasks/providor-task-repo";

export interface Persistent {
    restore(): void;
    save(): void;
    clearReference(id: Id<_HasId>): void;
    clearRoomRef(roomName: string): void;
}

// HarvestTaskRepo      : Split sources till 10 energy/tick
// MidstreamTaskRepo    : midstream demand (supplied by harvester)
// ProvidorTaskRepo     : Available energy to take out (include midstream)
// DemandTaskRepo       : Demands for spawning etc

@registry([
    { token: Persistency.token, useToken: HarvestTaskRepo },
    { token: Persistency.token, useToken: MidstreamTaskRepo },
    { token: Persistency.token, useToken: DemandTaskRepo },
    { token: Persistency.token, useToken: ProviderTaskRepo },
])
export abstract class Persistency {
    public static Initialize(): void {
        if (!Memory.persistency)
            Memory.persistency = Object.assign({});
    }
    static readonly token = Symbol('Persistent');
}

declare global {
    interface Memory {
        persistency: Persistency; // Persistency;
    }

    interface Persistency {
    }
}

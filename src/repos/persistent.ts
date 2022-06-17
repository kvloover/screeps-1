import { registry } from "tsyringe";

import { MidstreamTaskRepo } from "./midstream-task-repo";
import { HarvestTaskRepo } from "./harvest-task-repo";
import { DemandTaskRepo } from "./demand-task-repo";
import { ProviderTaskRepo } from "./provider-task-repo";
import { SupplyTaskRepo } from "./supply-task-repo";
import { StorageTaskRepo } from "./storage-task-repo";
import { ConstructionTaskRepo } from "./construction-task-repo";
import { RepairTaskRepo } from "./repair-task-repo";

export interface Persistent {
    restore(): void;
    save(): void;
    gc(): void;
    clearReference(id: Id<_HasId>): void;
    clearRoomRef(roomName: string): void;
}

// HarvestTaskRepo      : Split sources till 10 energy/tick
// MidstreamTaskRepo    : midstream demand (supplied by harvester)
// DemandTaskRepo       : Demands for spawning etc
// ProvidorTaskRepo     : Available energy to take out (include midstream)
// StorageTaskRepo      : Demands for storage
// BatteryTaskRepo      : Provide from storage

@registry([
    { token: Persistency.token, useToken: HarvestTaskRepo },
    { token: Persistency.token, useToken: MidstreamTaskRepo },
    { token: Persistency.token, useToken: DemandTaskRepo },
    { token: Persistency.token, useToken: ProviderTaskRepo },
    { token: Persistency.token, useToken: SupplyTaskRepo },
    { token: Persistency.token, useToken: StorageTaskRepo },
    { token: Persistency.token, useToken: ConstructionTaskRepo },
    { token: Persistency.token, useToken: RepairTaskRepo },
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

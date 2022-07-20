import { registry } from "tsyringe";

import { LinkDemandTaskRepo } from "./link/link-demand-task-repo";
import { HarvestTaskRepo } from "./source/harvest-task-repo";
import { SpawnDemandTaskRepo } from "./spawn/spawn-demand-task-repo";
import { LinkSupplyTaskRepo } from "./link/link-supply-task-repo";
import { StorageSupplyTaskRepo } from "./storage/storage-supply-task-repo";
import { StorageDemandTaskRepo } from "./storage/storage-demand-task-repo";
import { ConstructionTaskRepo } from "./structures/construction-task-repo";
import { RepairTaskRepo } from "./structures/repair-task-repo";
import { LinkSupplyUtilityTaskRepo } from "./link/link-supply-utility-task-repo";
import { RequestTaskRepo } from "./terminal/request-task-repo";
import { ExchangeTaskRepo } from "./terminal/exchange-task-repo";
import { ContainerDemandTaskRepo } from "./container/container-demand-task-repo";
import { ContainerDemandTempTaskRepo } from "./container/container-demand-temp-task-repo";
import { ContainerSupplyTaskRepo } from "./container/container-supply-task-repo";
import { DropTaskRepo } from "./misc/drop-task-repo";
import { TowerDemandTaskRepo } from "./misc/tower-demand-task-repo";
import { TerminalDemandTaskRepo } from "./terminal/terminal-demand-task-repo";
import { TerminalSupplyTaskRepo } from "./terminal/terminal-supply-task-repo";

export interface Persistent {
    restore(): void;
    save(): void;
    gc(): void;
    clearReference(id: Id<_HasId>): void;
    clearRoomRef(roomName: string): void;
}

@registry([
    { token: Persistency.token, useToken: HarvestTaskRepo },
    { token: Persistency.token, useToken: ConstructionTaskRepo },
    { token: Persistency.token, useToken: RepairTaskRepo },
    { token: Persistency.token, useToken: DropTaskRepo },
    { token: Persistency.token, useToken: TowerDemandTaskRepo },
    { token: Persistency.token, useToken: SpawnDemandTaskRepo },
    { token: Persistency.token, useToken: ContainerDemandTaskRepo },
    { token: Persistency.token, useToken: ContainerDemandTempTaskRepo },
    { token: Persistency.token, useToken: ContainerSupplyTaskRepo },
    { token: Persistency.token, useToken: LinkDemandTaskRepo },
    { token: Persistency.token, useToken: LinkSupplyTaskRepo },
    { token: Persistency.token, useToken: LinkSupplyUtilityTaskRepo },
    { token: Persistency.token, useToken: StorageSupplyTaskRepo },
    { token: Persistency.token, useToken: StorageDemandTaskRepo },
    { token: Persistency.token, useToken: RequestTaskRepo },
    { token: Persistency.token, useToken: ExchangeTaskRepo },
    { token: Persistency.token, useToken: TerminalDemandTaskRepo },
    { token: Persistency.token, useToken: TerminalSupplyTaskRepo },
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

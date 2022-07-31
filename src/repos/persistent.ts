import { registry } from "tsyringe";

import { ObjectiveRepo } from "./objectives/objectives-repo";

import { ContainerDemandTaskRepo } from "./tasks/container/container-demand-task-repo";
import { ContainerDemandTempTaskRepo } from "./tasks/container/container-demand-temp-task-repo";
import { ContainerSupplyTaskRepo } from "./tasks/container/container-supply-task-repo";
import { CreepDemandTaskRepo } from "./tasks/creep/creep-demand-task-repo";
import { LinkDemandTaskRepo } from "./tasks/link/link-demand-task-repo";
import { LinkSupplyTaskRepo } from "./tasks/link/link-supply-task-repo";
import { LinkSupplyUtilityTaskRepo } from "./tasks/link/link-supply-utility-task-repo";
import { DropTaskRepo } from "./tasks/misc/drop-task-repo";
import { TowerDemandTaskRepo } from "./tasks/misc/tower-demand-task-repo";
import { HarvestTaskRepo } from "./tasks/source/harvest-task-repo";
import { SpawnDemandTaskRepo } from "./tasks/spawn/spawn-demand-task-repo";
import { StorageDemandTaskRepo } from "./tasks/storage/storage-demand-task-repo";
import { StorageSupplyTaskRepo } from "./tasks/storage/storage-supply-task-repo";
import { ConstructionTaskRepo } from "./tasks/structures/construction-task-repo";
import { RepairTaskRepo } from "./tasks/structures/repair-task-repo";
import { ExchangeTaskRepo } from "./tasks/terminal/exchange-task-repo";
import { RequestTaskRepo } from "./tasks/terminal/request-task-repo";
import { TerminalDemandTaskRepo } from "./tasks/terminal/terminal-demand-task-repo";
import { TerminalSupplyTaskRepo } from "./tasks/terminal/terminal-supply-task-repo";

export interface Persistent {
    restore(): void;
    save(): void;
    gc(): void;
    clearReference(id: Id<_HasId>): void;
    clearRoomRef(roomName: string): void;
}

@registry([
    { token: Persistency.token, useToken: HarvestTaskRepo },
    { token: Persistency.token, useToken: CreepDemandTaskRepo },
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
    { token: Persistency.token, useToken: ObjectiveRepo },
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

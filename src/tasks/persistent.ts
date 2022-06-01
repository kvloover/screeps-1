import { registry } from "tsyringe";

import { ContainerTransferTaskRepo } from "./repos/container-transfer-task-repo";
import { HarvestTaskRepo } from "./repos/harvest-task-repo";
import { TransferTaskRepo } from "./repos/transfer-task-repo";

export interface Persistent {
    restore(): void;
    save(): void;
    clearReference(id: Id<_HasId>): void;
}

@registry([
    { token: Persistency.token, useToken: HarvestTaskRepo },
    { token: Persistency.token, useToken: TransferTaskRepo },
    { token: Persistency.token, useToken: ContainerTransferTaskRepo },
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

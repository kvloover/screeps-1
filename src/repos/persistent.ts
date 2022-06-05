import { registry } from "tsyringe";

import { ContainerTransferTaskRepo } from "./tasks/container-transfer-task-repo";
import { HarvestTaskRepo } from "./tasks/harvest-task-repo";
import { TransferTaskRepo } from "./tasks/transfer-task-repo";

export interface Persistent {
    restore(): void;
    save(): void;
    clearReference(id: Id<_HasId>): void;
    clearRoomRef(roomName: string): void;
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

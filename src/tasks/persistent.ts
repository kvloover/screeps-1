import { registry } from "tsyringe";
import { HarvestTaskRepo } from "./harvest-task-repo";
import { Task } from "./task";

export interface Persistent {
    restore(): void;
    save(): void;
}

@registry([
    { token: Persistency.token, useToken: HarvestTaskRepo }
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

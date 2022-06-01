import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../Persistent";
import { HarvestTask } from "../task";
import { TaskRepo } from "./task-repo";

@scoped(Lifecycle.ContainerScoped)
export class HarvestTaskRepo extends TaskRepo<HarvestTask> implements Persistent {

    constructor() { super('harvest'); }

    // Repository
    // Cf. base class TaskRepo

    // Persistency
    restore(): void {
        if (Memory.persistency?.hasOwnProperty(this.key))
            this.tasks = Memory.persistency.harvest;
    }

    save(): void {
        Memory.persistency = Object.assign(Memory.persistency, { harvest: this.tasks ?? [] });
    }

}

declare global {
    interface Persistency {
        harvest: HarvestTask[];
    }
}



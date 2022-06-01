import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../Persistent";
import { TransferTask } from "../task";
import { TaskRepo } from "./task-repo";

@scoped(Lifecycle.ContainerScoped)
export class TransferTaskRepo extends TaskRepo<TransferTask> implements Persistent {

    constructor() { super('transfer'); }

    // Repository
    // Cf. base class TaskRepo

    // Persistency
    restore(): void {
        if (Memory.persistency?.hasOwnProperty(this.key))
            this.tasks = Memory.persistency.transfer;
    }

    save(): void {
        Memory.persistency = Object.assign(Memory.persistency, { transfer: this.tasks ?? [] });
    }

}

declare global {
    interface Persistency {
        transfer: TransferTask[];
    }
}



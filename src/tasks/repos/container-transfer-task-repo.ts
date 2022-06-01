import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../Persistent";
import { ContainerTransferTask } from "../task";
import { TaskRepo } from "./task-repo";

@scoped(Lifecycle.ContainerScoped)
export class ContainerTransferTaskRepo extends TaskRepo<ContainerTransferTask> implements Persistent {

    constructor() { super('container-transfer'); }

    // Repository
    // Cf. base class TaskRepo

    // Persistency
    restore(): void {
        if (Memory.persistency?.hasOwnProperty(this.key))
            this.tasks = Memory.persistency.container_transfer;
    }

    save(): void {
        Memory.persistency = Object.assign(Memory.persistency, { container_transfer: this.tasks ?? [] });
    }

}

declare global {
    interface Persistency {
        container_transfer: ContainerTransferTask[];
    }
}



import { Logger } from "logger";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../Persistent";
import { ContainerTransferTask } from "../task";
import { TaskRepo } from "./task-repo";

@scoped(Lifecycle.ContainerScoped)
export class ContainerTransferTaskRepo extends TaskRepo<ContainerTransferTask> implements Persistent {

    constructor(log: Logger) { super('container-transfer', log); }

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

    clearReference(id: Id<_HasId>): void {
        // remove if requester
        const requests = _(this.tasks)
            .filter(r => r.requester === id)
            .map(r => r.id);
        for (let i in requests) {
            this.removeById(i);
        }

        // remove other references
        this.tasks.forEach(t => {
            if (t.executer === id) { t.executer = undefined; }
        });
    }

}

declare global {
    interface Persistency {
        container_transfer: ContainerTransferTask[];
    }
}



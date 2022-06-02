import { Logger } from "logger";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../Persistent";
import { TransferTask } from "../task";
import { TaskRepo } from "./task-repo";

@scoped(Lifecycle.ContainerScoped)
export class TransferTaskRepo extends TaskRepo<TransferTask> implements Persistent {

    constructor(log: Logger) { super('transfer', log); }

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
        transfer: TransferTask[];
    }
}



import { Logger } from "logger";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../persistent";
import { ContainerTransferTask } from "../../tasks/task";
import { TaskRepo } from "./base/task-repo";

@scoped(Lifecycle.ContainerScoped)
export class ContainerTransferTaskRepo extends TaskRepo<ContainerTransferTask> implements Persistent {

    constructor(log: Logger) { super('container_transfer', log); }

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
        const requests = this.tasks
            .filter(r => r.requester === id)
            .map(r => r.id);
        requests.forEach(id => {
            this.removeById(id);
        })

        // remove other references
        this.tasks.forEach(t => {
            if (t.executer === id) { t.executer = undefined; }
        });
    }

    clearRoomRef(roomName: string): void {
        // remove if room
        const requests = this.tasks
            .filter(r => r.room === roomName)
            .map(r => r.id);
        requests.forEach(id => {
            this.removeById(id);
        })
    }

}

declare global {
    interface Persistency {
        container_transfer: ContainerTransferTask[];
    }
}



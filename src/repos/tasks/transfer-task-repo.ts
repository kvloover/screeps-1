import { Logger } from "logger";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../persistent";
import { TransferTask } from "../../tasks/task";
import { TaskRepo } from "./base/task-repo";

@scoped(Lifecycle.ContainerScoped)
export class TransferTaskRepo extends TaskRepo<TransferTask> implements Persistent {

    constructor(log: Logger) { super('transfer', log); }

    // Repository
    // Cf. base class TaskRepo

    // Persistency
    restore(): void {
        if (Memory.persistency?.hasOwnProperty(this.key))
            this.tasks = Memory.persistency.transfer;
        //console.log(`on restore ${this.key}: ${this.tasks.length}`)
    }

    save(): void {
        //console.log(`on saving ${this.key}: ${this.tasks.length}`)
        Memory.persistency = Object.assign(Memory.persistency, { transfer: this.tasks ?? [] });
        //console.log(`in persistency ${this.key}: ${Memory.persistency.transfer.length}`)
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

    clearRoomRef(roomName: string): void {
        // remove if room

        const requests = this.tasks.filter(r => r.room === roomName);
        if (requests.length > 0) {
            //console.log(`before clearing ${this.key}: ${this.tasks.length}`)
            this.tasks = _.difference(this.tasks, requests);
            //console.log(`after clearing ${this.key}: ${this.tasks.length}`)
        }
    }

}

declare global {
    interface Persistency {
        transfer: TransferTask[];
    }
}



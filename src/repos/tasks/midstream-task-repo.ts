import { Logger } from "logger";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../persistent";
import { MidstreamTask } from "../../tasks/task";
import { TaskRepo } from "./_base/task-repo";

/**
* midstream demand
**/
@scoped(Lifecycle.ContainerScoped)
export class MidstreamTaskRepo extends TaskRepo<MidstreamTask> implements Persistent {

    constructor(log: Logger) { super('midstream', log); }

    // Repository
    // Cf. base class TaskRepo

    // Persistency
    restore(): void {
        if (Memory.persistency?.hasOwnProperty(this.key))
            this.tasks = Memory.persistency.midstream;
    }

    save(): void {
        this.mergeEmpty();
        Memory.persistency = Object.assign(Memory.persistency, { midstream: this.tasks ?? [] });
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
        midstream: MidstreamTask[];
    }
}



import { Logger } from "logger";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../persistent";
import { HarvestTask } from "../../tasks/task";
import { TaskRepo } from "./base/task-repo";

@scoped(Lifecycle.ContainerScoped)
export class HarvestTaskRepo extends TaskRepo<HarvestTask> implements Persistent {

    constructor(log: Logger) { super('harvest', log); }

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

    clearReference(id: Id<_HasId>): void {
        // remove if requester
        const requests = _(this.tasks)
            .filter(r => r.requester === id)
            .map(r => r.id);
        for (let i in requests) {
            this.removeById(i);
        }

        // remove other references
        const requesters: Id<_HasId>[] = []
        this.tasks.forEach(t => {
            if (t.executer === id) {
                t.executer = undefined;
                if (t.requester) { requesters.push(t.requester); }
            }
        });

        // merge empty task on requester
        requesters.forEach(req => {
            const requests = _(this.tasks).filter(r => r.requester === req);
            if (requests.size() > 1) {
                const removed = _(this.tasks).remove(requests);
                const record = removed.reduce((prev, curr, index) => {

                })
            }
        })

    }

}

declare global {
    interface Persistency {
        harvest: HarvestTask[];
    }
}



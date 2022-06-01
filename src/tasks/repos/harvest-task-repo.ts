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
        harvest: HarvestTask[];
    }
}



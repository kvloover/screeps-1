import { Logger } from "logger";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../persistent";
import { HarvestTask } from "../../tasks/task";
import { TaskRepo } from "./_base/task-repo";

/**
* Sources to harvest
**/
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
        this.mergeEmpty();
        Memory.persistency = Object.assign(Memory.persistency, { harvest: this.tasks ?? [] });
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
        const requesters: Id<_HasId>[] = []

        this.tasks.forEach(t => {
            if (t.executer == id) {
                t.executer = undefined;
                if (t.requester) { requesters.push(t.requester); }
            }
        });

        // merge empty task on requester > harvest tasks are persistent
        requesters.forEach(req => {
            const requests = this.tasks.filter(r => r.requester === req && !r.executer);
            if (requests.length > 1) {
                this.tasks = _.difference(this.tasks, requests);
                const record = requests.reduce((prev: HarvestTask, curr: HarvestTask) => {
                    if (prev.amount) prev.amount += curr.amount ?? 0;
                    return prev;
                })
                this.add(record);
            }
        })

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
        harvest: HarvestTask[];
    }
}



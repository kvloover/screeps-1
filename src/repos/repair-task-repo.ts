import { Logger } from "logger";
import profiler from "screeps-profiler";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "./persistent";
import { RepairTask } from "./task";
import { BaseRepo } from "./_base/task-repo";

/**
* Construction sites
**/
@scoped(Lifecycle.ContainerScoped)
export class RepairTaskRepo extends BaseRepo<RepairTask> implements Persistent {

    constructor(log: Logger) { super('repair', log); }

    // Repository
    // Cf. base class TaskRepo

    // Persistency
    restore(): void {
        if (Memory.persistency?.hasOwnProperty(this.key))
            this.tasks = global.repair ?? []; //Memory.persistency.repair;
    }

    save(): void {
        this.mergeEmpty();
        global.repair = Object.assign(global.repair ?? [], this.tasks);
    }

    gc(): void {
        const invalid = this.tasks
            .filter(r =>
                (r.requester && !Game.getObjectById(r.requester))
                || (r.executer && !Game.getObjectById(r.executer))
            )
            .map(r => r.id);

        invalid.forEach(id => {
            this.removeById(id);
        })
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
        repair: RepairTask[];
    }
}

profiler.registerClass(RepairTaskRepo, 'RepairTaskRepo');


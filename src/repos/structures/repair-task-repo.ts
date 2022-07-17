import { Logger } from "logger";
import profiler from "screeps-profiler";
import { Lifecycle, scoped } from "tsyringe";
import { Persistent } from "../persistent";
import { Task } from "../task";
import { BaseRepo } from "../_base/task-repo";

let visuals: { [room: string]: RoomVisual };

/**
* Construction sites
**/
@scoped(Lifecycle.ContainerScoped)
export class RepairTaskRepo extends BaseRepo<Task> implements Persistent {

    constructor(log: Logger) { super('repair', log); }

    private visual(room: string): RoomVisual {
        if (!visuals) visuals = {};
        return visuals[room] ?? (visuals[room] = new RoomVisual(room));
    }

    // Repository
    // Cf. base class TaskRepo

    public override add(task: Task): void {
        if (task.pos) this.visual(task.room).circle(task.pos.x, task.pos.y, { stroke: "#CC0000" });
        super.add(task);
    }

    // Persistency
    restore(): void {
        if (Memory.persistency?.hasOwnProperty(this.key))
            this.tasks = global.repair ?? []; //Memory.persistency.repair;

        this.tasks.forEach(t => {
            if (t.pos) { this.visual(t.room).circle(t.pos.x, t.pos.y, { stroke: "#00CC00" }); }
        })
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
        repair: Task[];
    }
}

profiler.registerClass(RepairTaskRepo, 'RepairTaskRepo');


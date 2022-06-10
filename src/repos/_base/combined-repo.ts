import { TaskRepo } from "./task-repo";
import { Task } from "repos/task";
import { Logger } from "logger";

export class CombinedRepo implements TaskRepo<Task> {

    constructor(
        protected leftRepo: TaskRepo<Task>,
        protected rightRepo: TaskRepo<Task>,
        protected offset: number,
        protected key: string,
        protected log: Logger
    ) { }

    getById(id: string): Task | undefined {
        return this.leftRepo.getById(id)
            ?? this.rightRepo.getById(id);
    }
    list(room?: string): Task[] {
        return this.leftRepo.list(room)
            .concat(this.rightRepo.list(room).map(i => { return { ...i, prio: i.prio + this.offset } }));
    }
    add(task: Task): void {
        throw new Error("Method not implemented.");
    }
    removeById(id: string): void {
        this.leftRepo.removeById(id);
        this.rightRepo.removeById(id);
    }
    remove(task: Task): void {
        this.leftRepo.remove(task);
        this.rightRepo.remove(task);
    }
    getForRequester(id: string): Task[] {
        return this.leftRepo.getForRequester(id)
            .concat(this.rightRepo.getForRequester(id));
    }
    closestTask(pos: RoomPosition, room?: string, blacklist?: string[], limitrange?: number): Task {
        const roomTasks = this.list(room);
        return _(roomTasks)
            .map(e => { return { task: e, range: pos.getRangeTo(e.pos?.x ?? 0, e.pos?.y ?? 0) }; })
            .filter(e => !e.task.executer
                && (!blacklist || !blacklist.includes(e.task.requester ?? ""))
                && (!limitrange || limitrange > e.range)
            ).sortByAll(i => i.task.prio, i => i.range)
            .map(i => i.task)
            .first();
    }
    trySplitTask(task: Task, amount: number, opt?: (task: Task) => Task): boolean {
        const foundLeft = this.leftRepo.getById(task.id);
        if (foundLeft) return this.leftRepo.trySplitTask(task, amount, opt);
        const foundRight = this.rightRepo.getById(task.id);
        if (foundRight) return this.rightRepo.trySplitTask(task, amount, opt);
        return false;
    }
    mergeEmpty(): void {
        this.leftRepo.mergeEmpty();
        this.rightRepo.mergeEmpty();
    }

}

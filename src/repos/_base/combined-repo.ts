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
        throw new Error(`Can't add on a combined repo: ${this.key}`);
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
        const repo = this.repoForTask(task);
        if (repo)
            return repo.trySplitTask(task, amount, opt);
        else
            return false;
    }
    mergeEmpty(): void {
        this.leftRepo.mergeEmpty();
        this.rightRepo.mergeEmpty();
    }
    registerTask(creep: Creep, task: Task, key: string): void {
        const repo = this.repoForTask(task);
        if (repo) { repo.registerTask(creep, task, key); }
    }
    finishTask(creep: Creep, task: Task, key: string): void {
        const repo = this.repoForTask(task);
        if (repo) { repo.finishTask(creep, task, key); }
    }
    unlinkTask(creep: Creep, key: string): void {
        // Only need one, not real task logic...
        this.leftRepo.unlinkTask(creep, key);
        this.rightRepo.unlinkTask(creep, key);
    }

    private repoForTask(task: Task): TaskRepo<Task> | undefined {
        const foundLeft = this.leftRepo.getById(task.id);
        if (foundLeft) return this.leftRepo;
        const foundRight = this.rightRepo.getById(task.id);
        if (foundRight) return this.rightRepo;
        return undefined;
    }

}

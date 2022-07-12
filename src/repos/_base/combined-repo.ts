import { TaskRepo } from "./task-repo";
import { Task } from "repos/task";
import { Logger } from "logger";

export class CombinedRepo implements TaskRepo<Task> {

    constructor(
        protected leftRepo: TaskRepo<Task>,
        protected rightRepo: TaskRepo<Task>,
        protected offset: number,
        public key: string,
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
    getForRequester(id: string, type?: ResourceConstant): Task[] {
        return this.leftRepo.getForRequester(id, type)
            .concat(this.rightRepo.getForRequester(id, type));
    }
    closestTask(pos: RoomPosition, type?: ResourceConstant, room?: string, blacklist?: string[], limitrange?: number): Task {
        const roomTasks = this.list(room);
        return _(roomTasks)
            .map(e => { return { task: e, range: pos.getRangeTo(e.pos?.x ?? 0, e.pos?.y ?? 0) }; })
            .filter(e => !e.task.executer
                && ((!type && (e.task.type == RESOURCE_ENERGY || !e.task.type)) || (type && e.task.type && e.task.type == type))
                && (!blacklist || !blacklist.includes(e.task.requester ?? ""))
                && (!limitrange || limitrange > e.range)
            ).sortByAll(i => i.task.prio, i => i.range)
            .map(i => i.task)
            .first();
    }
    trySplitTask(task: Task, amount: number, opt?: (task: Task) => Task): boolean {
        const repo = this.repoForTask(task);
        if (repo) {
            if (repo.key == this.rightRepo.key) {
                return repo.trySplitTask({ ...task, prio: task.prio - this.offset }, amount, opt);
            } else {
                return repo.trySplitTask(task, amount, opt);
            }
        }
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
    linkTask(executer: Id<_HasId>, task: Task): void {
        const repo = this.repoForTask(task);
        if (repo) { repo.linkTask(executer, task); }
    }
    unlinkTask(task: Task): void {
        const repo = this.repoForTask(task);
        if (repo) { repo.unlinkTask(task); }
    }
    finishTask(creep: Creep, task: Task, key: string): void {
        const repo = this.repoForTask(task);
        if (repo) {
            // will also unlink
            repo.finishTask(creep, task, key);
        } else {
            // ghost task
            this.unregisterTask(creep, key);
        }
    }
    unregisterTask(creep: Creep, key: string): void {
        this.log.debug(creep.room.name, `unlinking task on ${creep.name}: ${key}`);
        creep.memory.tasks[key] = undefined;
    }
    setAmount(id: string, amount:number):void {
        this.leftRepo.setAmount(id, amount);
        this.rightRepo.setAmount(id, amount);
    }

    private repoForTask(task: Task): TaskRepo<Task> | undefined {
        const foundLeft = this.leftRepo.getById(task.id);
        if (foundLeft) return this.leftRepo;
        const foundRight = this.rightRepo.getById(task.id);
        if (foundRight) return this.rightRepo;
        return undefined;
    }

}

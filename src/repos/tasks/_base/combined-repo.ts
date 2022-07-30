import { TaskRepo } from "./task-repo";
import { Task } from "repos/tasks/task";
import { Logger } from "logger";
import { repeat } from "lodash";

export class CombinedRepo implements TaskRepo<Task> {

    constructor(
        public key: string,
        protected log: Logger,
        private repos: { offset: number, repo: TaskRepo<Task> }[],
    ) { }

    getById(id: string): Task | undefined {
        for (const set of this.repos) {
            const task = set.repo.getById(id);
            if (task) return task;
        }
        return undefined;
    }

    list(room?: string): Task[] {
        return this.repos.reduce((acc, cur) =>
            acc.concat(
                cur.repo.list(room)
                    .map(i => { return { ...i, prio: i.prio + cur.offset } })
            ), [] as Task[]);
    }

    add(task: Task): void {
        throw new Error(`Can't add on a combined repo: ${this.key}`);
    }

    removeById(id: string): boolean {
        for (const set of this.repos) {
            const ret = set.repo.removeById(id);
            if (ret) return true;
        }
        return false;
    }

    remove(task: Task): boolean {
        for (const set of this.repos) {
            const ret = set.repo.remove(task);
            if (ret) return true;
        }
        return false;
    }

    getForRequester(id: string, type?: ResourceConstant): Task[] {
        return this.repos.reduce((acc, cur) =>
            acc.concat(
                cur.repo.getForRequester(id, type)
                    .map(i => { return { ...i, prio: i.prio + cur.offset } })
            ), [] as Task[]);
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

    trySplitTask(task: Task, amount: number, keepEmpty: boolean = false, opt?: (task: Task) => Task): boolean {
        const set = this.repoForTask(task);
        if (set) {
            return set.repo.trySplitTask({ ...task, prio: task.prio - set.offset }, amount, keepEmpty, opt);
        } else {
            return false;
        }
    }

    mergeEmpty(): void {
        for (const set of this.repos) {
            set.repo.mergeEmpty();
        }
    }

    registerTask(creep: Creep, task: Task, key: string): void {
        const set = this.repoForTask(task);
        if (set) { set.repo.registerTask(creep, task, key); }
        const bounded = creep.memory.tasks[key];
    }

    linkTask(executer: Id<_HasId>, task: Task): void {
        const set = this.repoForTask(task);
        if (set) { set.repo.linkTask(executer, task); }
    }

    unlinkTask(task: Task): void {
        const set = this.repoForTask(task);
        if (set) { set.repo.unlinkTask(task); }
    }

    finishTask(creep: Creep, task: Task, key: string): void {
        const set = this.repoForTask(task);
        if (set) {
            // will also unlink
            set.repo.finishTask(creep, task, key);
        } else {
            // ghost task
            this.unregisterTask(creep, key);
        }
    }

    unregisterTask(creep: Creep, key: string): void {
        this.log.debug(creep.room.name, `unlinking task on ${creep.name}: ${key}`);
        creep.memory.tasks[key] = undefined;
    }

    setAmount(id: string, amount: number): boolean {
        for (const set of this.repos) {
            const found = set.repo.setAmount(id, amount);
            if (found) return true;
        }
        return false;
    }

    private repoForTask(task: Task): { offset: number, repo: TaskRepo<Task> } | undefined {
        for (const set of this.repos) {
            const found = set.repo.getById(task.id);
            if (found) return set;
        }
        return undefined;
    }

}

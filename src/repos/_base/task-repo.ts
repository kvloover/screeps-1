import { Logger } from "logger";
import { isDefined } from "utils/utils";
import { Task } from "../task";

// import profiler from 'screeps-profiler';

// TODO split logic to have only clean repo logic
export interface TaskRepo<T extends Task> {
    getById(id: string): T | undefined;
    list(room?: string): T[];
    add(task: T): void;
    removeById(id: string): void;
    remove(task: T): void;
    getForRequester(id: string): T[];
    closestTask(pos: RoomPosition, room?: string, blacklist?: string[], limitrange?: number): Task;
    trySplitTask(task: Task, amount: number, opt?: (task: Task) => T): boolean;
    mergeEmpty(): void;
    registerTask(creep: Creep, task: Task, key: string): void;
    finishTask(creep: Creep, task: Task, key: string): void;
    unlinkTask(creep: Creep, key: string): void;
}

export abstract class BaseRepo<T extends Task> implements TaskRepo<T>{
    // getById(id: string): T | undefined;
    // list(): T[];
    // add(task: T): void;
    // removeById(id: string): void;
    // remove(task: T): void;

    constructor(protected key: string, protected log: Logger) { }

    protected tasks: T[] = [];

    public getById(id: string): T | undefined {
        return _.find(this.tasks, i => i.id === id);
    }

    public list(room?: string): T[] {
        // this.log.critical(`${this.key}: has ${this.tasks.length}`);
        if (!room)
            return this.tasks;
        else
            return _.filter(this.tasks, i => i.room === room);
    }

    public add(task: T): void {
        this.tasks.push(task);
    }

    public removeById(id: string): void {
        // this.log.critical(`removing ${id} on ${this.key}`)
        const task = this.tasks.find(i => i.id === id);
        if (task) {
            // this.log.critical(`remove: task found ${id}`);
            _.remove(this.tasks, task);
        }
    }

    public remove(task: T): void {
        this.removeById(task.id);
    }

    public getForRequester(id: string): T[] {
        return _.filter(this.tasks, i => i.requester === id);
    }

    public closestTask(pos: RoomPosition, room?: string, blacklist?: string[], limitrange?: number): Task {
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

    public trySplitTask(task: Task, amount: number, opt?: (task: Task) => T): boolean {
        if (task.amount && task.amount > amount) {
            const newTask = new Task(task.room, task.prio, task.amount - amount, task.requester, undefined, task.pos);
            this.add(opt ? opt(newTask) : newTask as T);
            task.amount = amount;
            return true;
        }
        return false;
    }

    public mergeEmpty(): void {
        const nonExecuters = this.tasks.filter(r => !r.executer);
        const requesters = _.unique(nonExecuters.map(i => i.requester));

        if (isDefined(requesters)) {
            // merge empty task on requester > harvest tasks are persistent
            requesters.forEach(req => {
                const requests = nonExecuters.filter(r => r.requester === req);
                if (requests.length > 1) {
                    // remove all, reduce all to one and re-add
                    this.tasks = _.difference(this.tasks, requests);
                    const record = requests.reduce((prev: T, curr: T) => {
                        if (prev.amount) prev.amount += curr.amount ?? 0;
                        return prev;
                    })
                    this.add(record);
                }
            })
        }

    }

    public registerTask(creep: Creep, task: Task, key: string): void {
        this.log.debug(creep.room, `registering task on ${creep.name}: ${key} - ${task.id}`);
        creep.memory.tasks[key] = { repo: key, task: task };
        task.executer = creep.id;
    }

    public finishTask(creep: Creep, task: Task, key: string): void {
        this.log.debug(creep.room, `finished task on ${creep.name}: ${key} - ${task.id}`);
        this.unlinkTask(creep, key);
        this.remove(task as T);
    }

    public unlinkTask(creep: Creep, key: string): void {
        this.log.debug(creep.room, `unlinking task on ${creep.name}: ${key}`);
        creep.memory.tasks[key] = undefined;
    }

}

// profiler.registerClass(TaskRepo, 'TaskRepo');

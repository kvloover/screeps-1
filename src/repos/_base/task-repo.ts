import { Logger } from "logger";
import { isDefined, parseRoomName, relativeExitTo } from "utils/utils";
import { Task } from "../task";

// import profiler from 'screeps-profiler';

// TODO split logic to have only clean repo logic
export interface TaskRepo<T extends Task> {

    key: string;

    getById(id: string): T | undefined;
    list(room?: string): T[];
    add(task: T): void;
    removeById(id: string): boolean;
    remove(task: T): boolean;
    getForRequester(id: string, type?: ResourceConstant): T[];
    closestTask(pos: RoomPosition, type?: ResourceConstant, room?: string, blacklist?: string[], limitrange?: number): Task;
    trySplitTask(task: Task, amount: number, keepEmpty?: boolean, opt?: (task: Task) => T): boolean;
    mergeEmpty(): void;
    linkTask(executer: Id<_HasId>, task: Task): void;
    unlinkTask(task: Task): void;
    registerTask(creep: Creep, task: Task, key: string): void;
    unregisterTask(creep: Creep, key: string): void;
    finishTask(creep: Creep, task: Task, key: string): void;
    setAmount(id: string, amount: number): boolean;
}

export abstract class BaseRepo<T extends Task> implements TaskRepo<T>{

    constructor(public key: string, protected log: Logger) { }

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

    public removeById(id: string): boolean {
        const task = this.tasks.find(i => i.id === id);
        if (task) {
            _.remove(this.tasks, task);
            return true;
        }
        return false;
    }

    public remove(task: T): boolean {
        return this.removeById(task.id);
    }

    public getForRequester(id: string, type?: ResourceConstant): T[] {
        return _.filter(this.tasks, i => i.requester === id && (!type || (i.type && i.type == type)));
    }

    public closestTask(pos: RoomPosition, type?: ResourceConstant, room?: string, blacklist?: string[], limitrange?: number): Task {
        const roomTasks = this.list(room);

        let loc = pos;
        if (room && room != pos.roomName) {
            // cross room getRange returns infinity > get estimation of exit and compare based on that
            const relExit = relativeExitTo(room, pos.roomName); // exit towards our current pos
            loc = new RoomPosition(25 + (relExit.xDir * 20), 25 + (relExit.yDir * 20), room);
        }

        return _(roomTasks)
            .map(e => { return { task: e, range: loc.getRangeTo(e.pos?.x ?? 0, e.pos?.y ?? 0) }; })
            .filter(e => !e.task.executer
                && (!type || (e.task.type && e.task.type == type))
                && (!blacklist || !blacklist.includes(e.task.requester ?? ""))
                && (!limitrange || limitrange > e.range)
            ).sortByAll(i => i.task.prio, i => i.range)
            .map(i => i.task)
            .first();
    }

    public trySplitTask(task: Task, amount: number, keepEmpty: boolean = false, opt?: (task: Task) => T): boolean {
        if (task.amount != undefined && (task.amount > amount || keepEmpty)) {
            const newTask = new Task(task.room, task.prio, Math.max(0, task.amount - amount), task.type, task.requester, undefined, task.pos);
            this.add(opt ? opt(newTask) : newTask as T);
            this.tasks.filter(i => i.id == task.id).forEach(i => i.amount = Math.min(task.amount || 0, amount));
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
                const types = _.unique(requests.map(i => i.type));
                const prios = _.unique(requests.map(i => i.prio));
                types.forEach(type => {
                    prios.forEach(prio => {
                        const typReq = requests.filter(r => r.type === type && r.prio == prio);
                        if (typReq.length > 1) {
                            // remove all, reduce all to one and re-add
                            this.tasks = _.difference(this.tasks, typReq);
                            const record = typReq.reduce((prev: T, curr: T) => {
                                if (prev.amount) prev.amount += curr.amount ?? 0;
                                return prev;
                            })
                            this.add(record);
                        }
                    });
                });
            })
        }

    }

    public registerTask(creep: Creep, task: Task, key: string): void {
        this.log.debug(creep.room.name, `registering task on ${creep.name}: ${key} - ${task.id}`);
        creep.memory.tasks[key] = { repo: this.key, key: key, tick: Game.time, task: task, amount: task.amount };
        this.linkTask(creep.id, task);
        // task.executer = creep.id;
    }

    public linkTask(executer: Id<_HasId>, task: Task): void {
        this.tasks.filter(i => i.id == task.id).forEach(i => i.executer = executer);
    }

    public unlinkTask(task: Task): void {
        this.tasks.filter(i => i.id == task.id).forEach(i => i.executer = undefined);
    }

    public finishTask(creep: Creep, task: Task, key: string): void {
        this.log.debug(creep.room.name, `finished task on ${creep.name}: ${key} - ${task.id}`);
        this.unregisterTask(creep, key);
        this.removeById(task.id);
    }

    public unregisterTask(creep: Creep, key: string): void {
        this.log.debug(creep.room.name, `unlinking task on ${creep.name}: ${key}`);
        creep.memory.tasks[key] = undefined;
    }

    public setAmount(id: string, amount: number): boolean {
        const filtered = this.tasks.filter(i => i.id == id);
        filtered.forEach(i => i.amount = amount);
        return filtered.length > 0;
    }

}

// profiler.registerClass(TaskRepo, 'TaskRepo');

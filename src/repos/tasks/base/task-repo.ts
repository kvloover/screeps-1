import { Logger } from "logger";
import { Task } from "../../../tasks/task";

export abstract class TaskRepo<T extends Task> {
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
    public list(): T[] {
        return this.tasks;
    }
    public add(task: T): void {
        this.tasks.push(task);
    }
    public removeById(id: string): void {
        _.remove(this.tasks, i => i.id === id);
    }
    public remove(task: T): void {
        console.log(`removing task ${task.id}`);
        this.removeById(task.id);
    }

    public closestTask(pos: RoomPosition): Task {
        // i.pos = serialized = functions stripped, use values directly
        return _(this.list()).filter(e => !e.executer)
            .sortByAll(i => i.prio, i => { if (i.pos) { return pos.getRangeTo(i.pos.x, i.pos.y); } return undefined; })
            .first();
    }

    public trySplitTask(task: Task, amount: number, opt?: (task: Task) => T): boolean {
        if (task.amount && task.amount > amount) {
            const newTask = new Task(task.prio, task.amount - amount, task.requester, undefined, task.pos);
            this.add(opt ? opt(newTask) : newTask as T);
            task.amount = amount;
            return true;
        }
        return false;
    }

}



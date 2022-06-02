import { Logger } from "logger";
import { Task } from "../task";

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

}



import { Task } from "./task";

export interface TaskRepo<T extends Task> {
    getById(id: string): T;
    list(): T[];
    add(task: T): void;
    remove(task: T): void;
}



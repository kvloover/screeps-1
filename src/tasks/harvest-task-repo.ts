import { Lifecycle, scoped } from "tsyringe";
import { Persistency, Persistent } from "./Persistent";
import { HarvestTask, Task } from "./task";
import { TaskRepo } from "./task-repo";

@scoped(Lifecycle.ContainerScoped)
export class HarvestTaskRepo implements TaskRepo<HarvestTask>, Persistent {

    private tasks: HarvestTask[] = [];

    constructor() { }

    restore(): void {
        if (Memory.persistency?.hasOwnProperty('harvest'))
            this.tasks = Memory.persistency.harvest;

        console.log(`Restored Tasks = ${this.tasks.length}`);
    }

    save(): void {
        Memory.persistency = Object.assign(Memory.persistency, { harvest: this.tasks ?? [] });
    }

    getById(id: string): HarvestTask {
        throw new Error("Method not implemented.");
    }
    list(): HarvestTask[] {
        console.log(`Tasks = ${this.tasks.length}`);
        return this.tasks;
    }
    add(task: HarvestTask): void {
        console.log(`Task pushed ${JSON.stringify(task)}`);
        this.tasks.push(task);
    }
    remove(task: HarvestTask): void {
        throw new Error("Method not implemented.");
    }

}

declare global {
    interface Persistency {
        harvest: HarvestTask[];
        dummy: Task[];
    }
}



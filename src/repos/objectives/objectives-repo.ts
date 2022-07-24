import { scoped, Lifecycle } from "tsyringe";

import { Persistent } from "repos/persistent"
import { Objective } from "./objective";

import profiler from "screeps-profiler";

@scoped(Lifecycle.ContainerScoped)
export class ObjectiveRepo implements Persistent {

    protected items: Objective[] = [];

    restore(): void {
        if (Memory.persistency?.hasOwnProperty('objectives'))
            this.items = Memory.persistency.objectives;
    }

    save(): void {
        Memory.persistency = Object.assign(Memory.persistency, { objectives: this.items ?? [] });
    }

    gc(): void {
        const invalid = this.items
            .filter(r => !Game.rooms.hasOwnProperty(r.master))
            .map(r => r.id);

        invalid.forEach(id => {
            this.removeById(id);
        })
    }

    clearReference(id: Id<_HasId>): void { }

    clearRoomRef(roomName: string): void {
        const invalid = this.items
            .filter(r => r.master === roomName)
            .map(r => r.id);

        invalid.forEach(id => {
            this.removeById(id);
        })
    }

    getById(id: string): Objective | undefined {
        return this.items.find(i => i.id === id);
    }
    list(room?: string): Objective[] {
        return this.items.filter(i => !room || i.master === room);
    }
    add(obj: Objective): void {
        this.items.push(obj);
    }
    removeById(id: string): boolean {
        const index = this.items.findIndex(i => i.id === id);
        if (index < 0) return false;
        this.items.splice(index, 1);
        return true;
    }

}

declare global {
    interface Persistency {
        objectives: Objective[];
    }
}

profiler.registerClass(ObjectiveRepo, 'ObjectiveRepo');

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { CreepUtils } from "creeps/creep-utils";
import { Task } from "repos/tasks/task";
import { TaskRepo } from "repos/tasks/_base/task-repo";

// TODO rework for tasks for build/repair

// @injectable()
export abstract class BuilderRole extends TransferRole implements Role {

    name: string = 'builder'
    prio = 5;
    phase = { start: 1, end: 9 };

    constructor(log: Logger, pathing: Pathing, private repo: TaskRepo<Task>) { super(log, pathing) }

    // Override consume on implementing class

    protected supply(creep: Creep): void {
        const key = 'supply';
        const task = this.findTask(creep, this.repo, key, RESOURCE_ENERGY, creep.memory.targetRoom);
        if (task) {
            if (task.prio > 100) {
                // only proceed to build/repair low prio if we have enough energy
                const energy = creep.room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) || 0
                    + (creep.room.terminal?.store.getUsedCapacity(RESOURCE_ENERGY) || 0);
                if (energy > 50000) {
                    this.supplyToRepo(creep, this.repo, key, RESOURCE_ENERGY, creep.memory.targetRoom);
                }
            } else {
                this.supplyToRepo(creep, this.repo, key, RESOURCE_ENERGY, creep.memory.targetRoom);
            }
        }
    }

}

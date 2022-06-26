import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { CreepUtils } from "creeps/creep-utils";
import { Task } from "repos/task";
import { TaskRepo } from "repos/_base/task-repo";

// TODO rework for tasks for build/repair

// @injectable()
export abstract class BuilderRole extends TransferRole implements Role {

    name: string = 'builder'
    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing, private repo: TaskRepo<Task>) { super(log, pathing) }

    // Override consume on implementing class

    protected supply(creep: Creep): void {
        this.supplyToRepo(creep, this.repo, 'supply', RESOURCE_ENERGY, creep.memory.targetRoom);
    }

}

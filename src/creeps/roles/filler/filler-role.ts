import { injectable } from "tsyringe";

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { TaskRepo } from "repos/tasks/_base/task-repo";
import { Task } from "repos/tasks/task";

/**
 * Get Energy from containers and store in buildings
 */
export abstract class FillerRole extends TransferRole implements Role {

    // TODO dropped and other resources

    name: string = 'filler'
    prio = 2;
    phase = { start: 2, end: 9 };

    constructor(log: Logger,
        pathing: Pathing,
        private providers: TaskRepo<Task>,
        private demands: TaskRepo<Task>
    ) { super(log, pathing); }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.providers, 'consume', RESOURCE_ENERGY);
    }

    protected supply(creep: Creep) {
        this.supplyToRepo(creep, this.demands, 'supply');
    }

}


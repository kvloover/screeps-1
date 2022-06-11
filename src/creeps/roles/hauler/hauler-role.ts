import { injectable } from "tsyringe";

import { Logger } from "logger";
import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";
import { isDefined } from "utils/utils";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";

/**
 * Get Energy from containers and store in buildings
 */
export abstract class HaulerRole extends TransferRole implements Role {

    name: string = 'hauler'
    phase = {
        start: 2,
        end: 9
    };

    constructor(log: Logger,
        pathing: Pathing,
        protected providers: TaskRepo<Task>,
        protected demands: TaskRepo<Task>
    ) { super(log, pathing); }


    protected supply(creep: Creep) {
        // will use found supply task
        this.supplyToRepo(creep, this.demands, 'supply');
    }

}


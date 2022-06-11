import { Logger } from "logger";
import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";
import { isDefined } from "utils/utils";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";
import { HarvestAction } from "./harvest-action";

/**
 * Get Energy from Sources and store in containers
 * FALLBACK to base harvesting and supplying (or dropping for simple hauler)
 */
export abstract class HarvesterRole extends TransferRole implements Role {

    name: string = 'harvester'
    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger,
        pathing: Pathing,
        protected demands: TaskRepo<Task>,
        protected harvesting: HarvestAction,
        private rangeLimit?: number
    ) { super(log, pathing) }

    protected consume(creep: Creep): void {
        this.harvesting.Action(creep);
    }

    protected supply(creep: Creep) {
        this.supplyToRepo(creep, this.demands, 'supply', undefined, this.rangeLimit);
    }

}

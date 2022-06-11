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

    // TODO dropped and other resources

    name: string = 'hauler'
    phase = {
        start: 2,
        end: 9
    };

    constructor(log: Logger,
        pathing: Pathing,
        private providers: TaskRepo<Task>,
        private demands: TaskRepo<Task>
    ) { super(log, pathing); }

    protected consume(creep: Creep): void {
        // will look for a new consume task
        this.consumeFromRepo(creep, this.providers, 'consume');
    }

    protected supply(creep: Creep) {
        // will use found supply task
        this.supplyToRepo(creep, this.demands, 'supply');
    }

    protected override findSupply(creep: Creep): boolean {
        // check if we can find anything to supply and register it on the creep for use
        const task = this.findAndRegisterTask(creep, this.demands, 'supply', creep.store.getUsedCapacity(RESOURCE_ENERGY));
        return isDefined(task);
    }

    protected override continueSupply(creep: Creep): boolean {
        const supplyTask = creep.memory.tasks['supply'];
        return isDefined(supplyTask);
    }

    protected override blacklistFor(creep: Creep, key: string): string[] | undefined {
        if (key === 'supply') return undefined;

        // Avoid consuming from the task we are supplying
        const supplyTask = creep.memory.tasks['supply'];
        if (supplyTask && supplyTask.task.requester) {
            this.log.debug(creep.room, `${creep.name}: blacklisting supply request`)
            return [supplyTask.task.requester]
        } else {
            return undefined;
        }
    }

}


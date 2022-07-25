import { Logger } from "logger";
import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";
import { isContainer, isDefined } from "utils/utils";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { TaskRepo } from "repos/tasks/_base/task-repo";
import { Task } from "repos/tasks/task";
import { HarvestAction } from "./harvest-action";
import { CREEP_AMOUNT_PER_ENERGY, CREEP_ENERGY_PER_PART, CREEP_RANGE } from "utils/constants";

/**
 * Get Energy from Sources and store in containers
 * FALLBACK to base harvesting and supplying (or dropping for simple hauler)
 */
export abstract class HarvesterRole extends TransferRole implements Role {

    name: string = 'harvester'
    prio = 1;
    phase = { start: 1, end: 9 };

    constructor(log: Logger,
        pathing: Pathing,
        protected demands: TaskRepo<Task>,
        protected buildTasks: TaskRepo<Task>,
        protected harvesting: HarvestAction,
        private rangeLimit?: number
    ) { super(log, pathing) }

    protected consume(creep: Creep): void {
        this.harvesting.Action(creep);
    }

    protected supply(creep: Creep) {
        const key = 'supply';
        const task = this.findTask(creep, this.demands, key, RESOURCE_ENERGY, undefined, this.rangeLimit);
        if (task) {
            this.supplyToRepo(creep, this.demands, 'supply', RESOURCE_ENERGY, undefined, this.rangeLimit);
        } else {
            // try to build containe if available
            const buildTask = this.findTask(creep, this.buildTasks, key, RESOURCE_ENERGY, undefined, 2);
            const repo = buildTask ? this.buildTasks : this.demands;
            this.supplyToRepo(creep, repo, key, RESOURCE_ENERGY, creep.room.name, this.rangeLimit);
        }
    }

    protected beforeSupplyTo(dest: _HasId | null, creep: Creep): boolean {
        // repair container before supplying
        if (isDefined(dest) && isContainer(dest)) {
            this.log.debug(creep.room.name, `${creep.name}: before supplying to container`);

            const capacity = creep.store.getCapacity(RESOURCE_ENERGY);
            const used = creep.store.getUsedCapacity(RESOURCE_ENERGY);
            if (used < 0.5 * capacity) { return true; }

            if (dest.hits < dest.hitsMax) {
                this.log.debug(creep.room.name, `${creep.name}: checking hits and range for container`);
                // only repair if creep can do full repair set
                const range = CREEP_RANGE.get('repair') || 1;
                const energyReq = creep.getActiveBodyparts(WORK) * (CREEP_ENERGY_PER_PART.get('repair') || 1);
                const repairedHits = energyReq * (CREEP_AMOUNT_PER_ENERGY.get('repair') || 1);

                if ((dest.hits <= dest.hitsMax - repairedHits)
                    && used >= energyReq
                    && creep.pos.getRangeTo(dest) <= range) {

                    this.log.debug(creep.room.name, `${creep.name}: repairing ${dest.structureType}`);
                    creep.repair(dest);

                    return false;
                }
            }
        }

        return true;
    }
}

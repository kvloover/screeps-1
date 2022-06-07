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
        protected harvests: TaskRepo<Task>,
        protected demands: TaskRepo<Task>,
    ) { super(log, pathing) }

    protected consume(creep: Creep): void {
        // target lock on task if task not set
        // targetId stays on source being harvested for creep

        const key = 'harvest';
        // if (!creep.memory.tasks.hasOwnProperty(key)) { this.unlinkTask(creep, key); }

        if (!creep.memory.tasks.hasOwnProperty(key) || !creep.memory.tasks[key]) {
            this.log.debug(creep.room, `${creep.name}: searching closest harvest task`);
            const task = this.harvests.closestTask(creep.pos, creep.room.name);
            if (task) {
                this.log.debug(creep.room, `${creep.name}: found new harvest task`);
                this.registerTask(creep, task, key);
                creep.memory.targetId = task.requester;
                // Mine 2 per tick per worker part
                if (this.harvests.trySplitTask(task, 2 * creep.getActiveBodyparts(WORK)))
                    this.log.debug(creep.room, `${creep.name}: task split to harvests for remaining work`);
            }
        }

        if (!creep.memory.targetId
            && creep.memory.tasks.hasOwnProperty(key)) {
            this.log.debug(creep.room, `${creep.name}: fixing targetId`);
            const taskId = creep.memory.tasks[key]?.id;
            if (isDefined(taskId)) {
                const task = this.harvests.getById(taskId);
                if (task) {
                    creep.memory.targetId = task.requester;
                } else {
                    this.unlinkTask(creep, key);
                }
            }
        }

        if (creep.memory.targetId) {
            this.log.debug(creep.room, `${creep.name}: locking on targetId`);
            const src = Game.getObjectById(creep.memory.targetId as Id<Source>);
            if (src) {
                if (!CreepUtils.tryFor([src], loc => creep.harvest(loc))) {
                    if (src.energy > 0)
                        this.pathing.moveTo(creep, src.pos);
                    else {
                        creep.memory.state = CreepState.supply;
                    }
                }
            }
        }
    }

    protected supply(creep: Creep) {
        const key = 'supply';
        this.supplyToRepo(creep, this.demands, key);
    }

}

// Only hold taskId ?
declare global {
    interface CreepMemory {
        tasks: { [key: string]: { repo: string; id: string; } | undefined }
    }
}

import { injectable } from "tsyringe";

import { Logger } from "logger";
import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";
import { isDefined } from "utils/utils";

import { Task } from "repos/task";
import { TaskRepo } from "repos/_base/task-repo";
import { HarvestTaskRepo } from "repos/harvest-task-repo";

@injectable()
export class HarvestAction {

    // TODO rework to unlink task for non main harvesters or allow more than budgeted on task

    constructor(private log: Logger,
        private pathing: Pathing,
        protected harvests: HarvestTaskRepo) { }

    public Action(creep: Creep, room?: string,) {

        const key = 'harvest';

        if (!creep.memory.tasks.hasOwnProperty(key) || !creep.memory.tasks[key]) {
            this.log.debug(creep.room, `${creep.name}: searching closest harvest task`); {
                const task = this.harvests.closestTask(creep.pos, room ?? creep.room.name);
                if (task) {
                    this.log.debug(creep.room, `${creep.name}: found new harvest task`);
                    this.harvests.registerTask(creep, task, key);
                    creep.memory.targetId = task.requester;
                    // Mine 2 per tick per worker part
                    if (this.harvests.trySplitTask(task, 2 * creep.getActiveBodyparts(WORK)))
                        this.log.debug(creep.room, `${creep.name}: task split to harvests for remaining work`);
                }
            }
        }

        if (!creep.memory.targetId
            && creep.memory.tasks.hasOwnProperty(key)) {
            this.log.debug(creep.room, `${creep.name}: fixing targetId`);
            const task = creep.memory.tasks[key]?.task;
            if (isDefined(task)) {
                // Only lock on in room
                creep.memory.targetId = task.requester;
            } else {
                this.harvests.unlinkTask(creep, key);
            }
        }

        if (creep.memory.targetId) {
            this.log.debug(creep.room, `${creep.name}: locking on targetId`);
            const src = Game.getObjectById(creep.memory.targetId as Id<Source>);
            if (src) {
                this.log.debug(creep.room, `${creep.name}: targetId locked`);
                const ret = creep.harvest(src);
                this.log.debug(creep.room, `${creep.name}: targetId returnd ${ret}`);
                if (ret === ERR_NOT_IN_RANGE) {
                    this.pathing.moveTo(creep, src.pos);
                }
            } else {
                this.log.debug(creep.room, `${creep.name}: targetId couldn't be locked`);
                creep.memory.targetId = undefined;
            }
        }
    }

}

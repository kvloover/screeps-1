import { singleton } from "tsyringe";

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";
import { isDefined } from "utils/utils";
import { HarvestTaskRepo } from "repos/harvest-task-repo";

@singleton()
export class HarvestAction {

    // TODO rework to unlink task for non main harvesters or allow more than budgeted on task

    constructor(private log: Logger,
        private pathing: Pathing,
        protected harvests: HarvestTaskRepo) { }

    public Action(creep: Creep, room?: string) {

        if (room && !Game.rooms.hasOwnProperty(room)) {
            this.pathing.scoutRoom(creep, room);
        } else {
            this.harvest(creep, room);
        }

    }

    private harvest(creep: Creep, room?: string) {

        const key = 'harvest';

        if (!creep.memory.tasks.hasOwnProperty(key) || !creep.memory.tasks[key]) {
            this.log.debug(creep.room, `${creep.name}: searching closest harvest task`); {
                const tasks = this.harvests.list(room ?? creep.room.name)
                    .filter(i => !i.executer)
                    .sort((a, b) => a.amount && b.amount
                        ? b.amount == a.amount && a.pos && b.pos
                            ? creep.pos.getRangeTo(a.pos) - creep.pos.getRangeTo(b.pos)
                            : b.amount - a.amount
                        : -1);
                const task = tasks.length > 0 ? tasks[0] : undefined;
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
                if (src.pos && !creep.pos.inRangeTo(src.pos, 1)) {
                    this.pathing.moveTo(creep, src.pos);
                } else {
                    creep.harvest(src)
                }
            } else {
                this.log.debug(creep.room, `${creep.name}: targetId couldn't be locked`);
                creep.memory.targetId = undefined;
            }
        }
    }

}

import { singleton } from "tsyringe";

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";
import { isDefined } from "utils/utils";
import { HarvestTaskRepo } from "repos/tasks/source/harvest-task-repo";

@singleton()
export class HarvestAction {

    // TODO rework to unlink task for non main harvesters or allow more than budgeted on task

    private key = 'harvest'

    constructor(private log: Logger,
        private pathing: Pathing,
        protected harvests: HarvestTaskRepo) { }

    public Action(creep: Creep, room?: string, id?: Id<Source>) {

        if (room && !Game.rooms.hasOwnProperty(room)) {
            if (creep.memory.tasks.hasOwnProperty(this.key)) {
                const task = creep.memory.tasks[this.key]?.task;
                if (isDefined(task) && task.pos) {
                    this.pathing.moveTo(creep, new RoomPosition(task.pos.x, task.pos.y, task.pos.roomName), undefined, 1);
                } else {
                    this.harvests.unregisterTask(creep, this.key);
                    this.pathing.scoutRoom(creep, room);
                }
            } else {
                this.pathing.scoutRoom(creep, room);
            }
        } else {
            this.harvest(creep, room, id);
        }

    }

    private harvest(creep: Creep, room?: string, id?: Id<Source>) {

        if (!creep.memory.tasks.hasOwnProperty(this.key) || !creep.memory.tasks[this.key]) {
            this.log.debug(creep.room.name, `${creep.name}: searching closest harvest task`); {
                const tasks = this.harvests.list(room ?? creep.room.name)
                    .filter(i => !i.executer && (!id || i.requester == id))
                    .sort((a, b) => a.amount && b.amount
                        ? b.amount == a.amount && a.pos && b.pos
                            ? creep.pos.getRangeTo(a.pos) - creep.pos.getRangeTo(b.pos)
                            : b.amount - a.amount
                        : -1);
                const task = tasks.length > 0 ? tasks[0] : undefined;
                if (task) {
                    this.log.debug(creep.room.name, `${creep.name}: found new harvest task`);
                    this.harvests.registerTask(creep, task, this.key);
                    creep.memory.targetId = task.requester;
                    // Mine 2 per tick per worker part
                    if (this.harvests.trySplitTask(task, 2 * creep.getActiveBodyparts(WORK)))
                        this.log.debug(creep.room.name, `${creep.name}: task split to harvests for remaining work`);
                }
            }
        }

        if (!creep.memory.targetId
            && creep.memory.tasks.hasOwnProperty(this.key)) {
            this.log.debug(creep.room.name, `${creep.name}: fixing targetId`);
            const task = creep.memory.tasks[this.key]?.task;
            if (isDefined(task)) {
                // Only lock on in room
                creep.memory.targetId = task.requester;
                creep.memory.target = task.pos;
            } else {
                this.harvests.unregisterTask(creep, this.key);
            }
        }

        if (creep.memory.targetId) {
            this.log.debug(creep.room.name, `${creep.name}: locking on targetId`);
            const src = Game.getObjectById(creep.memory.targetId as Id<Source>);
            if (src) {
                if (!creep.memory.target) { creep.memory.target = src.pos; }

                this.log.debug(creep.room.name, `${creep.name}: targetId locked`);
                if (src.pos && !creep.pos.inRangeTo(src.pos, 1)) {
                    this.pathing.moveTo(creep, src.pos, undefined, 1);
                } else {
                    creep.harvest(src)
                }

            } else {
                this.log.debug(creep.room.name, `${creep.name}: targetId couldn't be locked`);
                creep.memory.targetId = undefined;
                creep.memory.target = undefined;
            }
        }
    }

}

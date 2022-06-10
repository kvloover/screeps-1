import { Logger } from "logger";
import { Pathing } from "creeps/pathing";
import { CreepState } from 'utils/creep-state';

import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";
import { isStoreStructure, isTombStone, isRuin, isResource, isDefined } from "utils/utils";

export abstract class TransferRole {

    protected skipLast = true;

    constructor(protected log: Logger, protected pathing: Pathing) { }

    public run(creep: Creep): void {
        this.setState(creep);
        this.switchState(creep);
    }

    protected setState(creep: Creep): void {
        if (creep.store.getFreeCapacity() == 0
            || creep.memory.state == CreepState.idle)
            creep.memory.state = CreepState.supply;

        if (creep.memory.state == CreepState.supply
            && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.state = CreepState.consume;
        }
    }

    protected switchState(creep: Creep): void {
        if (creep.spawning) return;
        if (!creep.memory.tasks) { creep.memory.tasks = {}; }
        if (!creep.memory.tasks_blacklist) { creep.memory.tasks_blacklist = {}; }

        if (creep.memory.state == CreepState.consume) {
            this.log.debug(creep.room, `${creep.name}: running consume`);
            this.consume(creep);
        }
        if (creep.memory.state == CreepState.supply) {
            this.log.debug(creep.room, `${creep.name}: running supply`);
            this.supply(creep);
        }
        if (creep.memory.state != CreepState.supply
            && creep.memory.state != CreepState.consume) {
            this.supply(creep);
        }
    }

    protected abstract supply(creep: Creep): void;
    protected abstract consume(creep: Creep): void;
    protected misc(creep: Creep): void {
        this.log.debug(creep.room, `unknown state for ${creep.name} : ${creep.memory.state}`);
    }

    protected registerTask(creep: Creep, task: Task, key: string) {
        this.log.debug(creep.room, `registering task on ${creep.name}: ${key} - ${task.id}`);
        creep.memory.tasks[key] = { repo: key, task: task };
        task.executer = creep.id;
    }

    protected finishTask(creep: Creep, task: Task, repo: TaskRepo<Task>, key: string, succes: boolean) {
        this.log.debug(creep.room, `finished task on ${creep.name}: ${key} - ${task.id}`);
        this.unlinkTask(creep, key);
        repo.remove(task);
        if (succes) {
            // Avoid looping on same requester
            creep.memory.lastId = task.requester;
        } else {
            creep.memory.lastId = undefined;
        }
    }

    protected unlinkTask(creep: Creep, key: string) {
        this.log.debug(creep.room, `unlinking task on ${creep.name}: ${key}`);
        creep.memory.tasks[key] = undefined;
    }

    protected blacklist(creep: Creep, key: string): string[] | undefined {
        const blacklist = creep.memory.tasks_blacklist[key];
        if (!this.skipLast) return blacklist;

        const lastId = creep.memory.lastId;
        if (isDefined(lastId))
            return (blacklist ?? []).concat([lastId]);
        else
            return blacklist;
    }

    protected consumeFromRepo(creep: Creep, repo: TaskRepo<Task>, key: string, room?: string, rangeLimit?: number) {
        if (!creep.memory.tasks.hasOwnProperty(key) || !creep.memory.tasks[key]) {
            if (room && !Game.rooms.hasOwnProperty(room)) {
                this.scoutRoom(creep, room);
            } else {
                const task = repo.closestTask(creep.pos, room ?? creep.room.name, this.blacklist(creep, key), rangeLimit);
                if (task) {
                    this.registerTask(creep, task, key);
                    if (repo.trySplitTask(task, creep.store.getFreeCapacity(RESOURCE_ENERGY)))
                        this.log.debug(creep.room, `${creep.name}: ${key} task split for remaining amount`);
                }
            }
        }

        const memTask = creep.memory.tasks[key]?.task;
        if (memTask) {
            this.log.debug(creep.room, `${creep.name}: consuming for ${key} task ${memTask.id}`);
            // const task = repo.getById(memoryTaskId);
            // if (task) {
            // will be undefined for other repo
            const [succes, transferred] = this.tryConsumeForTask(creep, memTask);
            if (!succes) {
                this.finishTask(creep, memTask, repo, key, succes);
                console.log(`${creep.name}: could not consume for ${key} task: ${memTask.id}`);
            } else if (transferred) {
                this.finishTask(creep, memTask, repo, key, succes);
                this.log.debug(creep.room, `${creep.name}: consume ${key} task removed for ${memTask.id}`);
            }
            // } else {
            //     this.unlinkTask(creep, key);
            // }
        }
    }

    protected tryConsumeForTask(creep: Creep, task: Task): [succes: boolean, transferred: boolean] {
        const dest = Game.getObjectById(task.requester as Id<_HasId>)

        if (dest) {
            if (
                ((isStoreStructure(dest) || isTombStone(dest) || isRuin(dest))
                    && (dest.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) > 0
                    && creep.withdraw(dest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                || (isResource(dest)
                    && creep.pickup(dest) === ERR_NOT_IN_RANGE)
            ) {
                this.pathing.moveTo(creep, dest.pos);
                return [true, false]
            } else {
                // transferred or empty:
                return [true, true];
            }
        } else {
            // invalid location
            return [false, false];
        }
    }

    protected supplyToRepo(creep: Creep, repo: TaskRepo<Task>, key: string, room?: string, rangeLimit?: number) {
        if (!creep.memory.tasks[key]) {
            if (room && !Game.rooms.hasOwnProperty(room)) {
                this.scoutRoom(creep, room);
            } else {
                const task = repo.closestTask(creep.pos, room ?? creep.room.name, this.blacklist(creep, key), rangeLimit);
                if (task) {
                    this.registerTask(creep, task, key);
                    if (repo.trySplitTask(task, creep.store.getUsedCapacity(RESOURCE_ENERGY)))
                        this.log.debug(creep.room, `${creep.name}: ${key} task added to demands for remaining demand`);
                }
            }
        }

        const memTask = creep.memory.tasks[key]?.task;
        if (memTask) {
            this.log.debug(creep.room, `${creep.name}: supplying for ${key} task ${memTask.id}`);
            // const task = repo.getById(memoryTaskId);
            // if (task) {
            // will be undefined for other repo
            const [succes, transferred] = this.trySupplyForTask(creep, memTask);
            if (!succes) {
                this.finishTask(creep, memTask, repo, key, succes);
                console.log(`${creep.name}: could not supply for ${key} task: ${memTask.id}`);
            } else if (transferred) {
                this.finishTask(creep, memTask, repo, key, succes);
                this.log.debug(creep.room, `${creep.name}: supply ${key} task removed for ${memTask.id}`);
            }
            // } else {
            //     this.unlinkTask(creep, key);
            // }
        }
    }

    protected trySupplyForTask(creep: Creep, task: Task): [succes: boolean, transferred: boolean] {
        const dest = Game.getObjectById(task.requester as Id<_HasId>);

        if (dest &&
            (isStoreStructure(dest))
        ) {
            if ((dest.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) > 0 && creep.transfer(dest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.pathing.moveTo(creep, dest.pos);
                return [true, false]
            }
            // transferred or already full:
            return [true, true];
        }

        // invalid location
        return [false, false];
    }

    protected scoutRoom(creep: Creep, room: string) {
        if (creep.room.name !== room) {
            // move to room
            this.pathing.moveTo(creep, new RoomPosition(25, 25, room));
        }
    }

    protected gotoRoom(creep: Creep, pos: RoomPosition) {
        if (creep.room.name !== pos.roomName) {
            // move to room
            this.pathing.moveTo(creep, pos);
        }
    }

}

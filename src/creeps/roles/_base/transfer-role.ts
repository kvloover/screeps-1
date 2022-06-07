import { Logger } from "logger";
import { Pathing } from "creeps/pathing";
import { CreepState } from 'utils/creep-state';

import { TaskRepo } from "repos/tasks/_base/task-repo";
import { Task } from "tasks/task";
import { isStoreStructure, isTombStone, isRuin } from "utils/utils";

export abstract class TransferRole {

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
        creep.memory.tasks[key] = { repo: key, id: task.id };
        task.executer = creep.id;
    }

    protected finishTask(creep: Creep, task: Task, repo: TaskRepo<Task>, key: string) {
        this.log.debug(creep.room, `finished task on ${creep.name}: ${key} - ${task.id}`);
        this.unlinkTask(creep, key);
        repo.remove(task);
    }

    protected unlinkTask(creep: Creep, key: string) {
        this.log.debug(creep.room, `unlinking task on ${creep.name}: ${key}`);
        creep.memory.tasks[key] = undefined;
    }

    protected consumeFromRepo(creep: Creep, repo: TaskRepo<Task>, key: string) {
        if (!creep.memory.tasks.hasOwnProperty(key) || !creep.memory.tasks[key]) {
            const task = repo.closestTask(creep.pos, creep.room.name);
            if (task) {
                this.registerTask(creep, task, key);
                if (repo.trySplitTask(task, creep.store.getFreeCapacity(RESOURCE_ENERGY)))
                    this.log.debug(creep.room, `${creep.name}: ${key} task split for remaining amount`);
            }
        }

        const memoryTaskId = creep.memory.tasks[key]?.id;
        if (memoryTaskId) {
            this.log.debug(creep.room, `${creep.name}: consuming for ${key} task ${memoryTaskId}`);
            const task = repo.getById(memoryTaskId);
            if (task) {
                // will be undefined for other repo
                const [succes, transferred] = this.tryConsumeForTask(creep, task);
                if (!succes) {
                    this.finishTask(creep, task, repo, key);
                    console.log(`${creep.name}: could not consume for ${key} task: ${task.id}`);
                } else if (transferred) {
                    this.finishTask(creep, task, repo, key);
                    this.log.debug(creep.room, `${creep.name}: consume ${key} task removed for ${task.id}`);
                }
            } else {
                this.unlinkTask(creep, key);
            }
        }
    }

    protected supplyToRepo(creep: Creep, repo: TaskRepo<Task>, key: string) {
        if (!creep.memory.tasks[key]) {
            const task = repo.closestTask(creep.pos, creep.room.name);
            if (task) {
                this.registerTask(creep, task, key);
                if (repo.trySplitTask(task, creep.store.getUsedCapacity(RESOURCE_ENERGY)))
                    this.log.debug(creep.room, `${creep.name}: ${key} task added to demands for remaining demand`);
            }
        }

        const memoryTaskId = creep.memory.tasks[key]?.id;
        if (memoryTaskId) {
            this.log.debug(creep.room, `${creep.name}: supplying for ${key} task ${memoryTaskId}`);
            const task = repo.getById(memoryTaskId);
            if (task) {
                // will be undefined for other repo
                const [succes, transferred] = this.trySupplyForTask(creep, task);
                if (!succes) {
                    this.finishTask(creep, task, repo, key);
                    console.log(`${creep.name}: could not supply for ${key} task: ${task.id}`);
                } else if (transferred) {
                    this.finishTask(creep, task, repo, key);
                    this.log.debug(creep.room, `${creep.name}: supply ${key} task removed for ${task.id}`);
                }
            } else {
                this.unlinkTask(creep, key);
            }
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

    protected tryConsumeForTask(creep: Creep, task: Task): [succes: boolean, transferred: boolean] {
        const dest = Game.getObjectById(task.requester as Id<_HasId>)

        if (dest &&
            (isStoreStructure(dest) || isTombStone(dest) || isRuin(dest))
        ) {
            if ((dest.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) > 0 && creep.withdraw(dest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.pathing.moveTo(creep, dest.pos);
                return [true, false]
            } else {
                // transferred or empty:
                return [true, true];
            }
        } else {
            if (dest) {
                this.log.debug(creep.room, `could not fetch store object for ${dest.id}`)
            } else {
                this.log.debug(creep.room, `could not fetch dest object for ${task.requester}`)
            }
            // invalid location
            return [false, false];
        }
    }

}

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";
import { CreepState } from 'utils/creep-state';

import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";
import { isStoreStructure, isTombStone, isRuin, isResource, isDefined } from "utils/utils";

export abstract class TransferRole {

    constructor(protected log: Logger, protected pathing: Pathing) { }

    public run(creep: Creep): void {
        this.determineState(creep);
        this.runState(creep);
    }

    // TODO: avoid deadlock on supplying storage but nothing to consume from
    // => drop supply for storage and try to find a new supply task after not being able to find a consume task for x ticks

    protected determineState(creep: Creep): void {
        if (!this.continueSupply(creep)) {
            // No ongoing supply = go to idle unless we can find a new task
            this.setState(creep, CreepState.idle);
        }

        if (this.getState(creep) == CreepState.idle) {
            // Check for supply task
            if (this.findSupply(creep)) {
                this.setState(creep, CreepState.supply);
            }
        }

        if (this.getState(creep) == CreepState.supply && creep.store[RESOURCE_ENERGY] == 0) {
            this.setState(creep, CreepState.consume);
        }

        if (this.getState(creep) == CreepState.consume && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            this.setState(creep, CreepState.supply);
        }
    }

    protected runState(creep: Creep): void {
        if (creep.spawning) return;
        if (!creep.memory.tasks) { creep.memory.tasks = {}; }
        if (!creep.memory.tasks_blacklist) { creep.memory.tasks_blacklist = {}; }

        if (this.getState(creep) == CreepState.consume) {
            this.log.debug(creep.room, `${creep.name}: running consume`);
            this.consume(creep);
        }
        if (this.getState(creep) == CreepState.supply) {
            this.log.debug(creep.room, `${creep.name}: running supply`);
            this.supply(creep);
        }
        if (this.getState(creep) == CreepState.idle) {
            this.log.debug(creep.room, `${creep.name}: running idle`);
            this.idle(creep);
        }
    }

    protected setState(creep: Creep, state: CreepState): void {
        creep.memory.started = Game.time;
        creep.memory.state = state;
    }

    protected getState(creep: Creep): CreepState {
        return creep.memory.state;
    }

    /** look for a new supply */
    protected findSupply(creep: Creep): boolean {
        return true; // default without search
    }

    /** has an ongoing supply */
    protected continueSupply(creep: Creep): boolean {
        return true; // default continue switching between consume and supply
    }

    protected abstract supply(creep: Creep): void;
    protected abstract consume(creep: Creep): void;
    protected idle(creep: Creep): void { }

    protected blacklistFor(creep: Creep, key: string): string[] | undefined {
        return undefined;
    }

    private blacklist(creep: Creep, key: string): string[] | undefined {
        const blacklist = creep.memory.tasks_blacklist[key];

        const ignore = this.blacklistFor(creep, key);
        const retVal = isDefined(ignore)
            ? (blacklist ?? []).concat(ignore)
            : blacklist;

        this.log.debug(creep.room, `blacklist for ${creep.name} on ${key}: ${JSON.stringify(retVal)}`);

        return retVal;
    }

    protected findAndRegisterTask(creep: Creep, repo: TaskRepo<Task>, key: string, amount: number, room?: string, rangeLimit?: number): Task | undefined {
        const task = repo.closestTask(creep.pos, room ?? creep.room.name, this.blacklist(creep, key), rangeLimit);
        if (task) {
            repo.registerTask(creep, task, key);
            if (repo.trySplitTask(task, amount))
                this.log.debug(creep.room, `${creep.name}: ${key} task split for remaining amount`);
        }
        return task;
    }

    protected consumeFromRepo(creep: Creep, repo: TaskRepo<Task>, key: string, room?: string, rangeLimit?: number) {

        if (!creep.memory.tasks[key]) {
            if (room && !Game.rooms.hasOwnProperty(room)) {
                this.pathing.scoutRoom(creep, room);
            } else {
                this.findAndRegisterTask(creep, repo, key, creep.store.getFreeCapacity(RESOURCE_ENERGY), room, rangeLimit)
            }
        }

        const memTask = creep.memory.tasks[key]?.task;
        if (memTask) {
            this.log.debug(creep.room, `${creep.name}: consuming for ${key} task ${memTask.id}`);
            const [succes, transferred] = this.tryConsumeForTask(creep, memTask);
            if (!succes) {
                repo.finishTask(creep, memTask, key);
                console.log(`${creep.name}: could not consume for ${key} task: ${memTask.id}`);
            } else if (transferred) {
                repo.finishTask(creep, memTask, key);
                this.log.debug(creep.room, `${creep.name}: consume ${key} task removed for ${memTask.id}`);
            }
        }
    }

    protected tryConsumeForTask(creep: Creep, task: Task): [succes: boolean, transferred: boolean] {
        const dest = Game.getObjectById(task.requester as Id<_HasId>)

        if (dest) {
            let ret: number = -999;
            if (
                ((isStoreStructure(dest) || isTombStone(dest) || isRuin(dest))
                    && (dest.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) > 0
                    && (ret = creep.withdraw(dest, RESOURCE_ENERGY)) === ERR_NOT_IN_RANGE)
                || (isResource(dest)
                    && (ret = creep.pickup(dest)) === ERR_NOT_IN_RANGE)
            ) {
                this.log.debug(creep.room, `${creep.name}: consume returned ${ret}`);
                this.pathing.moveTo(creep, dest.pos);
                return [true, false]
            } else {
                // transferred or empty:
                this.log.debug(creep.room, `${creep.name}: consume returned ${ret}`);
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
                this.pathing.scoutRoom(creep, room);
            } else {
                this.findAndRegisterTask(creep, repo, key, creep.store.getUsedCapacity(RESOURCE_ENERGY), room, rangeLimit)
            }
        }

        const memTask = creep.memory.tasks[key]?.task;
        if (memTask) {
            this.log.debug(creep.room, `${creep.name}: supplying for ${key} task ${memTask.id}`);
            const [succes, transferred] = this.trySupplyForTask(creep, memTask);
            if (!succes) {
                repo.finishTask(creep, memTask, key);
                console.log(`${creep.name}: could not supply for ${key} task: ${memTask.id}`);
            } else if (transferred) {
                repo.finishTask(creep, memTask, key);
                this.log.debug(creep.room, `${creep.name}: supply ${key} task removed for ${memTask.id}`);
            }
        }
    }

    protected trySupplyForTask(creep: Creep, task: Task): [succes: boolean, transferred: boolean] {
        const dest = Game.getObjectById(task.requester as Id<_HasId>);

        if (dest &&
            (isStoreStructure(dest))
        ) {
            let ret: number = -999;
            if ((dest.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) > 0 && (ret = creep.transfer(dest, RESOURCE_ENERGY)) === ERR_NOT_IN_RANGE) {
                this.log.debug(creep.room, `${creep.name}: supply returned ${ret}`);
                this.pathing.moveTo(creep, dest.pos);
                return [true, false]
            }
            // transferred or already full:
            this.log.debug(creep.room, `${creep.name}: supply returned ${ret}`);
            return [true, true];
        }

        // invalid location
        return [false, false];
    }
}
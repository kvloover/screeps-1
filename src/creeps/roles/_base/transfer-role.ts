import { Logger } from "logger";
import { Pathing } from "creeps/pathing";
import { CreepState } from 'utils/creep-state';

import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";
import { isStoreStructure, isTombStone, isRuin, isResource, isDefined, isResourceConstant, isConstruction, isHasPos, isStructure } from "utils/utils";
import { CREEP_AMOUNT_PER_ENERGY, CREEP_ENERGY_PER_PART, CREEP_RANGE } from "utils/constants";

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

        if (this.getState(creep) == CreepState.supply
            && creep.store.getUsedCapacity(this.getStoreCheckType(creep)) == 0) {
            this.setState(creep, CreepState.consume);
        }

        if (this.getState(creep) == CreepState.consume
            && creep.store.getFreeCapacity(this.getStoreCheckType(creep)) == 0) {
            this.setState(creep, CreepState.supply);
        }
    }

    protected runState(creep: Creep): void {
        if (creep.spawning) return;
        if (!creep.memory.tasks) { creep.memory.tasks = {}; }
        if (!creep.memory.tasks_blacklist) { creep.memory.tasks_blacklist = {}; }

        if (this.getState(creep) == CreepState.consume) {
            this.log.debug(creep.room.name, `${creep.name}: running consume`);
            this.consume(creep);
        }
        if (this.getState(creep) == CreepState.supply) {
            this.log.debug(creep.room.name, `${creep.name}: running supply`);
            this.supply(creep);
        }
        if (this.getState(creep) == CreepState.idle) {
            this.log.debug(creep.room.name, `${creep.name}: running idle`);
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

    protected getStoreCheckType(creep: Creep): ResourceConstant | undefined {
        return RESOURCE_ENERGY;
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

        this.log.debug(creep.room.name, `blacklist for ${creep.name} on ${key}: ${JSON.stringify(retVal)}`);

        return retVal;
    }

    protected findTask(creep: Creep, repo: TaskRepo<Task>, key: string, type?: ResourceConstant, room?: string, rangeLimit?: number): Task {
        return repo.closestTask(creep.pos, type, room ?? creep.memory.room ?? creep.room.name, this.blacklist(creep, key), rangeLimit);
    }

    protected findAndRegisterTask(creep: Creep, repo: TaskRepo<Task>, key: string, capacity: number, type?: ResourceConstant, room?: string, rangeLimit?: number): Task | undefined {
        const task = this.findTask(creep, repo, key, type, room, rangeLimit);
        if (task) {
            repo.registerTask(creep, task, key);
            const creepTask = creep.memory.tasks[key];
            if (creepTask) {
                const maxAmount = this.amountPerEnergy(creepTask.repo) * capacity;
                if (creepTask.amount && maxAmount < creepTask.amount && repo.trySplitTask(task, maxAmount)) {
                    if (creepTask) { creepTask.amount = maxAmount; }
                    task.amount = maxAmount; // for return
                    this.log.debug(creep.room.name, `${creep.name}: ${key} task split for remaining amount on ${repo.key} : ${creepTask?.amount}`);
                }
            }

        } else {
            this.log.debug(creep.room.name, `${creep.name}: ${key} no task found on repo ${repo.key}`);
        }
        return task;
    }

    protected consumeFromRepo(creep: Creep, repo: TaskRepo<Task>, key: string, type?: ResourceConstant, room?: string, rangeLimit?: number) {

        if (!creep.memory.tasks[key]) {
            if (room && !Game.rooms.hasOwnProperty(room)) {
                this.pathing.scoutRoom(creep, room);
            } else {
                this.findAndRegisterTask(creep, repo, key, creep.store.getFreeCapacity(type), type, room, rangeLimit)
            }
        }

        const stored = creep.memory.tasks[key];
        const memTask = stored?.task;
        if (memTask) {
            this.log.debug(creep.room.name, `${creep.name}: consuming for ${key} task ${memTask.id}`);
            const dest = memTask.requester ? Game.getObjectById(memTask.requester) : null;

            const cont = this.beforeConsumeFrom(dest, creep);
            if (!cont) { return; }

            const res = this.tryConsumeForTask(dest, stored.repo, key, creep, memTask);
            if (res.error || (res.executed && this.completed(creep, stored, repo, res.amount, creep.store.getFreeCapacity(memTask.type), res.capacityPerTick))) {
                repo.finishTask(creep, memTask, key);
                this.log.debug(creep.room.name, `${creep.name}: consume ${key} task removed for ${memTask.id}`);
            }
        }
    }


    protected supplyToRepo(creep: Creep, repo: TaskRepo<Task>, key: string, type?: ResourceConstant, room?: string, rangeLimit?: number) {

        if (!creep.memory.tasks[key]) {
            if (room && !Game.rooms.hasOwnProperty(room)) {
                this.pathing.scoutRoom(creep, room);
            } else {
                this.findAndRegisterTask(creep, repo, key, creep.store.getUsedCapacity(type), type, room, rangeLimit)
            }
        }

        const stored = creep.memory.tasks[key];
        const memTask = stored?.task;
        if (memTask) {
            this.log.debug(creep.room.name, `${creep.name}: supplying for ${key} task ${memTask.id}`);
            const dest = memTask.requester ? Game.getObjectById(memTask.requester) : null;

            const cont = this.beforeSupplyTo(dest, creep);
            if (!cont) { return; }

            const res = this.trySupplyForTask(dest, stored.repo, key, creep, memTask);
            if (res.error || (res.executed && this.completed(creep, stored, repo, res.amount, creep.store.getUsedCapacity(memTask.type), res.capacityPerTick))) {
                repo.finishTask(creep, memTask, key);
                this.log.debug(creep.room.name, `${creep.name}: supply ${key} task removed for ${memTask.id}`);
            }
        }
    }

    protected beforeConsumeFrom(dest: _HasId | null, creep: Creep): boolean { return true; }

    protected beforeSupplyTo(dest: _HasId | null, creep: Creep): boolean { return true; }

    protected tryConsumeForTask(dest: _HasId | null, repo: string, key: string, creep: Creep, task: Task): TryTaskResult {
        if (dest) {
            const type = task.type ?? RESOURCE_ENERGY; // Only supply should be undefined type -> fetch from dest using store

            const pos = isHasPos(dest) ? dest.pos : task.pos;
            const range = this.rangeTo(repo);
            const amountPerEnergy = this.amountPerEnergy(repo);
            const transfering = this.energyPerTick(repo, key, creep, task, type) * amountPerEnergy;

            if (pos && !creep.pos.inRangeTo(pos, range)) {
                this.pathing.moveTo(creep, pos, undefined, range);
            }
            if (this.consumeAction(repo, creep, dest, type, transfering) === OK) {
                return { executed: true, error: false, type: type, amount: transfering, capacityPerTick: amountPerEnergy };
            }
        } else {
            // invalid location
            return { executed: false, error: true, type: undefined, amount: 0, capacityPerTick: 0 };
        }

        return { executed: false, error: false, type: undefined, amount: 0, capacityPerTick: 0 };
    }

    protected trySupplyForTask(dest: _HasId | null, repo: string, key: string, creep: Creep, task: Task): TryTaskResult {
        if (dest) {
            const types = [];
            if (!task.type) {
                // supply task can be generic deposit: no type provided
                Object.keys(creep.store).forEach(t => types.push(t));
            } else {
                types.push(task.type);
            }

            for (let type of types) {
                if (isResourceConstant(type)) {
                    const pos = isHasPos(dest) ? dest.pos : task.pos;
                    const range = this.rangeTo(repo);
                    const amountPerEnergy = this.amountPerEnergy(repo);
                    const transfering = this.energyPerTick(repo, key, creep, task, type) * amountPerEnergy;

                    if (pos && !creep.pos.inRangeTo(pos, range)) {
                        this.log.debug(creep.room.name, `${creep.name} not in range, moving`);
                        this.pathing.moveTo(creep, pos, undefined, range);
                    }
                    // todo if transfering multiple types and accepting multipe = transfer all at once
                    if (this.supplyAction(repo, creep, dest, type, transfering) === OK) {
                        return { executed: true, error: false, type: type, amount: transfering, capacityPerTick: amountPerEnergy };
                    } else {
                        this.log.debug(creep.room.name, `${creep.name} could not supply`);
                    }
                }
            }
        } else {
            return { executed: false, error: true, type: undefined, amount: 0, capacityPerTick: 0 };
        }

        // invalid location
        return { executed: false, error: false, type: undefined, amount: 0, capacityPerTick: 0 };
    }

    private completed(creep: Creep, creepTask: CreepTask, repo: TaskRepo<Task>, transferred: number, capacity: number, capacityPerTick: number): boolean {
        const taskOnCreep = creepTask.task;
        if (!taskOnCreep.amount) return true;

        if (taskOnCreep.amount <= transferred) {
            // finished fully
            this.log.debug(creep.room.name, `${creep.name} finished ${taskOnCreep.id} by transfering ${transferred}/${taskOnCreep.amount}`);
            return true;
        } else if (
            (capacityPerTick * capacity) <= transferred
            || (taskOnCreep.amount < capacityPerTick)) {
            // finished partially but at capacity
            this.log.debug(creep.room.name, `${creep.name} partially finished ${taskOnCreep.id} by transfering ${transferred}/${capacity}`);
            return true;
        } else {
            this.log.debug(creep.room.name, `${creep.name} progress ${taskOnCreep.id}: ${transferred}/${taskOnCreep.amount}`);
            const repoTask = repo.getById(taskOnCreep.id);
            if (repoTask && repoTask.amount) {
                repoTask.amount -= transferred;
                taskOnCreep.amount = repoTask?.amount; // to avoid link broken due to serialization
            }
            return false;
        }
    }

    private consumeAction(repoKey: string, creep: Creep, dest: _HasId, type: ResourceConstant, qty: number | undefined): ScreepsReturnCode {
        switch (repoKey) {
            default: return (isStoreStructure(dest) || isTombStone(dest) || isRuin(dest))
                && (dest.store.getUsedCapacity(type) ?? 0) > 0
                ? creep.withdraw(dest, type, qty)
                : isResource(dest)
                    ? creep.pickup(dest)
                    : ERR_INVALID_TARGET;
        }
    }

    // TODO move repoKey based logic outside, tied to repo or couple repo with an action and use these instead of repo directly

    private supplyAction(repoKey: string, creep: Creep, dest: _HasId, type: ResourceConstant, qty: number | undefined): ScreepsReturnCode {
        switch (repoKey) {
            case 'construction': return isConstruction(dest) && dest.my
                ? creep.build(dest) : ERR_INVALID_TARGET;
            case 'repair': return isStructure(dest)
                ? creep.repair(dest) : ERR_INVALID_TARGET;
            default: return isStoreStructure(dest) && (dest.store.getFreeCapacity(type) ?? 0) > 0
                ? creep.transfer(dest, type, qty && creep.store.getUsedCapacity(type) ? Math.min(creep.store.getUsedCapacity(type), qty, dest.store.getFreeCapacity(type) ?? 0) : undefined) : ERR_INVALID_TARGET;
        }
    }

    private rangeTo(repoKey: string): number {
        switch (repoKey) {
            case 'construction': return CREEP_RANGE.get('build') || 1;
            case 'repair': return CREEP_RANGE.get('repair') || 1;
            default: return 1;
        }
    }

    private amountPerEnergy(repoKey: string): number {
        switch (repoKey) {
            case 'construction': return CREEP_AMOUNT_PER_ENERGY.get('build') || 1
            case 'repair': return CREEP_AMOUNT_PER_ENERGY.get('repair') || 1
            default: return 1; // full amount - see amount per part
        }
    }

    private energyPerTick(repoKey: string, taskKey: string, creep: Creep, task: Task, type?: ResourceConstant): number {
        switch (repoKey) {
            case 'construction': return creep.getActiveBodyparts(WORK) * (CREEP_ENERGY_PER_PART.get('build') || 1);
            case 'repair': return creep.getActiveBodyparts(WORK) * (CREEP_ENERGY_PER_PART.get('repair') || 1);
            default: return taskKey === 'consume'
                ? task.amount ? Math.min(creep.store.getFreeCapacity(type), task.amount) : creep.store.getFreeCapacity(type) ?? 0
                : task.amount ? Math.min(creep.store.getUsedCapacity(type), task.amount) : creep.store.getUsedCapacity(type) ?? 0;
        }
    }

}

export interface TryTaskResult {
    executed: boolean;
    error: boolean;
    type?: ResourceConstant;
    amount: number;
    capacityPerTick: number;
}

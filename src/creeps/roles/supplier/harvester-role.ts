import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";

import { HarvestTaskRepo } from "repos/tasks/harvest-task-repo";
import { ContainerTransferTaskRepo } from "repos/tasks/container-transfer-task-repo";
import { TransferTaskRepo } from "repos/tasks/transfer-task-repo";
import { TaskRepo } from "repos/tasks/base/task-repo";
import { Task } from "tasks/task";
import { Logger } from "logger";
import { isDefined } from "utils/utils";
import { STAGE_CONTAINER_MINING } from "utils/constants";

@injectable()
/**
 * Get Energy from Sources and store in containers
 * FALLBACK to base harvesting and supplying (or dropping for simple hauler)
 */
export class HarvesterRole implements Role {

    name: string = 'harvester'

    constructor(private log: Logger,
        private pathing: Pathing,
        private harvests: HarvestTaskRepo,
        private containers: ContainerTransferTaskRepo,
        private demands: TransferTaskRepo,
    ) { }

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

        if (creep.memory.state != CreepState.idle
            && creep.memory.state != CreepState.supply) {
            this.work(creep);
        }
        if (creep.memory.state == CreepState.supply) {
            this.deposit(creep);
        }
    }

    protected work(creep: Creep): void {
        // target lock on task if task not set
        // targetId stays on source being harvested for creep

        const key = 'harvest';
        if (!creep.memory.tasks.hasOwnProperty(key)) { this.unlinkTask(creep, key); }

        if (!creep.memory.tasks.hasOwnProperty(key) || !creep.memory.tasks[key]) {
            const task = this.harvests.closestTask(creep.pos, creep.room.name);
            if (task) {
                this.registerTask(creep, task, key);
                creep.memory.targetId = task.requester;
                // Mine 2 per tick per worker part
                if (this.harvests.trySplitTask(task, 2 * creep.getActiveBodyparts(WORK)))
                    this.log.debug(creep.room, `${creep.name}: task split to harvests for remaining work`);
            }
        }

        if (!creep.memory.targetId
            && creep.memory.tasks.hasOwnProperty(key)) {
            const taskId = creep.memory.tasks[key];
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

    protected deposit(creep: Creep) {

        const key = 'supply';
        if (!creep.memory.tasks.hasOwnProperty(key)) { this.unlinkTask(creep, key); }

        if (!creep.room.memory.stage || creep.room.memory.stage < STAGE_CONTAINER_MINING)
            this.supplyToRepo(creep, this.demands, key);
        else
            this.supplyToRepo(creep, this.containers, key);

    }

    private registerTask(creep: Creep, task: Task, key: string) {
        creep.memory.tasks[key] = task.id;
        task.executer = creep.id;
    }

    private finishTask(creep: Creep, task: Task, repo: TaskRepo<Task>, key: string) {
        this.unlinkTask(creep, key);
        repo.remove(task);
    }

    private unlinkTask(creep: Creep, key: string) {
        creep.memory.tasks[key] = undefined;
    }

    private supplyToRepo(creep: Creep, repo: TaskRepo<Task>, key: string) {
        if (!creep.memory.tasks[key]) {
            const task = repo.closestTask(creep.pos, creep.room.name);
            if (task) {
                this.registerTask(creep, task, key);
                if (repo.trySplitTask(task, creep.store.getUsedCapacity(RESOURCE_ENERGY)))
                    this.log.debug(creep.room, `${creep.name}: task added to demands for remaining demand`);
            }
        }

        const memoryTaskId = creep.memory.tasks[key];
        if (memoryTaskId) {
            this.log.debug(creep.room, `${creep.name}: supplying for task ${memoryTaskId}`);
            const task = repo.getById(memoryTaskId);
            if (task) {
                // will be undefined for other repo
                const [succes, transferred] = this.trySupplyForTask(creep, task);
                if (!succes) {
                    this.finishTask(creep, task, repo, key);
                    console.log(`${creep.name}: could not supply for task: ${task.id}`);
                } else if (transferred) {
                    this.finishTask(creep, task, repo, key);
                    this.log.debug(creep.room, `${creep.name}: supply task removed for ${task.id}`);
                }
            } else {
                this.unlinkTask(creep, key);
            }
        }
    }

    private trySupplyForTask(creep: Creep, task: Task): [succes: boolean, transferred: boolean] {
        const dest = Game.getObjectById(task.requester as Id<AnyStoreStructure>);

        if (dest != null) {
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

}

// Only hold taskId ?
declare global {
    interface CreepMemory {
        tasks: { [key: string]: string | undefined }
    }
}

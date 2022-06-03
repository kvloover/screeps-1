import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";

import { HarvestTaskRepo } from "repos/tasks/harvest-task-repo";
import { ContainerTransferTaskRepo } from "repos/tasks/container-transfer-task-repo";
import { TransferTaskRepo } from "repos/tasks/transfer-task-repo";
import { HarvestTask, Task, TransferTask } from "tasks/task";
import { TaskRepo } from "repos/tasks/base/task-repo";
import { Logger } from "logger";

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
        if (!creep.memory.tasks) { creep.memory.tasks = {}; }
        if (!creep.memory.tasks.hasOwnProperty('harvest') || !creep.memory.tasks['harvest']) {
            const task = this.closestTask(creep, this.harvests.list());
            if (task) {
                this.registerTask(creep, task, 'harvest');
                // Mine 2 per tick per worker part
                if (this.trySplitTask(task, 2 * creep.getActiveBodyparts(WORK), this.harvests))
                    this.log.debug(creep.room, `${creep.name}: task split to harvests for remaining work`);
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

        if (!creep.memory.tasks) { creep.memory.tasks = {}; }
        if (!creep.memory.tasks.hasOwnProperty('supply')) { creep.memory.tasks['supply'] = undefined }

        this.supplyToRepo(creep, this.containers);
        this.supplyToRepo(creep, this.demands);

    }

    private registerTask(creep: Creep, task: Task, key: string) {
        task.executer = creep.id;
        creep.memory.targetId = task.requester;
        creep.memory.tasks[key] = task.id;
    }

    private finishTask(creep: Creep, task: Task, repo: TaskRepo<Task>, key: string){
        creep.memory.tasks[key] = undefined;
        repo.remove(task);
    }

    private closestTask(creep: Creep, list: Task[]): Task {
        return _(list).filter(e => !e.executer)
            .sortByAll(i => i.prio, i => { if (i.pos) { creep.pos.getRangeTo(i.pos); } })
            .first();
    }

    private trySplitTask<T extends Task>(task: Task, amount: number, repo: TaskRepo<Task>, opt?: (task: Task) => T): boolean {
        if (task.amount && task.amount > amount) {
            const newTask = new Task(task.prio, task.amount - amount, task.requester, undefined, task.pos);
            repo.add(opt ? opt(newTask) : newTask as T);
            task.amount = amount;
            return true;
        }
        return false;
    }

    private supplyToRepo(creep: Creep, repo: TaskRepo<Task>) {
        if (!creep.memory.tasks['supply']) {
            const task = _(repo.list()).filter(e => !e.executer).first();
            if (task) {
                this.registerTask(creep, task, 'supply');
                if (this.trySplitTask(task, creep.store.getUsedCapacity(RESOURCE_ENERGY), this.demands))
                    this.log.debug(creep.room, `${creep.name}: task added to demands for remaining demand`);
            }
        }

        const memoryTaskId = creep.memory.tasks['supply'];
        if (memoryTaskId) {
            const task = repo.getById(memoryTaskId);
            if (task) {
                // will be undefined for other repo
                const [succes, transferred] = this.trySupplyForTask(creep, task);
                if (!succes) {
                    this.finishTask(creep, task, repo, 'supply');
                    console.log(`${creep.name}: could not supply for task: ${task.id}`);
                } else if (transferred) {
                    this.finishTask(creep, task, repo, 'supply');
                    this.log.debug(creep.room, `${creep.name}: supply task removed for ${task.id}`);
                }
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

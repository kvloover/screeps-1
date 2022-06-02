import { injectable } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../../role";
import { SupplierRole } from "./supplier-role";

import { HarvestTaskRepo } from "repos/tasks/harvest-task-repo";
import { ContainerTransferTaskRepo } from "repos/tasks/container-transfer-task-repo";
import { TransferTaskRepo } from "repos/tasks/transfer-task-repo";
import { HarvestTask, Task, TransferTask } from "tasks/task";
import { TaskRepo } from "repos/tasks/base/task-repo";

@injectable()
/**
 * Get Energy from Sources and store in containers
 * TODO FALLBACK to base harvesting and supplying (or dropping for simple hauler)
 */
export class HarvesterRole implements Role {

    name: string = 'harvester'

    constructor(private pathing: Pathing,
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
            // TODO closest first
            const task = _(this.harvests.list()).filter(e => !e.executer).first();
            if (task) {
                creep.memory.targetId = task.requester;
                task.executer = creep.id;
                creep.memory.tasks['harvest'] = task;
                if (task.amount) {
                    // Mine 2 per tick per worker part
                    const workerAmount = 2 * creep.getActiveBodyparts(WORK);
                    if (task.amount > workerAmount) {
                        // Split task if not enough energy being mined
                        this.harvests.add(
                            new HarvestTask(task.prio,
                                task.amount - workerAmount,
                                task.requester,
                                undefined,
                                task.pos));
                        task.amount = workerAmount;
                    }

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

        if (!creep.memory.tasks) { creep.memory.tasks = {}; }
        if (!creep.memory.tasks.hasOwnProperty('supply')) { creep.memory.tasks['supply'] = undefined }

        this.supplyToRepo(creep, this.containers);
        this.supplyToRepo(creep, this.demands);

    }

    private supplyToRepo(creep: Creep, repo: TaskRepo<Task>) {
        if (!creep.memory.tasks['supply']) {
            const tasks = repo.list();
            const task = _(tasks).filter(e => !e.executer).first();
            if (task) {
                task.executer = creep.id;
                creep.memory.tasks['supply'] = task;
                if (task.amount && task.amount > creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
                    // Split task if not enough energy being carried : leave open for other to supply
                    this.demands.add(
                        new TransferTask(task.prio,
                            task.amount - creep.store.getUsedCapacity(RESOURCE_ENERGY),
                            task.requester,
                            undefined,
                            task.pos));
                }
            }
        }

        const memoryTask = creep.memory.tasks['supply'];
        if (memoryTask) {
            const task = repo.getById(memoryTask.id);
            if (task) {
                // will be undefined for other repo | rework to avoid unnecessary getById
                const [succes, transferred] = this.trySupplyForTask(creep, task);
                if (!succes) {
                    // Clear supply task for new one
                    task.executer = undefined;
                    creep.memory.tasks['supply'] = undefined;
                    console.log(`could not supply for task: ${task.id}`);
                } else if (transferred) {
                    repo.remove(task);
                    creep.memory.tasks['supply'] = undefined;
                }
            }
        }
    }

    private trySupplyForTask(creep: Creep, task: Task): [succes: boolean, transferred: boolean] {
        const dest = Game.getObjectById(task.requester as Id<AnyStoreStructure>);

        if (dest && (dest.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) > 0) {
            if (creep.transfer(dest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.pathing.moveTo(creep, dest.pos);
                return [true, false]
            }
            return [true, true];
        }

        // invalid location or no free capacity
        return [false, false];
    }

}

// Only hold taskId ?
declare global {
    interface CreepMemory {
        tasks: { [key: string]: Task | undefined }
    }
}

import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { HaulerRole } from "./hauler-role";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { SupplyTaskRepo } from "repos/supply-task-repo";
import profiler from "screeps-profiler";
import { StorageTaskRepo } from "repos/storage-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";
import { isDefined } from "utils/utils";
import { CreepState } from "utils/creep-state";


@singleton()
export class HaulerMidstreamRole extends HaulerRole {

    phase = {
        start: 1,
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, demands: DemandTaskRepo) {
        super(log, pathing, provider, demands)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler midstream`);
        super.run(creep);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.providers, 'consume');
    }

    protected supply(creep: Creep) {
        // will use found supply task
        this.supplyToRepo(creep, this.demands, 'supply');
    }

}

profiler.registerClass(HaulerMidstreamRole, 'HaulerMidstreamRole');

@singleton()
export class HaulerStorageRole extends HaulerRole {

    phase = {
        start: 3,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, private leftDemands: DemandTaskRepo, private rightDemands: StorageTaskRepo) {
        super(log, pathing, provider, new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler storage`);
        super.run(creep);
    }

    protected consume(creep: Creep): void {
        const supplyTask = creep.memory.tasks['supply'];
        if (!supplyTask || !supplyTask.task) {
            this.log.critical(`${creep.name}: consume exited premature`);
            return;
        }

        const type = supplyTask.task.type;
        // will look for a new consume task
        if (!creep.memory.tasks['consume']) {
            const task = this.findAndRegisterTask(creep, this.providers, 'consume', creep.store.getCapacity(type), type);
            if (!task) {
                const supply = creep.memory.tasks['supply'];
                if (supply && Game.time - supply.tick > 5) {
                    this.log.debug(creep.room, `${creep.name} - timeout supply task`)
                    // TODO rework persistency/task and pass through combined repo
                    this.leftDemands.unlinkTask(creep, 'supply');
                    this.leftDemands.clearReference(creep.id);
                    this.rightDemands.unlinkTask(creep, 'supply');
                    this.rightDemands.clearReference(creep.id);
                    this.setState(creep, CreepState.idle);
                    return;
                }
            }
        }

        this.consumeFromRepo(creep, this.providers, 'consume', type);
    }

    protected supply(creep: Creep) {
        // will use found supply task
        this.supplyToRepo(creep, this.demands, 'supply');
    }

    protected override findSupply(creep: Creep): boolean {
        this.log.debug(creep.room, `${creep.name}: searching for supply`);
        // check if we can find anything to supply and register it on the creep for use
        let task = this.findAndRegisterTask(creep, this.demands, 'supply', creep.store.getCapacity());
        if (!isDefined(task) && creep.room.memory.remote)
            task = this.findAndRegisterTask(creep, this.demands, 'supply', creep.store.getCapacity(), undefined, creep.room.memory.remote);
        return isDefined(task);
    }

    protected override getStoreCheckType(creep: Creep): ResourceConstant | undefined {
        const supplyTask = creep.memory.tasks['supply'];
        if (supplyTask && supplyTask.task)
            return supplyTask.task.type;
        else
            return undefined; // shouldn't happen in this flow
    }

    protected override continueSupply(creep: Creep): boolean {
        const supplyTask = creep.memory.tasks['supply'];
        this.log.debug(creep.room, `${creep.name}: continuing supply`)
        return isDefined(supplyTask);
    }

    protected override blacklistFor(creep: Creep, key: string): string[] | undefined {
        if (key === 'supply') return undefined;

        this.log.debug(creep.room, `${creep.name}: blacklist - checking supply task`)
        // Avoid consuming from the task we are supplying
        const supplyTask = creep.memory.tasks['supply'];
        if (supplyTask && supplyTask.task.requester) {
            this.log.debug(creep.room, `${creep.name}: blacklisting supply request`)
            return [supplyTask.task.requester]
        } else {
            return undefined;
        }
    }

}

profiler.registerClass(HaulerStorageRole, 'HaulerStorageRole');

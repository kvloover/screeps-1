import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { HaulerRole } from "./hauler-role";

import { SpawnDemandTaskRepo } from "repos/spawn/spawn-demand-task-repo";
import { StorageSupplyTaskRepo } from "repos/storage/storage-supply-task-repo";
import { ContainerDemandTempTaskRepo } from "repos/container/container-demand-temp-task-repo";
import { StorageDemandTaskRepo } from "repos/storage/storage-demand-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";
import { LinkDemandTaskRepo } from "repos/link/link-demand-task-repo";

import profiler from "screeps-profiler";

@singleton()
export class HaulerDropsRole extends HaulerRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        provider: StorageSupplyTaskRepo, containers: ContainerDemandTempTaskRepo, private leftDemands: SpawnDemandTaskRepo, private rightDemands: LinkDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo(provider, containers, 3, 'combined-supply', log),
            new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running hauler midstream`);
        super.run(creep);
    }

    protected override unlinkSupply(creep: Creep): void {
        this.leftDemands.unregisterTask(creep, 'supply');
        this.leftDemands.clearReference(creep.id);
        this.rightDemands.unregisterTask(creep, 'supply');
        this.rightDemands.clearReference(creep.id);
    }

}

@singleton()
export class HaulerMidstreamRole extends HaulerRole {

    phase = {
        start: 2,
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        provider: StorageSupplyTaskRepo, containers: ContainerDemandTempTaskRepo, demands: SpawnDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo(provider, containers, 3, 'combined-supply', log),
            demands)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running hauler midstream`);
        super.run(creep);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.providers, 'consume');
    }

    protected supply(creep: Creep) {
        this.supplyToRepo(creep, this.demands, 'supply');
    }

    protected override findSupply(creep: Creep): boolean {
        return true;
    }

    protected override continueSupply(creep: Creep): boolean {
        return true;
    }

    protected override unlinkSupply(creep: Creep): void { }

}

profiler.registerClass(HaulerMidstreamRole, 'HaulerMidstreamRole');


@singleton()
export class HaulerStorageRole extends HaulerRole {

    phase = {
        start: 3,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: StorageSupplyTaskRepo, containers: ContainerDemandTempTaskRepo, private leftDemands: SpawnDemandTaskRepo, private rightDemands: StorageDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo(provider, containers, 3, 'combined-supply', log),
            new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running hauler storage`);
        super.run(creep);
    }

    protected override unlinkSupply(creep: Creep): void {
        this.leftDemands.unregisterTask(creep, 'supply');
        this.leftDemands.clearReference(creep.id);
        this.rightDemands.unregisterTask(creep, 'supply');
        this.rightDemands.clearReference(creep.id);
    }

}

profiler.registerClass(HaulerStorageRole, 'HaulerStorageRole');

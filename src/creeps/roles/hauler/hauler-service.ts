import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { HaulerRole } from "./hauler-role";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { SupplyTaskRepo } from "repos/supply-task-repo";
import { StorageTaskRepo } from "repos/storage-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";
import { isDefined } from "utils/utils";
import { CreepState } from "utils/creep-state";
import { MidstreamTaskRepo } from "repos/midstream-task-repo";

import profiler from "screeps-profiler";

@singleton()
export class HaulerDropsRole extends HaulerRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, private leftDemands: DemandTaskRepo, private rightDemands: MidstreamTaskRepo) {
        super(log, pathing, provider, new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
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
        provider: SupplyTaskRepo, demands: DemandTaskRepo) {
        super(log, pathing, provider, demands)
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
        provider: SupplyTaskRepo, private leftDemands: DemandTaskRepo, private rightDemands: StorageTaskRepo) {
        super(log, pathing, provider, new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
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

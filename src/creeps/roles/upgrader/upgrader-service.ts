import { injectable } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { UpgraderRole } from "./upgrader-role";

import { SupplyTaskRepo } from "repos/supply-task-repo";
import profiler from "screeps-profiler";
import { HarvestAction } from "../harvester/harvest-action";

@injectable()
export class UpgraderSourceRole extends UpgraderRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        protected provider: SupplyTaskRepo, protected harvesting: HarvestAction) {
        super(log, pathing)
    }

    protected consume(creep: Creep): void {
        this.harvesting.Action(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running upgrader source`);
        super.run(creep);
    }
}

profiler.registerClass(UpgraderSourceRole, 'UpgraderSourceRole');

@injectable()
export class UpgraderStorageRole extends UpgraderRole {

    phase = {
        start: 2,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        protected provider: SupplyTaskRepo) {
        super(log, pathing)
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.provider, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running upgrader storage`);
        super.run(creep);
    }

}

profiler.registerClass(UpgraderStorageRole, 'UpgraderStorageRole');

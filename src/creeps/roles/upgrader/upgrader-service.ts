import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { UpgraderRole } from "./upgrader-role";

import { SupplyTaskRepo } from "repos/supply-task-repo";
import profiler from "screeps-profiler";
import { HarvestAction } from "../harvester/harvest-action";
import { UtilityTaskRepo } from "repos/utility-task-repo";
import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";
import { CombinedRepo } from "repos/_base/combined-repo";

@singleton()
export class UpgraderSourceRole extends UpgraderRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        protected harvesting: HarvestAction) {
        super(log, pathing)
    }

    protected consume(creep: Creep): void {
        this.harvesting.Action(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running upgrader source`);
        super.run(creep);
    }
}

profiler.registerClass(UpgraderSourceRole, 'UpgraderSourceRole');

@singleton()
export class UpgraderStorageRole extends UpgraderRole {

    private combined: TaskRepo<Task>;

    phase = {
        start: 2,
        end: 4
    };

    constructor(log: Logger, pathing: Pathing,
        supply: SupplyTaskRepo, utility: UtilityTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo(utility, supply, 10, 'combined-utility', log);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.combined, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running upgrader storage`);
        super.run(creep);
    }

}

profiler.registerClass(UpgraderStorageRole, 'UpgraderStorageRole');

@singleton()
export class UpgraderSupplyRole extends UpgraderRole {

    private combined: TaskRepo<Task>;

    phase = {
        start: 5,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: SupplyTaskRepo, utility: UtilityTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo(utility, supply, 10, 'combined-utility', log);
    }

    protected consume(creep: Creep): void {
        // Force to stick around controller
        const range = creep.room.controller ? Math.min(10, 2 * creep.pos.getRangeTo(creep.room.controller)) : 15;
        this.consumeFromRepo(creep, this.combined, 'consume', RESOURCE_ENERGY, undefined, range);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running upgrader storage`);
        super.run(creep);
    }

}

profiler.registerClass(UpgraderSupplyRole, 'UpgraderSupplyRole');

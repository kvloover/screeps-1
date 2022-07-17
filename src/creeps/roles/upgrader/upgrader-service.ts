import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { UpgraderRole } from "./upgrader-role";

import { StorageSupplyTaskRepo } from "repos/storage/storage-supply-task-repo";
import profiler from "screeps-profiler";
import { HarvestAction } from "../harvester/harvest-action";
import { LinkSupplyUtilityTaskRepo } from "repos/link/link-supply-utility-task-repo";
import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";
import { CombinedRepo } from "repos/_base/combined-repo";
import { ContainerSupplyTaskRepo } from "repos/container/container-supply-task-repo";
import { ContainerDemandTempTaskRepo } from "repos/container/container-demand-temp-task-repo";

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
export class UpgraderContainerRole extends UpgraderRole {

    private combined: TaskRepo<Task>;

    phase = {
        start: 2,
        end: 3
    };

    constructor(log: Logger, pathing: Pathing,
        supply: ContainerDemandTempTaskRepo, containers: ContainerSupplyTaskRepo, utility: LinkSupplyUtilityTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo('combined-utility', log, [
            { offset: 0, repo: utility },
            { offset: 10, repo: containers },
            { offset: 20, repo: supply }
        ]);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.combined, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running upgrader container`);
        super.run(creep);
    }

}

profiler.registerClass(UpgraderContainerRole, 'UpgraderContainerRole');

@singleton()
export class UpgraderStorageRole extends UpgraderRole {

    private combined: TaskRepo<Task>;

    phase = {
        start: 4,
        end: 4
    };

    constructor(log: Logger, pathing: Pathing,
        supply: StorageSupplyTaskRepo, containers: ContainerSupplyTaskRepo, utility: LinkSupplyUtilityTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo('combined-utility', log, [
            { offset: 0, repo: utility },
            { offset: 10, repo: containers },
            { offset: 20, repo: supply }
        ]);
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
        supply: StorageSupplyTaskRepo, containers: ContainerSupplyTaskRepo, utility: LinkSupplyUtilityTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo('combined-utility', log, [
            { offset: 0, repo: utility },
            { offset: 10, repo: containers },
            { offset: 20, repo: supply }
        ]);
    }

    protected consume(creep: Creep): void {
        // Force to stick around controller
        const range = creep.room.controller ? Math.min(15, 2 * creep.pos.getRangeTo(creep.room.controller)) : 15;
        this.consumeFromRepo(creep, this.combined, 'consume', RESOURCE_ENERGY, undefined, range);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running upgrader storage`);
        super.run(creep);
    }

}

profiler.registerClass(UpgraderSupplyRole, 'UpgraderSupplyRole');

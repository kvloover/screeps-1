import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { UpgraderRole } from "./upgrader-role";

import { HarvestAction } from "../harvester/harvest-action";
import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";
import { StorageSupplyTaskRepo } from "repos/storage/storage-supply-task-repo";
import { LinkSupplyUtilityTaskRepo } from "repos/link/link-supply-utility-task-repo";
import { ContainerSupplyTaskRepo } from "repos/container/container-supply-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";

import profiler from "screeps-profiler";

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

    phase = {
        start: 2, // container
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        private containers: ContainerSupplyTaskRepo) {
        super(log, pathing);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.containers, 'consume', RESOURCE_ENERGY);
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
        start: 3, // storage
        end: 3
    };

    constructor(log: Logger, pathing: Pathing,
        supply: StorageSupplyTaskRepo,
        containers: ContainerSupplyTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo('combined-utility', log, [
            { offset: 0, repo: containers },
            { offset: 0, repo: supply }
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
        start: 4, // links
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: StorageSupplyTaskRepo,
        containers: ContainerSupplyTaskRepo,
        utility: LinkSupplyUtilityTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo('combined-utility', log, [
            { offset: 0, repo: utility },
            { offset: 10, repo: containers },
            { offset: 10, repo: supply }
        ]);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.combined, 'consume', RESOURCE_ENERGY, undefined);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running upgrader storage`);
        super.run(creep);
    }

}

profiler.registerClass(UpgraderSupplyRole, 'UpgraderSupplyRole');

import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { UpgraderRole } from "./upgrader-role";

import { HarvestAction } from "../harvester/harvest-action";
import { TaskRepo } from "repos/tasks/_base/task-repo";
import { Task } from "repos/tasks/task";
import { StorageSupplyTaskRepo } from "repos/tasks/storage/storage-supply-task-repo";
import { LinkSupplyUtilityTaskRepo } from "repos/tasks/link/link-supply-utility-task-repo";
import { ContainerSupplyTaskRepo } from "repos/tasks/container/container-supply-task-repo";
import { CombinedRepo } from "repos/tasks/_base/combined-repo";

import profiler from "screeps-profiler";
import { CreepDemandTaskRepo } from "repos/tasks/creep/creep-demand-task-repo";

@singleton()
export class UpgraderSourceRole extends UpgraderRole {

    phase = {
        start: 9,
        end: 9
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
        start: 9,
        end: 9 // 2 container
    };

    constructor(log: Logger, pathing: Pathing,
        private containers: ContainerSupplyTaskRepo,
        private creepDemand: CreepDemandTaskRepo) {
        super(log, pathing);
    }

    protected consume(creep: Creep): void {
        if (creep.room.controller && !creep.pos.inRangeTo(creep.room.controller.pos, 3)) {
            this.log.debug(creep.room.name, `${creep.name} not in range, moving`);
            this.pathing.moveTo(creep, creep.room.controller.pos, undefined, 3);
        } else {
            const task = this.findTask(creep, this.containers, 'consume', RESOURCE_ENERGY, undefined, 5)
            if (task) {
                this.consumeFromRepo(creep, this.containers, 'consume', RESOURCE_ENERGY, undefined, 5)
            } else {
                // request creep supply
                this.creepDemand.add(new Task(creep.room.name,
                    1,
                    creep.store.getFreeCapacity(RESOURCE_ENERGY),
                    RESOURCE_ENERGY,
                    creep.id,
                    undefined,
                    creep.pos));
            }
        }
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
        start: 9, // storage
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: StorageSupplyTaskRepo,
        containers: ContainerSupplyTaskRepo,
        private creepDemand: CreepDemandTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo('combined-utility', log, [
            { offset: 0, repo: containers },
            { offset: 0, repo: supply }
        ]);
    }

    protected consume(creep: Creep): void {
        if (creep.room.controller && !creep.pos.inRangeTo(creep.room.controller.pos, 3)) {
            this.log.debug(creep.room.name, `${creep.name} not in range, moving`);
            this.pathing.moveTo(creep, creep.room.controller.pos, undefined, 3);
        } else {
            const task = this.findTask(creep, this.combined, 'consume', RESOURCE_ENERGY, undefined, 5)
            if (task) {
                this.consumeFromRepo(creep, this.combined, 'consume', RESOURCE_ENERGY, undefined, 5)
            } else {
                // request creep supply
                this.creepDemand.add(new Task(creep.room.name,
                    1,
                    creep.store.getFreeCapacity(RESOURCE_ENERGY),
                    RESOURCE_ENERGY,
                    creep.id,
                    undefined,
                    creep.pos));
            }
        }
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
        start: 1, // links
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: StorageSupplyTaskRepo,
        containers: ContainerSupplyTaskRepo,
        utility: LinkSupplyUtilityTaskRepo,
        private creepDemand: CreepDemandTaskRepo) {
        super(log, pathing)
        this.combined = new CombinedRepo('combined-utility', log, [
            { offset: 0, repo: utility },
            { offset: 10, repo: containers },
            { offset: 10, repo: supply }
        ]);
    }

    protected consume(creep: Creep): void {
        if (creep.room.controller && !creep.pos.inRangeTo(creep.room.controller.pos, 3)) {
            this.log.debug(creep.room.name, `${creep.name} not in range, moving`);
            this.pathing.moveTo(creep, creep.room.controller.pos, undefined, 3);
        } else {
            const task = this.findTask(creep, this.combined, 'consume', RESOURCE_ENERGY, undefined, 5)
            if (task) {
                this.consumeFromRepo(creep, this.combined, 'consume', RESOURCE_ENERGY, undefined, 5)
            } else {
                // request creep supply - stationary
                this.creepDemand.add(new Task(creep.room.name,
                    1,
                    creep.store.getFreeCapacity(RESOURCE_ENERGY),
                    RESOURCE_ENERGY,
                    creep.id,
                    undefined,
                    creep.pos));
            }
        }
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running upgrader storage`);
        super.run(creep);
    }

}

profiler.registerClass(UpgraderSupplyRole, 'UpgraderSupplyRole');

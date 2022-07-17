import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { CreepState } from "utils/creep-state";
import { HarvestAction } from "../harvester/harvest-action";
import { BuilderRole } from "./builder-role";

import { StorageSupplyTaskRepo } from "repos/storage/storage-supply-task-repo";
import { RepairTaskRepo } from "repos/structures/repair-task-repo";
import { ConstructionTaskRepo } from "repos/structures/construction-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";

import profiler from "screeps-profiler";
import { ContainerSupplyTaskRepo } from "repos/container/container-supply-task-repo";
import { RemoteBuilderStorageRole } from "./remote-builder-service";

@singleton()
export class BuilderSourceRole extends BuilderRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        protected harvesting: HarvestAction,
        protected prioBuild: RepairTaskRepo, protected midBuild: ConstructionTaskRepo) {
        super(log, pathing, new CombinedRepo('combined', log, [{ offset: 0, repo: prioBuild }, { offset: 15, repo: midBuild }]));
    }

    protected consume(creep: Creep): void {
        this.log.debug(creep.room.name, `${creep.name} harvesting`);
        this.harvesting.Action(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running builder source`);
        super.run(creep);
    }

    protected override setState(creep: Creep, state: CreepState): void {
        super.setState(creep, state);
        creep.memory.targetId = undefined; // used by both harvesting and building
    }
}

profiler.registerClass(BuilderSourceRole, 'BuilderSourceRole');

@singleton()
export class BuilderContainerRole extends BuilderRole {

    phase = {
        start: 2,
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        protected provider: ContainerSupplyTaskRepo,
        protected prioBuild: RepairTaskRepo, protected midBuild: ConstructionTaskRepo) {
        super(log, pathing, new CombinedRepo('combined', log, [{ offset: 0, repo: prioBuild }, { offset: 15, repo: midBuild }]))
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.provider, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(BuilderContainerRole, 'BuilderContainerRole');

@singleton()
export class BuilderStorageRole extends BuilderRole {

    phase = {
        start: 3,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        protected provider: StorageSupplyTaskRepo,
        protected prioBuild: RepairTaskRepo, protected midBuild: ConstructionTaskRepo) {
        super(log, pathing, new CombinedRepo('combined', log, [{ offset: 0, repo: prioBuild }, { offset: 15, repo: midBuild }]))
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.provider, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(BuilderStorageRole, 'BuilderStorageRole');

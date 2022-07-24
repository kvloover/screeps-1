import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { CreepState } from "utils/creep-state";
import { HarvestAction } from "../harvester/harvest-action";
import { BuilderRole } from "./builder-role";

import { StorageSupplyTaskRepo } from "repos/tasks/storage/storage-supply-task-repo";
import { RepairTaskRepo } from "repos/tasks/structures/repair-task-repo";
import { ConstructionTaskRepo } from "repos/tasks/structures/construction-task-repo";
import { CombinedRepo } from "repos/tasks/_base/combined-repo";
import { ContainerSupplyTaskRepo } from "repos/tasks/container/container-supply-task-repo";

import profiler from "screeps-profiler";

@singleton()
export class BuilderSourceRole extends BuilderRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        protected harvesting: HarvestAction,
        repairs: RepairTaskRepo,
        constructions: ConstructionTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined', log, [
                { offset: 0, repo: repairs },
                { offset: 30, repo: constructions }
            ]));
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

    protected combinedRepo: CombinedRepo;

    phase = {
        start: 2,
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        containers: ContainerSupplyTaskRepo,
        storage: StorageSupplyTaskRepo,
        repairs: RepairTaskRepo,
        constructions: ConstructionTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined', log, [
                { offset: 0, repo: repairs },
                { offset: 30, repo: constructions }
            ]));

        this.combinedRepo = new CombinedRepo('combined-supply', log, [
            { offset: 0, repo: containers },
            { offset: 10, repo: storage },
        ]);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.combinedRepo, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(BuilderContainerRole, 'BuilderContainerRole');

@singleton()
export class BuilderStorageRole extends BuilderRole {

    protected combinedSupply: CombinedRepo;

    phase = {
        start: 3,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        containers: ContainerSupplyTaskRepo,
        storage: StorageSupplyTaskRepo,
        repairs: RepairTaskRepo,
        constructions: ConstructionTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined', log, [
                { offset: 0, repo: repairs },
                { offset: 30, repo: constructions }
            ]));

        this.combinedSupply = new CombinedRepo('combined-supply', log, [
            { offset: 0, repo: storage },
            { offset: 10, repo: containers }
        ])
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.combinedSupply, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(BuilderStorageRole, 'BuilderStorageRole');

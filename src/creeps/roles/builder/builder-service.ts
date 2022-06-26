import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { CreepState } from "utils/creep-state";
import { HarvestAction } from "../harvester/harvest-action";
import { BuilderRole } from "./builder-role";

import { SupplyTaskRepo } from "repos/supply-task-repo";
import { RepairTaskRepo } from "repos/repair-task-repo";
import { ConstructionTaskRepo } from "repos/construction-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";

import profiler from "screeps-profiler";

@singleton()
export class BuilderSourceRole extends BuilderRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        protected harvesting: HarvestAction,
        protected prioBuild: RepairTaskRepo, protected midBuild: ConstructionTaskRepo) {
        // construction: 1-20
        // repair: emergency: 1, normal : 50, filler: 80
        super(log, pathing, new CombinedRepo(prioBuild, midBuild, 10, 'combined', log));
    }

    protected consume(creep: Creep): void {
        this.log.debug(creep.room, `${creep.name} harvesting`);
        this.harvesting.Action(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running builder source`);
        super.run(creep);
    }

    protected override setState(creep: Creep, state: CreepState): void {
        super.setState(creep, state);
        creep.memory.targetId = undefined; // used by both harvesting and building
    }
}

profiler.registerClass(BuilderSourceRole, 'BuilderSourceRole');

@singleton()
export class BuilderStorageRole extends BuilderRole {

    phase = {
        start: 2,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        protected provider: SupplyTaskRepo,
        protected prioBuild: RepairTaskRepo, protected midBuild: ConstructionTaskRepo) {
        super(log, pathing, new CombinedRepo(prioBuild, midBuild, 15, 'combined', log))
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.provider, 'consume', RESOURCE_ENERGY);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(BuilderStorageRole, 'BuilderStorageRole');

@singleton()
export class RemoteBuilderSourceRole extends BuilderSourceRole {

    name: string = 'remote-builder'

    constructor(log: Logger, pathing: Pathing,
        harvesting: HarvestAction,
        prioBuild: RepairTaskRepo, midBuild: ConstructionTaskRepo) {
        super(log, pathing, harvesting, prioBuild, midBuild);
    }

    protected consume(creep: Creep): void {
        super.consume(creep);
    }

    protected supply(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            const target = creep.room.memory.conquer ?? creep.room.memory.remote;
            if (target && creep.room.name != target) {
                creep.memory.targetRoom = target;
            }
        }
        super.supply(creep);
    }


    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running remote builder source`);
        super.run(creep);
    }

}

profiler.registerClass(RemoteBuilderSourceRole, 'RemoteBuilderSourceRole');

@singleton()
export class RemoteBuilderStorageRole extends BuilderStorageRole {

    name: string = 'remote-builder'

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo,
        prioBuild: RepairTaskRepo, midBuild: ConstructionTaskRepo) {
        super(log, pathing, provider, prioBuild, midBuild);
    }

    protected consume(creep: Creep): void {
        super.consume(creep);
    }

    protected supply(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            const target = creep.room.memory.conquer ?? creep.room.memory.remote;
            if (target && creep.room.name != target) {
                creep.memory.targetRoom = target;
            }
        }
        super.supply(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running remote builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(RemoteBuilderStorageRole, 'RemoteBuilderStorageRole');

import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { BuilderRole } from "./builder-role";

import { SupplyTaskRepo } from "repos/supply-task-repo";
import profiler from "screeps-profiler";
import { HarvestAction } from "../harvester/harvest-action";
import { CreepState } from "utils/creep-state";

@singleton()
export class BuilderSourceRole extends BuilderRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        protected provider: SupplyTaskRepo, protected harvesting: HarvestAction) {
        super(log, pathing)
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

profiler.registerClass(BuilderSourceRole, 'UpgraderSourceRole');

@singleton()
export class BuilderStorageRole extends BuilderRole {

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
        this.log.debug(creep.room, `Running builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(BuilderStorageRole, 'UpgraderStorageRole');

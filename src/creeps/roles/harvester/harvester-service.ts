import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

// import { RoleService } from "creeps/roles/role-service-registry";
import { HarvesterRole } from "./harvester-role";
import { HarvestAction } from "./harvest-action";

import { LinkDemandTaskRepo } from "repos/tasks/link/link-demand-task-repo";
import { ContainerDemandTaskRepo } from "repos/tasks/container/container-demand-task-repo";
import { CombinedRepo } from "repos/tasks/_base/combined-repo";
import { SpawnDemandTaskRepo } from "repos/tasks/spawn/spawn-demand-task-repo";
import { StorageDemandTaskRepo } from "repos/tasks/storage/storage-demand-task-repo";
import { ConstructionTaskRepo } from "repos/tasks/structures/construction-task-repo";

import profiler from "screeps-profiler";
import { ObjectiveRepo } from "repos/objectives/objectives-repo";
import { RepairTaskRepo } from "repos/tasks/structures/repair-task-repo";


@singleton()
export class HarvestSupplierRole extends HarvesterRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        supply: SpawnDemandTaskRepo, action: HarvestAction, objectives: ObjectiveRepo) {
        super(log, pathing, supply, undefined, action, objectives, undefined)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running harvester supplier`);
        super.run(creep);
    }
}

profiler.registerClass(HarvestSupplierRole, 'HarvestSupplierRole');

@singleton()
export class HarvestMidstreamRole extends HarvesterRole {

    phase = {
        start: 2, // 2: container, 3: storage, 4: links
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        container: ContainerDemandTaskRepo,
        storage: StorageDemandTaskRepo,
        links: LinkDemandTaskRepo,
        builds: ConstructionTaskRepo,
        repairs: RepairTaskRepo,
        action: HarvestAction,
        objectives: ObjectiveRepo) {
        super(log, pathing,
            new CombinedRepo('combined-demand', log, [
                { offset: 0, repo: links },
                { offset: 3, repo: storage },
                { offset: 6, repo: container }
            ]),
            new CombinedRepo('combined-construction', log, [
                { offset: 0, repo: repairs },
                { offset: 50, repo: builds }
            ]),
            action,
            objectives,
            5 // limit range
        );
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running harvester midstream`);
        super.run(creep);
    }
}

profiler.registerClass(HarvestMidstreamRole, 'HarvestMidstreamRole');

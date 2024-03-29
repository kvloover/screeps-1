import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";
import { RemoteHarvesterRole } from "./remote-harvester-role";
import { HarvestAction } from "./harvest-action";
import { ContainerDemandTaskRepo } from "repos/tasks/container/container-demand-task-repo";
import { ConstructionTaskRepo } from "repos/tasks/structures/construction-task-repo";
import { RepairTaskRepo } from "repos/tasks/structures/repair-task-repo";
import { CombinedRepo } from "repos/tasks/_base/combined-repo";
import { Task } from "repos/tasks/task";

import profiler from "screeps-profiler";

@singleton()
export class RemoteHarvestMidstreamRole extends RemoteHarvesterRole {

    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: ContainerDemandTaskRepo, repairs: RepairTaskRepo, private builds: ConstructionTaskRepo, action: HarvestAction) {
        super(log, pathing,
            supply,
            new CombinedRepo('combined', log, [{ offset: 0, repo: repairs }, { offset: 50, repo: builds }]),
            action);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running remote harvester midstream`);
        super.run(creep);
    }

    protected addConstructionTask(site: ConstructionSite<BuildableStructureConstant>): void {
        this.builds.add(new Task(site.pos.roomName, 1, site.progressTotal - site.progress, RESOURCE_ENERGY, site.id, undefined, site.pos));
    }
}

profiler.registerClass(RemoteHarvestMidstreamRole, 'RemoteHarvestMidstreamRole');

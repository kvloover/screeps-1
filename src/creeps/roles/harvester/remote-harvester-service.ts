import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";
import { LinkDemandTaskRepo } from "repos/link/link-demand-task-repo";
import { RemoteHarvesterRole } from "./remote-harvester-role";
import { HarvestAction } from "./harvest-action";
import { ConstructionTaskRepo } from "repos/structures/construction-task-repo";
import { RepairTaskRepo } from "repos/structures/repair-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";
import { Task } from "repos/task";

import profiler from "screeps-profiler";

@singleton()
export class RemoteHarvestMidstreamRole extends RemoteHarvesterRole {

    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: LinkDemandTaskRepo, repairs: RepairTaskRepo, private builds: ConstructionTaskRepo, action: HarvestAction) {
        super(log, pathing,
            supply,
            new CombinedRepo('combined', log, [{ offset: 0, repo: repairs }, { offset: 15, repo: builds }]),
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

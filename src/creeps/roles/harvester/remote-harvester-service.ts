import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";
import { MidstreamTaskRepo } from "repos/midstream-task-repo";
import { RemoteHarvesterRole } from "./remote-harvester-role";
import { HarvestAction } from "./harvest-action";
import { ConstructionTaskRepo } from "repos/construction-task-repo";
import { RepairTaskRepo } from "repos/repair-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";
import { ConstructionTask } from "repos/task";

import profiler from "screeps-profiler";

@singleton()
export class RemoteHarvestMidstreamRole extends RemoteHarvesterRole {

    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: MidstreamTaskRepo, repairs: RepairTaskRepo, private builds: ConstructionTaskRepo, action: HarvestAction) {
        super(log, pathing, supply, new CombinedRepo(repairs, builds, 15, 'combined', log), action);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running remote harvester midstream`);
        super.run(creep);
    }

    protected addConstructionTask(site: ConstructionSite<BuildableStructureConstant>): void {
        this.builds.add(new ConstructionTask(site.pos.roomName, 1, site.progressTotal - site.progress, RESOURCE_ENERGY, site.id, undefined, site.pos));
    }
}

profiler.registerClass(RemoteHarvestMidstreamRole, 'RemoteHarvestMidstreamRole');

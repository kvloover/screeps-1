import { DependencyContainer, injectable } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

// import { RoleService } from "creeps/roles/role-service-registry";
import { Roles } from "creeps/roles/role-registry";
import { HarvesterRole } from "./harvester-role";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { MidstreamTaskRepo } from "repos/midstream-task-repo";
import { HarvestTaskRepo } from "repos/harvest-task-repo";
import { RemoteHarvesterRole } from "./remote-harvester-role";
import profiler from "screeps-profiler";
import { HarvestAction } from "./harvest-action";


@injectable()
export class HarvestSupplierRole extends HarvesterRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        supply: DemandTaskRepo, action: HarvestAction) {
        super(log, pathing, supply, action, undefined)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running harvester supplier`);
        super.run(creep);
    }
}

@injectable()
export class HarvestMidstreamRole extends HarvesterRole {

    phase = {
        start: 2,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: MidstreamTaskRepo, action: HarvestAction) {
        super(log, pathing, supply, action, 5) // limit range
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running harvester midstream`);
        super.run(creep);
    }
}

profiler.registerClass(HarvestMidstreamRole, 'HarvestMidstreamRole');

@injectable()
export class RemoteHarvestMidstreamRole extends RemoteHarvesterRole {

    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        supply: MidstreamTaskRepo, action: HarvestAction) {
        super(log, pathing, supply, action)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running remote harvester midstream`);
        super.run(creep);
    }
}

profiler.registerClass(RemoteHarvestMidstreamRole, 'RemoteHarvestMidstreamRole');

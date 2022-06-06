import { DependencyContainer, injectable } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { RoleService } from "creeps/roles/role-service";
import { Roles } from "creeps/roles/role-registry";

import { HarvesterRole } from "./harvester-role";

import { DemandTaskRepo } from "repos/tasks/demand-task-repo";
import { MidstreamTaskRepo } from "repos/tasks/midstream-task-repo";
import { HarvestTaskRepo } from "repos/tasks/harvest-task-repo";


@injectable()
export class HarvestSupplierRole extends HarvesterRole {
    constructor(log: Logger, pathing: Pathing,
        provider: HarvestTaskRepo, supply: DemandTaskRepo) {
        super(log, pathing, provider, supply)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running harvester supplier`);
        super.run(creep);
    }
}

@injectable()
export class HarvestMidstreamRole extends HarvesterRole {
    constructor(log: Logger, pathing: Pathing,
        provider: HarvestTaskRepo, supply: MidstreamTaskRepo) {
        super(log, pathing, provider, supply)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running harvester midstream`);
        super.run(creep);
    }
}

@injectable()
export class HarvesterService implements RoleService {
    register(cont: DependencyContainer, phase: number): void {
        if (phase === 1) { cont.register(Roles.token, { useToken: HarvestSupplierRole }); }
        else if (phase >= 2) { cont.register(Roles.token, { useToken: HarvestMidstreamRole }); }
    }
}

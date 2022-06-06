import { DependencyContainer, injectable } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { RoleService } from "creeps/roles/role-service";
import { Roles } from "creeps/roles/role-registry";

import { HaulerRole } from "./hauler-role";

import { DemandTaskRepo } from "repos/tasks/demand-task-repo";
import { ProviderTaskRepo } from "repos/tasks/providor-task-repo";
import { StorageTaskRepo } from "repos/tasks/storage-task-repo";


@injectable()
export class HaulerMidstreamRole extends HaulerRole {
    constructor(log: Logger, pathing: Pathing,
        provider: ProviderTaskRepo, supply: DemandTaskRepo) {
        super(log, pathing, provider, supply)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler midstream`);
        super.run(creep);
    }
}

@injectable()
export class HaulerStorageRole extends HaulerRole {
    constructor(log: Logger, pathing: Pathing,
        provider: StorageTaskRepo, supply: DemandTaskRepo) {
        super(log, pathing, provider, supply)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler storage`);
        super.run(creep);
    }
}


@injectable()
export class HaulerService implements RoleService {
    register(cont: DependencyContainer, phase: number): void {
        // if downgraded from point of existence (phase 2): use lowest role
        if (phase <= 2) { cont.register(Roles.token, { useToken: HaulerMidstreamRole }); }
        else if (phase >= 3) { cont.register(Roles.token, { useToken: HaulerStorageRole }); }
    }
}

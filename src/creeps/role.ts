import { Logger } from "logger";
import { DemandTaskRepo } from "repos/tasks/demand-task-repo";
import { HarvestTaskRepo } from "repos/tasks/harvest-task-repo";
import { MidstreamTaskRepo } from "repos/tasks/midstream-task-repo";
import { DependencyContainer, injectable, predicateAwareClassFactory, registry } from "tsyringe";
import { Pathing } from "./pathing";

import {
    MeleeAttackerRole,
    BuilderRole,
    HarvesterRole,
    // RemoteHarvesterRole,
    UpgraderRole,
    RangedAttackerRole,
    HaulerRole,
    RemoteAttackerRole,
    ClaimerRole,
} from "./roles";

export interface Role {
    name: string;
    run(creep: Creep): void;
}

export interface RoleService {
    register(cont: DependencyContainer, phase: number): void;
}

@injectable()
export class HarvestSupplierRole extends HarvesterRole {
    constructor(log: Logger, pathing: Pathing, provider: HarvestTaskRepo, supply: DemandTaskRepo) { super(log, pathing, provider, supply) }

    public run(creep: Creep): void {
        this.log.info(`Running harvester supplier`);
        super.run(creep);
    }
}

@injectable()
export class HarvestMidstreamRole extends HarvesterRole {
    constructor(log: Logger, pathing: Pathing, provider: HarvestTaskRepo, supply: MidstreamTaskRepo) { super(log, pathing, provider, supply) }

    public run(creep: Creep): void {
        this.log.info(`Running harvester midstream`);
        super.run(creep);
    }
}

@injectable()
export class HarvesterService implements RoleService {
    register(cont: DependencyContainer, phase: number): void {
        if (phase === 1) { cont.register(Roles.token, { useToken: HarvestSupplierRole }); }
        else if (phase === 2) { cont.register(Roles.token, { useToken: HarvestMidstreamRole }); }
        else if (phase === 3) { cont.register(Roles.token, { useToken: HarvestMidstreamRole }); }
    }
}

@registry([
    { token: Roles.service, useToken: HarvesterService },
    { token: Roles.token, useToken: HaulerRole },
    { token: Roles.token, useToken: BuilderRole },
    // { token: Roles.service, useToken: RemoteHarvesterRole },
    { token: Roles.token, useToken: UpgraderRole },
    { token: Roles.token, useToken: MeleeAttackerRole },
    { token: Roles.token, useToken: RangedAttackerRole },
    { token: Roles.token, useToken: RemoteAttackerRole },
    { token: Roles.token, useToken: ClaimerRole },
])
export abstract class Roles {
    static readonly service = Symbol('RoleService');
    static readonly token = Symbol('Role');
}



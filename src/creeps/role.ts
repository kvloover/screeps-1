import { registry } from "tsyringe";

import {
    MeleeAttackerRole,
    BuilderRole,
    HarvesterRole,
    RemoteHarvesterRole,
    UpgraderRole,
    RangedAttackerRole,
    HaulerRole,
    RemoteAttackerRole,
    ClaimerRole
} from "./roles";

export interface Role {
    name: string;
    run(creep: Creep): void;
}

@registry([
    { token: Roles.token, useToken: HarvesterRole },
    { token: Roles.token, useToken: HaulerRole },
    { token: Roles.token, useToken: BuilderRole },
    { token: Roles.token, useToken: RemoteHarvesterRole },
    { token: Roles.token, useToken: UpgraderRole },
    { token: Roles.token, useToken: MeleeAttackerRole },
    { token: Roles.token, useToken: RangedAttackerRole },
    { token: Roles.token, useToken: RemoteAttackerRole },
    { token: Roles.token, useToken: ClaimerRole },
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

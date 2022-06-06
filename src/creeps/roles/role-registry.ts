import { registry } from "tsyringe";

import {
    MeleeAttackerRole,
    BuilderRole,
    // RemoteHarvesterRole,
    UpgraderRole,
    RangedAttackerRole,
    RemoteAttackerRole,
    ClaimerRole
} from ".";

@registry([
    { token: Roles.token, useToken: BuilderRole },
    // { token: Roles.service, useToken: RemoteHarvesterRole },
    { token: Roles.token, useToken: UpgraderRole },
    { token: Roles.token, useToken: MeleeAttackerRole },
    { token: Roles.token, useToken: RangedAttackerRole },
    { token: Roles.token, useToken: RemoteAttackerRole },
    { token: Roles.token, useToken: ClaimerRole },
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

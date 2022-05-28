import { registry } from "tsyringe";

import {
    MeleeAttackerRole,
    BuilderRole,
    HarvesterRole,
    UpgraderRole,
    RangedAttackerRole
} from "./roles";

export interface Role {
    name: string;
    run(creep: Creep): void;
}

@registry([
    { token: Roles.token, useToken: BuilderRole },
    { token: Roles.token, useToken: HarvesterRole },
    { token: Roles.token, useToken: UpgraderRole },
    { token: Roles.token, useToken: MeleeAttackerRole },
    { token: Roles.token, useToken: RangedAttackerRole }
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

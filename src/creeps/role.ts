import { registry } from "tsyringe";

import {
    AttackerRole,
    BuilderRole,
    HarvesterRole,
    UpgraderRole
} from "./roles";

export interface Role {
    name: string;
    run(creep: Creep): void;
}

@registry([
    { token: Roles.token, useToken: BuilderRole },
    { token: Roles.token, useToken: HarvesterRole },
    { token: Roles.token, useToken: UpgraderRole },
    { token: Roles.token, useToken: AttackerRole },
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

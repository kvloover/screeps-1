import { registry } from "tsyringe";

import {
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
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

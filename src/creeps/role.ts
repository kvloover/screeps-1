import { registry } from "tsyringe";

import { HarvesterRole } from "./harvester-role";

export interface Role {
    run(creep: Creep): void;
}

@registry([
    { token: Roles.token, useToken: HarvesterRole }
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

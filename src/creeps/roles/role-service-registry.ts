import { registry } from "tsyringe";

import { HarvesterService } from "./harvester/harvester-service";
import { HaulerService } from "./hauler/hauler-service";

@registry([
    { token: RoleServices.token, useToken: HarvesterService },
    { token: RoleServices.token, useToken: HaulerService },
])
export abstract class RoleServices {
    static readonly token = Symbol('RoleService');
}

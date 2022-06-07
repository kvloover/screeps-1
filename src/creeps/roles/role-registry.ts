import { registry } from "tsyringe";

import {
    MeleeAttackerRole,
    BuilderRole,
    RemoteHarvesterRole,
    UpgraderRole,
    RangedAttackerRole,
    RemoteAttackerRole,
    ClaimerRole,
} from ".";

import { FillerLinkRole, FillerStorageRole, FillerSupplierRole } from "./filler/filler-service";
import { HarvestMidstreamRole, HarvestSupplierRole } from "./harvester/harvester-service";
import { HaulerStorageRole } from "./hauler/hauler-service";

export interface Role {
    name: string;
    phase: {
        start: number;
        end: number;
    }
    run(creep: Creep): void;
}

@registry([
    { token: Roles.token, useToken: BuilderRole },
    { token: Roles.token, useToken: UpgraderRole },
    { token: Roles.token, useToken: MeleeAttackerRole },
    { token: Roles.token, useToken: RangedAttackerRole },
    { token: Roles.token, useToken: RemoteAttackerRole },
    { token: Roles.token, useToken: ClaimerRole },
    { token: Roles.token, useToken: HarvestSupplierRole },
    { token: Roles.token, useToken: HarvestMidstreamRole },
    { token: Roles.token, useToken: RemoteHarvesterRole },
    { token: Roles.token, useToken: HaulerStorageRole },
    { token: Roles.token, useToken: FillerSupplierRole },
    { token: Roles.token, useToken: FillerStorageRole },
    { token: Roles.token, useToken: FillerLinkRole },
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

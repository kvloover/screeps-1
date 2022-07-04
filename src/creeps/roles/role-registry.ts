import { registry } from "tsyringe";

import {
    MeleeAttackerRole,
    RangedAttackerRole,
    RemoteAttackerRole,
    ClaimerRole,
} from ".";

import { HarvestMidstreamRole, HarvestSupplierRole, RemoteHarvestMidstreamRole } from "./harvester/harvester-service";
import { UpgraderSourceRole, UpgraderStorageRole, UpgraderSupplyRole } from "./upgrader/upgrader-service";
import { BuilderSourceRole, BuilderStorageRole, RemoteBuilderSourceRole, RemoteBuilderStorageRole } from "./builder/builder-service";
import { HaulerDropsRole, HaulerMidstreamRole, HaulerStorageRole, RemoteHaulerStorageRole } from "./hauler/hauler-service";
import { FillerLinkRole, FillerStorageRole, FillerSupplierRole } from "./filler/filler-service";
import { DrainRole } from "./attacker/drain-role";
import { HealerRole } from "./attacker/healer-role";

export interface Role {
    name: string;
    phase: {
        start: number;
        end: number;
    }
    run(creep: Creep): void;
}

@registry([
    { token: Roles.token, useToken: MeleeAttackerRole },
    { token: Roles.token, useToken: RangedAttackerRole },
    { token: Roles.token, useToken: ClaimerRole },
    { token: Roles.token, useToken: BuilderSourceRole },
    { token: Roles.token, useToken: BuilderStorageRole },
    { token: Roles.token, useToken: UpgraderSourceRole },
    { token: Roles.token, useToken: UpgraderStorageRole },
    { token: Roles.token, useToken: UpgraderSupplyRole },
    { token: Roles.token, useToken: HarvestSupplierRole },
    { token: Roles.token, useToken: HarvestMidstreamRole },
    { token: Roles.token, useToken: HaulerDropsRole },
    { token: Roles.token, useToken: HaulerMidstreamRole },
    { token: Roles.token, useToken: HaulerStorageRole },
    { token: Roles.token, useToken: FillerSupplierRole },
    { token: Roles.token, useToken: FillerStorageRole },
    { token: Roles.token, useToken: FillerLinkRole },
    { token: Roles.token, useToken: DrainRole },
    { token: Roles.token, useToken: HealerRole },
    { token: Roles.token, useToken: RemoteAttackerRole },
    { token: Roles.token, useToken: RemoteBuilderSourceRole },
    { token: Roles.token, useToken: RemoteBuilderStorageRole },
    { token: Roles.token, useToken: RemoteHarvestMidstreamRole },
    { token: Roles.token, useToken: RemoteHaulerStorageRole },
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

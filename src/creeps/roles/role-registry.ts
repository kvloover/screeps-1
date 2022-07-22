import { registry } from "tsyringe";

import {
    MeleeAttackerRole,
    RangedAttackerRole,
    RemoteAttackerRole,
    ClaimerRole,
} from ".";

import { HarvestMidstreamRole, HarvestSupplierRole } from "./harvester/harvester-service";
import { RemoteHarvestMidstreamRole } from "./harvester/remote-harvester-service";
import { UpgraderContainerRole, UpgraderSourceRole, UpgraderStorageRole, UpgraderSupplyRole } from "./upgrader/upgrader-service";
import { BuilderContainerRole, BuilderSourceRole, BuilderStorageRole } from "./builder/builder-service";
import { RemoteBuilderContainerRole, RemoteBuilderSourceRole, RemoteBuilderStorageRole } from "./builder/remote-builder-service";
import { HaulerDropsRole, HaulerMidstreamRole, HaulerStorageRole } from "./hauler/hauler-service";
import { RemoteHaulerStorageRole } from "./hauler/remote-hauler-service";
import { FillerLinkRole, FillerStorageRole, FillerSupplierRole } from "./filler/filler-service";
import { DrainRole } from "./attacker/drain-role";
import { HealerRole } from "./attacker/healer-role";
import { ScoutRole } from "./utility/scout-role";

export interface Role {
    name: string;
    phase: {
        start: number;
        end: number;
    }
    prio: number;
    run(creep: Creep): void;
}

@registry([
    { token: Roles.token, useToken: MeleeAttackerRole },
    { token: Roles.token, useToken: RangedAttackerRole },
    { token: Roles.token, useToken: ClaimerRole },
    { token: Roles.token, useToken: BuilderSourceRole },
    { token: Roles.token, useToken: BuilderContainerRole },
    { token: Roles.token, useToken: BuilderStorageRole },
    { token: Roles.token, useToken: UpgraderSourceRole },
    { token: Roles.token, useToken: UpgraderContainerRole },
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
    { token: Roles.token, useToken: RemoteBuilderContainerRole },
    { token: Roles.token, useToken: RemoteBuilderStorageRole },
    { token: Roles.token, useToken: RemoteHarvestMidstreamRole },
    { token: Roles.token, useToken: RemoteHaulerStorageRole },
    { token: Roles.token, useToken: ScoutRole },
])
export abstract class Roles {
    static readonly token = Symbol('Role');
}

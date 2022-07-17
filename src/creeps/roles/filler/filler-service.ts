import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

// import { RoleService } from "creeps/roles/role-service-registry";

import { FillerRole } from "./filler-role";

import { SpawnDemandTaskRepo } from "repos/spawn/spawn-demand-task-repo";
import { StorageSupplyTaskRepo } from "repos/storage/storage-supply-task-repo";
import { LinkSupplyTaskRepo } from "repos/link/link-supply-task-repo";
import { StorageDemandTaskRepo } from "repos/storage/storage-demand-task-repo";
import { ContainerDemandTempTaskRepo } from "repos/container/container-demand-temp-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";

import profiler from "screeps-profiler";

/**
 * container to demand ~ hauler
 */
@singleton()
export class FillerSupplierRole extends FillerRole {

    phase = {
        start: 1, // 1: tombstones, drops
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        provider: StorageSupplyTaskRepo, containers: ContainerDemandTempTaskRepo,
        demands: SpawnDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined-supply', log, [{ offset: 0, repo: provider }, { offset: 3, repo: containers }]),
            demands);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running filler supplier`);
        super.run(creep);
    }
}

/**
 * container to storage
 */
@singleton()
export class FillerStorageRole extends FillerRole {

    phase = {
        start: 3,
        end: 3
    };

    constructor(log: Logger, pathing: Pathing,
        provider: StorageSupplyTaskRepo, containers: ContainerDemandTempTaskRepo,
        demands: StorageDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined-supply', log, [{ offset: 0, repo: provider }, { offset: 3, repo: containers }]),
            demands);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running filler storage`);
        // supplyRepo: storage + container | storageRepo : storage => avoid supplying to storage from storage
        if (!creep.memory.tasks_blacklist)
            creep.memory.tasks_blacklist = {};
        if (!creep.memory.tasks_blacklist.hasOwnProperty('consume')) {
            const storage = creep.room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_STORAGE });
            if (storage.length > 0)
                creep.memory.tasks_blacklist['consume'] = storage.map(i => i.id);
        }
        super.run(creep);
    }
}

profiler.registerClass(FillerStorageRole, 'FillerStorageRole');

/**
 * link to storage
 */
@singleton()
export class FillerLinkRole extends FillerRole {

    phase = {
        start: 4,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        providers: LinkSupplyTaskRepo,
        demands: StorageDemandTaskRepo) {
        super(log, pathing, providers, demands);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running filler link`);
        super.run(creep);
    }
}

profiler.registerClass(FillerLinkRole, 'FillerLinkRole');

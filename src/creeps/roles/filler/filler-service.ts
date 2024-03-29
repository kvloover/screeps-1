import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

// import { RoleService } from "creeps/roles/role-service-registry";

import { FillerRole } from "./filler-role";

import { SpawnDemandTaskRepo } from "repos/tasks/spawn/spawn-demand-task-repo";
import { StorageDemandTaskRepo } from "repos/tasks/storage/storage-demand-task-repo";
import { ContainerSupplyTaskRepo } from "repos/tasks/container/container-supply-task-repo";
import { LinkSupplyTaskRepo } from "repos/tasks/link/link-supply-task-repo";
import { StorageSupplyTaskRepo } from "repos/tasks/storage/storage-supply-task-repo";
import { TerminalSupplyTaskRepo } from "repos/tasks/terminal/terminal-supply-task-repo";
import { DropTaskRepo } from "repos/tasks/misc/drop-task-repo";
import { CombinedRepo } from "repos/tasks/_base/combined-repo";

import profiler from "screeps-profiler";

/**
 * drops/container to demand ~ hauler
 */
@singleton()
export class FillerSupplierRole extends FillerRole {

    phase = {
        start: 1, // 1: tombstones, drops
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        provider: DropTaskRepo,
        containers: ContainerSupplyTaskRepo,
        stockpile: StorageSupplyTaskRepo,
        terminalOut: TerminalSupplyTaskRepo,
        demands: SpawnDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined-supply', log, [
                { offset: 0, repo: stockpile },
                { offset: 3, repo: terminalOut },
                { offset: 6, repo: containers },
                { offset: 9, repo: provider },
            ]),
            demands);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running filler supplier`);
        super.run(creep);
    }
}

/**
 * drops/container to storage
 */
@singleton()
export class FillerStorageRole extends FillerRole {

    phase = {
        start: 3,
        end: 3
    };

    constructor(log: Logger, pathing: Pathing,
        provider: DropTaskRepo,
        containers: ContainerSupplyTaskRepo,
        stockpile: StorageSupplyTaskRepo,
        terminalOut: TerminalSupplyTaskRepo,
        demands: StorageDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined-supply', log, [
                { offset: 0, repo: stockpile },
                { offset: 3, repo: terminalOut },
                { offset: 6, repo: containers },
                { offset: 9, repo: provider },
            ]),
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

import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { StorageSupplyTaskRepo } from "repos/storage/storage-supply-task-repo";
import { RepairTaskRepo } from "repos/structures/repair-task-repo";
import { ConstructionTaskRepo } from "repos/structures/construction-task-repo";
import { ContainerSupplyTaskRepo } from "repos/container/container-supply-task-repo";
import { HarvestAction } from "../harvester/harvest-action";

import { BuilderContainerRole, BuilderSourceRole, BuilderStorageRole } from "./builder-service";

import profiler from "screeps-profiler";

@singleton()
export class RemoteBuilderSourceRole extends BuilderSourceRole {

    name: string = 'remote-builder'

    constructor(log: Logger, pathing: Pathing,
        harvesting: HarvestAction,
        prioBuild: RepairTaskRepo, midBuild: ConstructionTaskRepo) {
        super(log, pathing, harvesting, prioBuild, midBuild);
    }

    protected consume(creep: Creep): void {
        super.consume(creep);
    }

    protected supply(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            const target = creep.room.memory.conquer ?? creep.room.memory.remote;
            if (target && creep.room.name != target) {
                creep.memory.targetRoom = target;
            }
        }
        super.supply(creep);
    }


    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running remote builder source`);
        super.run(creep);
    }

}

profiler.registerClass(RemoteBuilderSourceRole, 'RemoteBuilderSourceRole');

@singleton()
export class RemoteBuilderContainerRole extends BuilderContainerRole {

    name: string = 'remote-builder';

    constructor(log: Logger, pathing: Pathing,
        provider: ContainerSupplyTaskRepo,
        prioBuild: RepairTaskRepo, midBuild: ConstructionTaskRepo) {
        super(log, pathing, provider, prioBuild, midBuild);
    }

    protected consume(creep: Creep): void {
        super.consume(creep);
    }

    protected supply(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            const target = creep.room.memory.conquer ?? creep.room.memory.remote;
            if (target && creep.room.name != target) {
                creep.memory.targetRoom = target;
            }
        }
        super.supply(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running remote builder container`);
        super.run(creep);
    }

}

profiler.registerClass(RemoteBuilderContainerRole, 'RemoteBuilderContainerRole');

@singleton()
export class RemoteBuilderStorageRole extends BuilderStorageRole {

    name: string = 'remote-builder';

    constructor(log: Logger, pathing: Pathing,
        containers: ContainerSupplyTaskRepo,
        provider: StorageSupplyTaskRepo,
        prioBuild: RepairTaskRepo, midBuild: ConstructionTaskRepo) {
        super(log, pathing, containers, provider, prioBuild, midBuild);
    }

    protected consume(creep: Creep): void {
        super.consume(creep);
    }

    protected supply(creep: Creep): void {
        if (!creep.memory.targetRoom) {
            const target = creep.room.memory.conquer ?? creep.room.memory.remote;
            if (target && creep.room.name != target) {
                creep.memory.targetRoom = target;
            }
        }
        super.supply(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running remote builder storage`);
        super.run(creep);
    }

}

profiler.registerClass(RemoteBuilderStorageRole, 'RemoteBuilderStorageRole');

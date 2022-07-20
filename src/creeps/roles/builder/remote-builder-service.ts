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
import { BuilderRole } from "./builder-role";
import { CombinedRepo } from "repos/_base/combined-repo";
import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";

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
export class RemoteBuilderContainerRole extends BuilderRole {

    name: string = 'remote-builder';
    phase = { start: 2, end: 2 };

    protected combinedSupply: TaskRepo<Task>;

    constructor(log: Logger, pathing: Pathing,
        protected containers: ContainerSupplyTaskRepo,
        protected storage: StorageSupplyTaskRepo,
        protected prioBuild: RepairTaskRepo, protected midBuild: ConstructionTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined', log, [
                { offset: 0, repo: prioBuild },
                { offset: 15, repo: midBuild }
            ]));

        this.combinedSupply = new CombinedRepo('combined-supply', log, [
            { offset: 0, repo: storage },
            { offset: 15, repo: containers }
        ])
    }

    protected consume(creep: Creep): void {
        // force move to remote
        if (creep.memory.targetRoom && creep.room.name == creep.memory.room) {
            this.pathing.scoutRoom(creep, creep.memory.targetRoom);
            // this.consumeFromRepo(creep, this.combinedSupply, 'consume', RESOURCE_ENERGY, creep.memory.targetRoom);
        } else {
            this.consumeFromRepo(creep, this.combinedSupply, 'consume', RESOURCE_ENERGY);
        }
    }

    protected supply(creep: Creep): void {
        super.supply(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running remote builder container`);

        if (!creep.memory.targetRoom) {
            const target = creep.room.memory.conquer ?? creep.room.memory.remote;
            if (target && creep.room.name != target) {
                creep.memory.targetRoom = target;
            }
        }

        super.run(creep);
    }

}

profiler.registerClass(RemoteBuilderContainerRole, 'RemoteBuilderContainerRole');

@singleton()
export class RemoteBuilderStorageRole extends BuilderRole {

    name: string = 'remote-builder';
    phase = { start: 3, end: 9 };

    protected combinedSupply: TaskRepo<Task>;

    constructor(log: Logger, pathing: Pathing,
        protected containers: ContainerSupplyTaskRepo,
        protected storage: StorageSupplyTaskRepo,
        protected prioBuild: RepairTaskRepo, protected midBuild: ConstructionTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined', log, [
                { offset: 0, repo: prioBuild },
                { offset: 15, repo: midBuild }
            ]));

        this.combinedSupply = new CombinedRepo('combined-supply', log, [
            { offset: 0, repo: storage },
            { offset: 15, repo: containers }
        ])
    }

    protected consume(creep: Creep): void {
        // force move to remote if we cant consume in spawning
        if (creep.memory.targetRoom && creep.ticksToLive && creep.ticksToLive < 1300 && creep.room.name == creep.memory.room) {
            this.pathing.scoutRoom(creep, creep.memory.targetRoom);
            // this.consumeFromRepo(creep, this.combinedSupply, 'consume', RESOURCE_ENERGY, creep.memory.targetRoom);
        } else {
            this.consumeFromRepo(creep, this.combinedSupply, 'consume', RESOURCE_ENERGY);
        }
    }

    protected supply(creep: Creep): void {
        super.supply(creep);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running remote builder storage`);

        if (!creep.memory.targetRoom) {
            const target = creep.room.memory.conquer ?? creep.room.memory.remote;
            if (target && creep.room.name != target) {
                creep.memory.targetRoom = target;
            }
        }

        super.run(creep);
    }

}

profiler.registerClass(RemoteBuilderStorageRole, 'RemoteBuilderStorageRole');

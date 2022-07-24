import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { HaulerRole } from "./hauler-role";

import { SpawnDemandTaskRepo } from "repos/tasks/spawn/spawn-demand-task-repo";
import { StorageSupplyTaskRepo } from "repos/tasks/storage/storage-supply-task-repo";
import { StorageDemandTaskRepo } from "repos/tasks/storage/storage-demand-task-repo";
import { DropTaskRepo } from "repos/tasks/misc/drop-task-repo";
import { CombinedRepo } from "repos/tasks/_base/combined-repo";
import { ContainerSupplyTaskRepo } from "repos/tasks/container/container-supply-task-repo";
import { TowerDemandTaskRepo } from "repos/tasks/misc/tower-demand-task-repo";
import { TerminalDemandTaskRepo } from "repos/tasks/terminal/terminal-demand-task-repo";
import { TerminalSupplyTaskRepo } from "repos/tasks/terminal/terminal-supply-task-repo";

import profiler from "screeps-profiler";

@singleton()
export class HaulerDropsRole extends HaulerRole {

    phase = {
        start: 9,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: DropTaskRepo,
        private spawns: SpawnDemandTaskRepo) {
        super(log, pathing,
            provider,
            spawns);
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running hauler midstream`);
        super.run(creep);
    }

    protected override unlinkSupply(creep: Creep): void {
        this.spawns.unregisterTask(creep, 'supply');
        this.spawns.clearReference(creep.id);
    }

}

@singleton()
export class HaulerMidstreamRole extends HaulerRole {

    phase = {
        start: 9, // container
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: DropTaskRepo,
        containers: ContainerSupplyTaskRepo,
        demands: SpawnDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined-supply', log, [{ offset: 0, repo: provider }, { offset: 3, repo: containers }]),
            demands)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running hauler midstream`);
        super.run(creep);
    }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.providers, 'consume');
    }

    protected supply(creep: Creep) {
        this.supplyToRepo(creep, this.demands, 'supply');
    }

    protected override findSupply(creep: Creep): boolean {
        return true;
    }

    protected override continueSupply(creep: Creep): boolean {
        return true;
    }

    protected override unlinkSupply(creep: Creep): void { }

}

profiler.registerClass(HaulerMidstreamRole, 'HaulerMidstreamRole');


@singleton()
export class HaulerStorageRole extends HaulerRole {

    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: DropTaskRepo,
        containers: ContainerSupplyTaskRepo,
        stockpile: StorageSupplyTaskRepo,
        terminalOut: TerminalSupplyTaskRepo,
        private towers: TowerDemandTaskRepo,
        private terminalIn: TerminalDemandTaskRepo,
        private spawns: SpawnDemandTaskRepo,
        private store: StorageDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined-supply', log, [
                { offset: 0, repo: provider },
                { offset: 3, repo: containers },
                { offset: 6, repo: stockpile },
                { offset: 9, repo: terminalOut },
            ]),
            new CombinedRepo('combined', log, [
                { offset: 0, repo: spawns },
                { offset: 3, repo: store },
                { offset: 6, repo: towers },
                { offset: 9, repo: terminalIn }
            ])
        );
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room.name, `Running hauler storage`);
        super.run(creep);
    }

    protected override unlinkSupply(creep: Creep): void {
        this.spawns.unregisterTask(creep, 'supply');
        this.spawns.clearReference(creep.id);
        this.store.unregisterTask(creep, 'supply');
        this.store.clearReference(creep.id);
        this.towers.unregisterTask(creep, 'supply');
        this.towers.clearReference(creep.id);
        this.terminalIn.unregisterTask(creep, 'supply');
        this.terminalIn.clearReference(creep.id);
    }

}

profiler.registerClass(HaulerStorageRole, 'HaulerStorageRole');

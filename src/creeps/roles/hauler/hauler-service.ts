import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { HaulerRole } from "./hauler-role";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { SupplyTaskRepo } from "repos/supply-task-repo";
import profiler from "screeps-profiler";
import { StorageTaskRepo } from "repos/storage-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";
import { isDefined } from "utils/utils";
import { CreepState } from "utils/creep-state";
import { MidstreamTaskRepo } from "repos/midstream-task-repo";

@singleton()
export class HaulerDropsRole extends HaulerRole {

    phase = {
        start: 1,
        end: 1
    };

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, private leftDemands: DemandTaskRepo, private rightDemands: MidstreamTaskRepo) {
        super(log, pathing, provider, new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler midstream`);
        super.run(creep);
    }

    protected override unlinkSupply(creep: Creep): void {
        this.leftDemands.unregisterTask(creep, 'supply');
        this.leftDemands.clearReference(creep.id);
        this.rightDemands.unregisterTask(creep, 'supply');
        this.rightDemands.clearReference(creep.id);
    }

}

@singleton()
export class HaulerMidstreamRole extends HaulerRole {

    phase = {
        start: 2,
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, demands: DemandTaskRepo) {
        super(log, pathing, provider, demands)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler midstream`);
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
        start: 3,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, private leftDemands: DemandTaskRepo, private rightDemands: StorageTaskRepo) {
        super(log, pathing, provider, new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler storage`);
        super.run(creep);
    }

    protected override unlinkSupply(creep: Creep): void {
        this.leftDemands.unregisterTask(creep, 'supply');
        this.leftDemands.clearReference(creep.id);
        this.rightDemands.unregisterTask(creep, 'supply');
        this.rightDemands.clearReference(creep.id);
    }

}

profiler.registerClass(HaulerStorageRole, 'HaulerStorageRole');

@singleton()
export class RemoteHaulerStorageRole extends HaulerRole {

    name: string = 'remote-hauler'
    phase = { start: 1, end: 9 };


    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, private leftDemands: DemandTaskRepo, private rightDemands: StorageTaskRepo) {
        super(log, pathing, provider, new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log))
    }

    public run(creep: Creep): void {

        // First entry to work: find target room
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].remote;
                creep.memory.targetRoom = target;
            }
        }

        this.log.debug(creep.room, `Running remote hauler storage`);
        super.run(creep);
    }

    protected override consume(creep: Creep): void {
        if (creep.memory.targetRoom
            && creep.memory.targetRoom != creep.room.name
            && !Game.rooms.hasOwnProperty(creep.memory.targetRoom)) {
            this.log.debug(creep.room, `scouting room ${creep.memory.targetRoom}`);
            this.pathing.scoutRoom(creep, creep.memory.targetRoom);
        } else {
            super.consume(creep);
        }
    }

    protected override findConsume(creep: Creep, type: ResourceConstant | undefined = undefined): boolean {
        return this.findHaulConsume(creep, type, creep.memory.targetRoom);
    }

    protected override findSupply(creep: Creep): boolean {
        return this.findHaulSupply(creep, creep.memory.room);
    }

    protected override unlinkSupply(creep: Creep): void {
        this.leftDemands.unregisterTask(creep, 'supply');
        this.leftDemands.clearReference(creep.id);
        this.rightDemands.unregisterTask(creep, 'supply');
        this.rightDemands.clearReference(creep.id);
    }

}

profiler.registerClass(RemoteHaulerStorageRole, 'RemoteHaulerStorageRole');

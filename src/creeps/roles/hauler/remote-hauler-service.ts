import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";
import { HaulerRole } from "./hauler-role";
import { DemandTaskRepo } from "repos/demand-task-repo";
import { SupplyTaskRepo } from "repos/supply-task-repo";
import { StorageTaskRepo } from "repos/storage-task-repo";
import { CombinedRepo } from "repos/_base/combined-repo";

import profiler from "screeps-profiler";

@singleton()
export class RemoteHaulerStorageRole extends HaulerRole {

    name: string = 'remote-hauler';
    phase = { start: 1, end: 9 };


    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, private leftDemands: DemandTaskRepo, private rightDemands: StorageTaskRepo) {
        super(log, pathing, provider, new CombinedRepo(leftDemands, rightDemands, 3, 'combined', log));
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

        this.log.debug(creep.room.name, `Running remote hauler storage`);
        super.run(creep);
    }

    protected override consume(creep: Creep): void {
        if (creep.memory.targetRoom
            && creep.memory.targetRoom != creep.room.name
            && !Game.rooms.hasOwnProperty(creep.memory.targetRoom)) {
            this.log.debug(creep.room.name, `scouting room ${creep.memory.targetRoom}`);
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

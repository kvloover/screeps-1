import { singleton } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";
import { HaulerRole } from "./hauler-role";
import { SpawnDemandTaskRepo } from "repos/tasks/spawn/spawn-demand-task-repo";
import { StorageSupplyTaskRepo } from "repos/tasks/storage/storage-supply-task-repo";
import { StorageDemandTaskRepo } from "repos/tasks/storage/storage-demand-task-repo";
import { ContainerSupplyTaskRepo } from "repos/tasks/container/container-supply-task-repo";
import { DropTaskRepo } from "repos/tasks/misc/drop-task-repo";
import { CombinedRepo } from "repos/tasks/_base/combined-repo";

import profiler from "screeps-profiler";

@singleton()
export class RemoteHaulerStorageRole extends HaulerRole {

    name: string = 'remote-hauler';
    phase = { start: 1, end: 9 };


    constructor(log: Logger, pathing: Pathing,
        drops: DropTaskRepo,
        provider: StorageSupplyTaskRepo,
        containers: ContainerSupplyTaskRepo,
        private leftDemands: SpawnDemandTaskRepo,
        private rightDemands: StorageDemandTaskRepo) {
        super(log, pathing,
            new CombinedRepo('combined-supply', log, [
                { offset: 0, repo: drops },
                { offset: 3, repo: containers },
                { offset: 6, repo: provider }
            ]),
            new CombinedRepo('combined', log, [
                { offset: 3, repo: leftDemands },
                { offset: 0, repo: rightDemands }
            ])
        );
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

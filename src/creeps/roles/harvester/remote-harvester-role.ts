import { injectable } from "tsyringe";

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { HarvesterRole } from "./harvester-role";
import { Role } from "../role-registry";

import { Task } from "repos/task";
import { TaskRepo } from "repos/_base/task-repo";
import profiler from "screeps-profiler";
import { HarvestAction } from "./harvest-action";
import { TransferRole } from "../_base/transfer-role";

export class RemoteHarvesterRole extends TransferRole implements Role {

    name: string = 'remote-harvester'
    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger,
        pathing: Pathing,
        protected demands: TaskRepo<Task>,
        protected harvesting: HarvestAction,
    ) { super(log, pathing) }

    protected consume(creep: Creep): void {
        // First entry to work: find target room
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].remote;
                creep.memory.targetRoom = target;
            }
        }

        this.harvesting.Action(creep, creep.memory.targetRoom);
    }

    protected supply(creep: Creep) {
        if (creep.memory.room != creep.room.name && !Game.rooms.hasOwnProperty(creep.memory.room)) {
            this.log.debug(creep.room, `scouting room ${creep.memory.room}`);
            this.pathing.scoutRoom(creep, creep.memory.room);
        } else {
            this.log.debug(creep.room, `remote supplying room ${creep.memory.room}`);
            let task: Task | undefined;
            let rangeLimit = 0;
            do {
                // if lower prio but close = take it for remote harvester
                rangeLimit += 10;
                task = this.findAndRegisterTask(creep, this.demands, 'supply', creep.store.getUsedCapacity(RESOURCE_ENERGY), RESOURCE_ENERGY, creep.memory.room, rangeLimit);
            } while (!task && rangeLimit < 50);
            this.supplyToRepo(creep, this.demands, 'supply', RESOURCE_ENERGY, creep.memory.room);
        }
    }
}

profiler.registerClass(RemoteHarvesterRole, 'RemoteHarvesterRole');

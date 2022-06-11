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

    protected harvest(creep: Creep, room?: string) {
        if (room && room != creep.room.name) {
            this.pathing.scoutRoom(creep, room);
        } else {
            this.harvesting.Action(creep, room);
        }
    }

    protected supply(creep: Creep) {
        if (creep.memory.room != creep.room.name) {
            this.pathing.scoutRoom(creep, creep.memory.room);
            // this.gotoRoom(creep, new RoomPosition(25, 25, creep.memory.room));
        } else {
            this.supplyToRepo(creep, this.demands, 'supply', creep.memory.room);
        }
    }
}

profiler.registerClass(RemoteHarvesterRole, 'RemoteHarvesterRole');

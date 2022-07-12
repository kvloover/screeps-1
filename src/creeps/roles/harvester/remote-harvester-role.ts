
import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";

import { Task } from "repos/task";
import { TaskRepo } from "repos/_base/task-repo";
import { TransferRole } from "../_base/transfer-role";
import { HarvestAction } from "./harvest-action";

import profiler from "screeps-profiler";

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
            this.log.debug(creep.room.name, `scouting room ${creep.memory.room}`);
            this.pathing.scoutRoom(creep, creep.memory.room);
        } else {
            const key = 'supply';
            this.log.debug(creep.room.name, `remote supplying room ${creep.memory.room}`);
            // if (!creep.memory.tasks[key])
            //     this.findAndRegisterTask(creep, this.demands, key, creep.store.getUsedCapacity(RESOURCE_ENERGY), RESOURCE_ENERGY, creep.memory.room);
            this.supplyToRepo(creep, this.demands, key, RESOURCE_ENERGY, creep.memory.room);
        }
    }
}

profiler.registerClass(RemoteHarvesterRole, 'RemoteHarvesterRole');

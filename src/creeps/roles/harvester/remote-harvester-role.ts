import { injectable } from "tsyringe";

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { HarvesterRole } from "./harvester-role";
import { Role } from "../role-registry";

import { Task } from "repos/task";
import { TaskRepo } from "repos/_base/task-repo";

export class RemoteHarvesterRole extends HarvesterRole implements Role {

    name: string = 'remote-harvester'

    constructor(log: Logger,
        pathing: Pathing,
        protected harvests: TaskRepo<Task>,
        protected demands: TaskRepo<Task>,
    ) { super(log, pathing, harvests, demands) }

    protected consume(creep: Creep): void {
        // First entry to work: find target room
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].remote;
                creep.memory.targetRoom = target;
            }
        }

        super.harvest(creep, creep.memory.targetRoom);
    }

    protected supply(creep: Creep) {
        const key = 'supply';
        this.supplyToRepo(creep, this.demands, key, creep.memory.room);
    }

}

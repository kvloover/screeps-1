
import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";

import { Task } from "repos/task";
import { TaskRepo } from "repos/_base/task-repo";
import { TransferRole } from "../_base/transfer-role";
import { HarvestAction } from "./harvest-action";

import profiler from "screeps-profiler";
import { CreepState } from "utils/creep-state";

export class RemoteHarvesterRole extends TransferRole implements Role {

    name: string = 'remote-harvester'
    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger,
        pathing: Pathing,
        protected demands: TaskRepo<Task>,
        protected buildTasks: TaskRepo<Task>,
        protected harvesting: HarvestAction,
    ) { super(log, pathing) }

    protected setState(creep: Creep, state: CreepState): void {
        super.setState(creep, state);
        creep.memory.targetId = undefined; // reset target
    }

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

        const key = 'supply';
        const memTask = creep.memory.tasks[key];
        if (!memTask) {
            const creating = this.createContainer(creep);

            const buildTask = this.findAndRegisterTask(creep, this.buildTasks, key, creep.store.getUsedCapacity(RESOURCE_ENERGY), RESOURCE_ENERGY, creep.room.name, 1);
            const repo = buildTask || creating ? this.buildTasks : this.demands;
            this.supplyToRepo(creep, repo, key, RESOURCE_ENERGY, creep.room.name, 5);
        } else {
            const repo = this.buildTasks.key == memTask.repo ? this.buildTasks : this.demands;
            this.supplyToRepo(creep, repo, key, RESOURCE_ENERGY, creep.room.name, 5);
        }
    }

    private createContainer(creep: Creep): boolean {
        if (!creep.memory.memoryId) {
            if (creep.memory.target) {
                this.log.debug(creep.room.name, `${creep.name} - Creating container for ${JSON.stringify(creep.memory.target)}`);
                const pos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName);

                const container = creep.room.lookForAtArea(LOOK_STRUCTURES, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true)
                    .find(s => s.structure && s.structure.structureType == STRUCTURE_CONTAINER);
                if (container && container.structure) {
                    creep.memory.memoryId = container.structure.id;
                    creep.memory.memoryPos = container.structure.pos;
                    return false;
                }

                const sitePos = creep.pos;
                if (sitePos.getRangeTo(pos) == 1) {
                    // check for construction - takes a tick to be created
                    const sites = creep.room.lookAt(sitePos)
                        .filter(s => s.constructionSite && s.constructionSite.structureType === STRUCTURE_CONTAINER);
                    if (sites.length > 0 && sites[0].constructionSite) {
                        const construction = sites[0].constructionSite
                        creep.memory.memoryPos = sitePos;
                        creep.memory.memoryId = construction.id;
                        // add site immediatly so it can be used for supply task
                        this.addConstructionTask(construction);
                        return true;
                    } else {
                        if (creep.room.createConstructionSite(sitePos.x, sitePos.y, STRUCTURE_CONTAINER) == OK) {
                            this.log.debug(creep.room.name, `${creep.name} - Created construction site for ${JSON.stringify(sitePos)}`);
                            return true;
                        } else {
                            this.log.warn(creep.room.name, `${creep.name} - Could not create container at ${JSON.stringify(creep.memory.target)}`);
                            return false;
                        }
                    }
                } else {
                    this.log.debug(creep.room.name, `${creep.name} - Moving closer to create container at ${JSON.stringify(creep.memory.target)}`);
                    // move back to target
                    this.pathing.moveTo(creep, sitePos, undefined, 1);
                    return true;
                }
            }
        }
        return false;
    }

    protected addConstructionTask(site: ConstructionSite) {
        // override if using combined repo (Eg: repair)
        this.buildTasks.add(new Task(site.pos.roomName, 1, site.progressTotal - site.progress, RESOURCE_ENERGY, site.id, undefined, site.pos));
    }
}

profiler.registerClass(RemoteHarvesterRole, 'RemoteHarvesterRole');

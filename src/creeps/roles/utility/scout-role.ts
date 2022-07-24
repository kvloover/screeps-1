import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import { isMyRoom } from "utils/utils";
import { CreepState } from "utils/creep-state";
import { Logger } from "logger";
import { ObjectiveRepo } from "repos/objectives/objectives-repo";
import { ScoutData } from "objectives/handlers/scout/scout-data";
import { ObjectiveScoutData } from "objectives/handlers/scout/scout-handler";
import { Objective } from "repos/objectives/objective";

import profiler from "screeps-profiler";

@singleton()
export class ScoutRole implements Role {

    name: string = 'scout';
    prio = 9;
    phase = {
        start: 1,
        end: 9
    };

    constructor(protected log: Logger, protected pathing: Pathing, private objectives: ObjectiveRepo) { }

    public run(creep: Creep): void {
        this.determineState(creep);
        this.runState(creep);
    }

    protected determineState(creep: Creep): void {
        if (!this.hasObjective(creep)) {
            this.setState(creep, CreepState.idle);
        }

        if (this.getState(creep) == CreepState.idle) {
            // Check for supply task
            if (this.hasObjective(creep)) {
                this.setState(creep, CreepState.work);
            }
        }
    }

    protected runState(creep: Creep): void {
        if (creep.spawning) return;
        if (!creep.memory.tasks) { creep.memory.tasks = {}; }
        if (!creep.memory.tasks_blacklist) { creep.memory.tasks_blacklist = {}; }

        if (this.getState(creep) == CreepState.work) {
            this.log.debug(creep.room.name, `${creep.name}: running consume`);
            this.scout(creep);
        }
        if (this.getState(creep) == CreepState.idle) {
            this.log.debug(creep.room.name, `${creep.name}: running idle`);
            this.idle(creep);
        }
    }

    protected setState(creep: Creep, state: CreepState): void {
        creep.memory.started = Game.time;
        creep.memory.state = state;
    }

    protected getState(creep: Creep): CreepState {
        return creep.memory.state;
    }

    protected hasObjective(creep: Creep) {
        return creep.memory.targetRoom != undefined;
    }

    private idle(creep: Creep): void { }

    private scout(creep: Creep): void {
        if (creep.memory.targetRoom)
            if (!this.executeObjective(creep)) {
                this.pathing.scoutRoom(creep, creep.memory.targetRoom)
            } else {
                // scout reached target room and data collected
                creep.memory.targetRoom = undefined;
                this.setState(creep, CreepState.idle);
            }
    }


    private executeObjective(creep: Creep): boolean {
        if (creep.memory.objective) {
            const obj = this.objectives.getById(creep.memory.objective);
            if (obj) {
                const data = obj.data as ObjectiveScoutData
                if (data) {
                    if (data.room != creep.room.name) return false;

                    const scoutData = this.collectData(creep, obj, data);
                    if (!global.scoutData) { global.scoutData = {}; }
                    global.scoutData[scoutData.room] = scoutData;
                    return true;
                }
            }
        }
        // always return true if we can't perform scout objective => proceed to next objective
        return true;
    }

    private collectData(creep: Creep, objective: Objective, data: ObjectiveScoutData): ScoutData {
        const controller = creep.room.controller?.pos;
        const owner = creep.room.controller?.owner?.username;
        const reservation = creep.room.controller?.reservation?.username;
        const level = creep.room.controller?.level;

        const hostilePower = creep.room.find(FIND_HOSTILE_CREEPS).reduce((s, c) =>
            c.getActiveBodyparts(ATTACK)
            + c.getActiveBodyparts(RANGED_ATTACK)
            + c.getActiveBodyparts(HEAL), 0);

        const sources = creep.room.find(FIND_SOURCES).length;

        return {
            room: creep.room.name,
            depth: data.depth,

            sources: sources,
            controller: controller,
            level: level,

            owner: owner,
            reservation: reservation,
            hostilePower: hostilePower,

            lastVisited: Game.time,
            lastVisitedByRoom: objective.master,
        }
    }

}

profiler.registerClass(ScoutRole, 'ScoutRole');


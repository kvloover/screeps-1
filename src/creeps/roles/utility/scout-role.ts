import { singleton } from "tsyringe";

import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import profiler from "screeps-profiler";
import { isController, whoAmI } from "utils/utils";
import { CreepState } from "utils/creep-state";
import { Logger } from "logger";

@singleton()
export class ScoutRole implements Role {

    name: string = 'scout';
    prio = 9;
    phase = {
        start: 1,
        end: 9
    };

    constructor(protected log: Logger, protected pathing: Pathing) { }

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

    public idle(creep: Creep): void { }

    public scout(creep: Creep): void {
        if (creep.memory.targetRoom) {
            if (!this.pathing.scoutRoom(creep, creep.memory.targetRoom)) {
                // scout reached target room
                creep.memory.targetRoom = undefined;
                this.setState(creep, CreepState.idle);
            }
        }
    }

}

profiler.registerClass(ScoutRole, 'ScoutRole');


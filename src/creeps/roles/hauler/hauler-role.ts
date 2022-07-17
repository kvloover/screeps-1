import { injectable } from "tsyringe";

import { Logger } from "logger";
import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";
import { isDefined } from "utils/utils";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { TaskRepo } from "repos/_base/task-repo";
import { Task } from "repos/task";

/**
 * Get Energy from containers and store in buildings
 */
export abstract class HaulerRole extends TransferRole implements Role {

    name: string = 'hauler'
    phase = {
        start: 2,
        end: 9
    };

    constructor(log: Logger,
        pathing: Pathing,
        protected providers: TaskRepo<Task>,
        protected demands: TaskRepo<Task>
    ) { super(log, pathing); }


    protected supply(creep: Creep) {
        // will use found supply task
        this.supplyToRepo(creep, this.demands, 'supply');
    }

    protected abstract unlinkSupply(creep: Creep): void;

    protected consume(creep: Creep): void {
        const Task = creep.memory.tasks['supply'];
        if (!Task || !Task.task) {
            this.log.critical(creep.room.name, `${creep.name}: consume exited premature`);
            return;
        }

        const type = Task.task.type;
        // will look for a new consume task
        if (!creep.memory.tasks['consume']) {
            if (!this.findConsume(creep, type)) {
                return;
            }
        }

        this.consumeFromRepo(creep, this.providers, 'consume', type);
    }

    protected override findSupply(creep: Creep): boolean {
        return this.findHaulSupply(creep);
    }

    protected findConsume(creep: Creep, type: ResourceConstant | undefined = undefined): boolean {
        return this.findHaulConsume(creep, type);
    }

    protected findHaulSupply(creep: Creep, room: string | undefined = undefined): boolean {
        this.log.debug(creep.room.name, `${creep.name}: searching for supply`);
        // check if we can find anything to supply and register it on the creep for use
        let task = this.findAndRegisterTask(creep, this.demands, 'supply', creep.store.getCapacity(), undefined, room);
        return isDefined(task);
    }

    protected findHaulConsume(creep: Creep, type: ResourceConstant | undefined = undefined, room: string | undefined = undefined): boolean {
        const task = this.findAndRegisterTask(creep, this.providers, 'consume', creep.store.getCapacity(type), type, room);
        if (!task) {
            const supply = creep.memory.tasks['supply'];
            if (supply && Game.time - supply.tick > 5) {
                this.log.debug(creep.room.name, `${creep.name} - timeout supply task`)
                this.unlinkSupply(creep);
                this.setState(creep, CreepState.idle);
                return false;
            }
            return false;
        } else {
            return true;
        }
    }

    protected override getStoreCheckType(creep: Creep): ResourceConstant | undefined {
        const Task = creep.memory.tasks['supply'];
        if (Task && Task.task)
            return Task.task.type;
        else
            return undefined; // shouldn't happen in this flow
    }

    protected override continueSupply(creep: Creep): boolean {
        const Task = creep.memory.tasks['supply'];
        this.log.debug(creep.room.name, `${creep.name}: continuing supply`)
        return isDefined(Task);
    }

    protected override blacklistFor(creep: Creep, key: string): string[] | undefined {
        if (key === 'supply') return undefined;

        this.log.debug(creep.room.name, `${creep.name}: blacklist - checking supply task`)
        // Avoid consuming from the task we are supplying
        const Task = creep.memory.tasks['supply'];
        if (Task && Task.task.requester) {
            this.log.debug(creep.room.name, `${creep.name}: blacklisting supply request`)

            const refs = global.refs ? global.refs[creep.room.name]?.objects : undefined;

            if (refs && refs.storage?.some(i => i.id == Task.task.requester)) {
                if (refs.terminal && refs.terminal.length > 0) {
                    return [Task.task.requester, refs.terminal[0].id] // avoid emptying terminal just to fill storage
                }
            }
            return [Task.task.requester]
        }
        else {
            return undefined;
        }
    }

}

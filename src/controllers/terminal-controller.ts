import { injectable } from "tsyringe";

import { Task } from "repos/task";
import { Controller } from "./controller";
import { Logger } from "logger";

import { ExchangeTaskRepo } from "repos/terminal/exchange-task-repo";
import { RequestTaskRepo } from "repos/terminal/request-task-repo";
import { TerminalSupplyTaskRepo } from "repos/terminal/terminal-supply-task-repo";
import { TerminalDemandTaskRepo } from "repos/terminal/terminal-demand-task-repo";

import { isMyRoom, isStoreStructure } from "utils/utils";

import profiler from "screeps-profiler";



@injectable()
export class TerminalController implements Controller {

    constructor(private log: Logger,
        private providerRepo: TerminalSupplyTaskRepo,
        private demandRepo: TerminalDemandTaskRepo,
        private exchange: ExchangeTaskRepo,
        private request: RequestTaskRepo) {
    }

    public monitor(room: Room): void {
        if (!isMyRoom(room))
            return;

        const refs = global.refs ? global.refs[room.name].objects : undefined;
        const terminals = refs ? refs[STRUCTURE_TERMINAL] : undefined;

        if (!terminals || terminals.length == 0)
            return;

        terminals.forEach(mem => {
            const struct = Game.getObjectById(mem.id);
            if (isStoreStructure(struct)) {
                if (room.memory.request) {
                    this.requestRoom(struct);
                } else if (room.memory.supply) {
                    this.supplyRoom(struct);
                }
            }
        });
    }

    private requestRoom(struct: AnyStoreStructure): void {
        const usedCapcity = struct.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
        const freeCapacity = struct.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;
        const requestAmount = Math.min(50000 - usedCapcity, freeCapacity);

        // Get free capacity to open up to other rooms
        if (requestAmount > 0) {
            const allTasks = this.request.getForRequester(struct.id);
            const amount = allTasks.reduce((p, c) => p + (c.amount ?? 0), 0);
            if (amount < requestAmount) {
                this.request.add(new Task(struct.room.name, 2, requestAmount - amount, RESOURCE_ENERGY, struct.id, undefined, struct.pos));
                this.request.mergeEmpty();
                this.log.debug(struct.room.name, `${struct.pos}: added request task`);
            }
        }

        // Provide all currently stored to the room | TODO merge logic with storage
        if (usedCapcity > 0) {
            const allProvides = this.providerRepo.getForRequester(struct.id);
            const amount = allProvides.reduce((p, c) => p + (c.amount ?? 0), 0);
            if (amount < usedCapcity) {
                this.providerRepo.add(new Task(struct.room.name, 3, usedCapcity - amount, RESOURCE_ENERGY, struct.id, undefined, struct.pos));
                this.providerRepo.mergeEmpty();
                this.log.debug(struct.room.name, `${struct.pos}: added supply task`);
            }
        }
    }

    private supplyRoom(struct: AnyStoreStructure) {
        const usedCapcity = struct.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
        const freeCapacity = struct.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;
        const requestAmount = Math.min(20000 - usedCapcity, freeCapacity);

        // Demand filling to certain level
        if (requestAmount > 0) {
            const allTasks = this.demandRepo.getForRequester(struct.id);
            const amount = allTasks.reduce((p, c) => p + (c.amount ?? 0), 0);
            if (amount < requestAmount) {
                this.demandRepo.add(new Task(struct.room.name, 3, requestAmount - amount, RESOURCE_ENERGY, struct.id, undefined, struct.pos));
                this.demandRepo.mergeEmpty();
                this.log.debug(struct.room.name, `${struct.pos}: added storage task`);
            }
        }

        // Get free amount to open up to other rooms
        if (usedCapcity > 0) {
            const allProvides = this.exchange.getForRequester(struct.id);
            const amount = allProvides.reduce((p, c) => p + (c.amount ?? 0), 0);
            if (amount < usedCapcity) {
                this.exchange.add(new Task(struct.room.name, 2, usedCapcity - amount, RESOURCE_ENERGY, struct.id, undefined, struct.pos));
                this.exchange.mergeEmpty();
                this.log.debug(struct.room.name, `${struct.pos}: added exchange task`);
            }
        }
    }
}

profiler.registerClass(TerminalController, 'TerminalController');

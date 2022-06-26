import { singleton } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";
import { isTerminal, isMyRoom } from "utils/utils";

import { initObjectMemory } from "structures/memory/structure-memory";
import { ExchangeTaskRepo } from "repos/exchange-task-repo";
import { RequestTaskRepo } from "repos/request-task-repo";

import profiler from "screeps-profiler";
import { ExchangeTask } from "repos/task";

// TODO move outside room based managers
// TODO other resource types ! cost energy

@singleton()
export class TerminalManager implements Manager {

    constructor(private log: Logger,
        private exchange: ExchangeTaskRepo,
        private request: RequestTaskRepo
    ) { }

    public run(room: Room): void {
        if (!isMyRoom(room) || !room.memory.supply)
            return;

        const refs = global.refs ? global.refs[room.name].objects : undefined;
        const terminals = refs ? refs[STRUCTURE_TERMINAL] : undefined;
        if (!terminals || terminals.length == 0)
            return;

        const open = this.request.list().filter(r => !r.executer && r.type == RESOURCE_ENERGY);
        if (open.length == 0)
            return;
        const order = open[0]; // simple fifo

        const terminalRef = terminals[0]; // only one in a room
        const terminal = Game.getObjectById(terminalRef.id);

        if (isTerminal(terminal) && terminal.cooldown == 0 && order.amount) {
            // estimation => over estimate cost slightly so free will be added automaticly
            const cost = 1.05 * Game.market.calcTransactionCost(order.amount, terminal.room.name, order.room);

            // Assign free amount
            const avail = this.exchange.getForRequester(terminal.id, RESOURCE_ENERGY).filter(r => !r.executer);
            const totalAvail = avail.reduce((acc, curr) => acc + (curr.amount ?? 0), 0);

            if (totalAvail < 5000)
                return;

            const linkedTasks: ExchangeTask[] = [];
            let remainder = order.amount + cost;
            let useable = 0;
            for (const free of avail) {
                if (free.amount) {
                    this.exchange.linkTask(terminal.id, free);
                    if (free.amount < remainder) {
                        remainder -= free.amount;
                        useable += free.amount;
                    } else {
                        this.exchange.trySplitTask(free, remainder);
                        free.amount = remainder;
                        useable += remainder;
                        remainder = 0;
                        break;
                    }
                    linkedTasks.push(free);
                }
            }

            const sending = remainder > 0
                ? Math.floor(0.95 * useable / (1 + (Math.log(0.1 * Game.map.getRoomLinearDistance(terminal.room.name, order.room) + 0.9) + 0.1)))
                : order.amount;

            // const sending = order.amount - remainder;
            if (sending > 0) {
                this.request.linkTask(terminal.id, order);
                if (sending < order.amount) {
                    this.request.trySplitTask(order, sending);
                }

                if (terminal.send(RESOURCE_ENERGY, sending, order.room) == OK) {
                    linkedTasks.forEach(tsk => this.exchange.removeById(tsk.id));
                    this.request.removeById(order.id);

                    console.log(`sending ${sending}`);
                    return;
                }

                console.log(`couldn't send ${sending}`);

                // just unlink and retry next time | other terminal
                this.request.unlinkTask(order);
                this.request.mergeEmpty(); // re-merge
            }

            // just unlink and retry next time | other terminal
            linkedTasks.forEach(tsk => this.exchange.unlinkTask(tsk));
            this.exchange.mergeEmpty(); // re-merge
        }

    }
}

profiler.registerClass(TerminalManager, 'TerminalManager');

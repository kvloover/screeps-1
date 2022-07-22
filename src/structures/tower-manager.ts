import { singleton } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";
import { isMyRoom, isStructure, isTower } from "utils/utils";

import profiler from "screeps-profiler";
import { initObjectMemory } from "structures/memory/structure-memory";
import { RepairTaskRepo } from "repos/structures/repair-task-repo";
import { threadId } from "worker_threads";
import { Task } from "repos/task";

@singleton()
export class TowerManager implements Manager {

    constructor(private log: Logger, private repairs: RepairTaskRepo) { }

    private defendOrRepair(room: Room, tower: TowerMemory, hostiles: Creep[]) {
        if (this.defend(room, tower, hostiles)) return;
        this.repair(room, tower);
    }


    private defend(room: Room, tower: TowerMemory, hostiles: Creep[]): boolean {
        if (hostiles.length == 0) return false;

        const pos = new RoomPosition(tower.pos.x, tower.pos.y, tower.pos.roomName);
        const closestHostile = pos.findClosestByRange(hostiles);
        if (closestHostile && pos.getRangeTo(closestHostile.pos) < tower.range) {
            const struct = Game.getObjectById(tower.id) as StructureTower;
            if (struct) {
                struct.attack(closestHostile);
                return true;
            }
        }
        return false;
    }

    private repair(room: Room, memory: TowerMemory) {
        if (!memory.tasks) { memory.tasks = {}; }
        let memTask = memory.tasks['repair'];

        if (memTask) {
            const repoTask = this.repairs.getById(memTask.task.id);
            if (!repoTask) {
                // clear task if no longer present (global reset)
                memTask = undefined;
            }
        }

        if (!memTask) {
            const pos = new RoomPosition(memory.pos.x, memory.pos.y, memory.pos.roomName);
            const closest = this.repairs.closestTask(pos, RESOURCE_ENERGY, room.name, undefined, 20);
            if (closest) { this.registerTask(memory, closest, pos); }
            memTask = memory.tasks['repair'];
            // todo split
        }

        if (memTask && memTask.task.requester && memTask.amount) {
            const tower = Game.getObjectById(memory.id);
            const target = Game.getObjectById(memTask.task.requester)
            // todo clear deleted/destroyed towers
            if (tower && target && isTower(tower) && isStructure(target)) {
                if ((memTask.task.prio < 100 && tower.store.getUsedCapacity(RESOURCE_ENERGY) > 200)
                    || tower.store.getUsedCapacity(RESOURCE_ENERGY) > 500) {
                    const res = tower.repair(target);
                    if (res == OK) {
                        memTask.amount -= memTask.perAction;
                        if (memTask.amount <= 0) {
                            this.finishTask(memory, memTask);
                        }
                    } else {
                        if (target.hits == target.hitsMax) {
                            this.finishTask(memory, memTask);
                        } else (
                            console.log(`repair returned: ${res}`)
                        )
                    }
                } else {
                    if (memTask.amount > 0) {
                        this.repairs.setAmount(memTask.task.id, memTask.amount);
                        this.repairs.unlinkTask(memTask.task);
                        this.unRegisterTask(memory);
                    } else {
                        this.finishTask(memory, memTask)
                    }
                }
            } else {
                // finish invalid task
                this.finishTask(memory, memTask);
            }
        } else {
            if (memTask) {
                // finish invalid task
                this.finishTask(memory, memTask);
            }
        }
    }

    private finishTask(memory: TowerMemory, memTask: TowerTask) {
        this.repairs.removeById(memTask.task.id);
        this.unRegisterTask(memory);
    }

    private unRegisterTask(memory: TowerMemory) {
        memory.tasks['repair'] = undefined;
    }

    private registerTask(memory: TowerMemory, closest: Task, pos: RoomPosition) {
        const range = closest.pos ? pos.getRangeTo(closest.pos) : 50;
        memory.tasks['repair'] = {
            key: 'repair',
            repo: 'repair',
            task: closest,
            amount: closest.amount,
            tick: Game.time,
            range: range,
            perAction: range <= 5 ? 800 : range >= 20 ? 200 : 1000 - (40 * range) // 800 + 800-200/5-20 * range - 5
        }
    }

    public run(room: Room): void {
        if (!isMyRoom(room))
            return;

        const towers = room.memory.objects?.tower;

        if (towers && towers.length > 0) {
            const hostiles = room.find(FIND_HOSTILE_CREEPS);
            towers.forEach(t => this.defendOrRepair(room, t as TowerMemory, hostiles));
        }
    }

    public static init(room: Room): void {
        initObjectMemory(room.memory, STRUCTURE_TOWER);
        if (room.memory.objects) room.memory.objects[STRUCTURE_TOWER] = [];  // reset if already present

        const towers = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_TOWER });
        const sources = room.find(FIND_SOURCES);

        towers.forEach(l => {
            const dist = sources.reduce((m, s) => {
                const distSrc = s.pos.getRangeTo(l.pos);
                return distSrc > m ? distSrc : m;
            }, 0);

            room.memory.objects?.tower?.push(
                <TowerMemory>{ id: l.id, pos: l.pos, range: Math.max(dist + 5, 15), type: STRUCTURE_TOWER, tasks: {} });
        });
    }
}

declare global {
    interface RoomMemory {
        towerRange: number;
    }
}

profiler.registerClass(TowerManager, 'TowerManager');

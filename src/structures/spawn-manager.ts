import { singleton } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";
import { bodyCost, isMyRoom } from "utils/utils";
import { SpawnQueue } from "./util/spawn-queue";
import { CreepState } from "utils/creep-state";
import { initObjectMemory } from "./memory/structure-memory";

import profiler from "screeps-profiler";

@singleton()
export class SpawnManager implements Manager {

    constructor(private log: Logger, private queue: SpawnQueue) { }

    private isBodyTemplate(str: string): str is BodyPartConstant {
        return (str as BodyPartConstant) != null;
    }

    protected manageSpawns(room: Room): void {

        const spawns = room.memory.objects?.spawn;
        if (spawns && spawns.length > 0) {
            let energy = room.energyAvailable;

            for (let spawnMem of spawns) {
                const spawn = Game.getObjectById(spawnMem.id) as StructureSpawn;
                if (spawn) {
                    if (spawn.spawning) {
                        this.reportSpawning(room, spawn);
                    } else {
                        this.queue.clearExecuting(room.name, spawn.name);
                        energy -= this.spawnFromRoomQueue(room, spawn, energy);
                    }
                }
            }
        }
    }

    protected spawnFromRoomQueue(room: Room, spawn: StructureSpawn, energy: number): number {
        const peek = this.queue.peek(room.name);
        if (peek) {
            this.log.debug(room.name, `to spawn: ${peek.role}`);
            const body = this.bodyFromInfo(peek.body);
            const cost = bodyCost(body);
            if (cost <= energy) {
                const newName = this.generateName(room, peek.role)
                const ret = spawn.spawnCreep(body,
                    newName,
                    { memory: this.mergeMemory(room, peek.role, peek.initial) });
                if (ret === OK) {
                    this.log.info(room.name, `spawning ${peek.role}:  ${newName}`);
                    const removed = this.queue.pop(room.name);
                    if (peek.role !== removed?.role) { this.log.warn(room.name, `spawning ${peek.role} different than popped ${removed?.role} `); }

                    if (removed) this.queue.executing(room.name, spawn.name, removed);
                    this.nameInUse(room, newName);
                    return cost;
                }
            } else {
                this.log.debug(room.name, `not enough energy for ${peek.role}`);
            }
        }
        return 0;
    }

    private mergeMemory(room: Room, role: string, info: Partial<CreepMemory>): CreepMemory {
        const base = this.initialMemory(room, role);
        return Object.assign(base, info);
    }

    private bodyFromInfo(info: BodyInfo): BodyPartConstant[] {
        let ret: BodyPartConstant[] = [];
        let trail: BodyMap | undefined = info.trail ? { ...info.trail } : undefined;
        if (info.fixed) {
            for (let body of info.fixed) {
                ret = ret.concat(_.flatten(Object.entries(body)
                    .map(([key, value]) => this.isBodyTemplate(key) ? _.times(value - (trail?.[key] || 0), _ => key) : [])));
                if (trail) {
                    for (let key of Object.keys(trail)) {
                        if (this.isBodyTemplate(key) && body.hasOwnProperty(key)) {
                            trail[key] = Math.max((trail[key] || 0) - (body[key] || 0), 0);
                        }
                    }
                }
            }
        } else if (info.dynamic) {

        }

        if (info.trail) {
            ret = ret.concat(_.flatten(Object.entries(info.trail)
                .map(([key, value]) => this.isBodyTemplate(key) ? _.times(value, _ => key) : []))
            );
        }

        return ret;
    }

    private initialMemory(room: Room, role: string): CreepMemory {
        return {
            id: undefined,
            role: role,
            state: CreepState.idle,
            room: room.name,
            targetRoom: undefined,
            staging: undefined,
            targetId: undefined,
            target: undefined,
            memoryId: undefined,
            memoryPos: undefined,
            objective: undefined,
            tasks: {},
            tasks_blacklist: {},
            started: 0
        };
    }

    private generateName(room: Room, role: string) {
        // initialize spawn sequence (reset ever 3k ticks - creeps live 1.5k)
        if (!Memory.spawnSequence || Game.time % 3000 === 0)
            Memory.spawnSequence = 0;

        return `${role.slice(0, 4)}_${Memory.spawnSequence.toString()}`
    }

    private nameInUse(room: Room, name: string) {
        this.log.debug(room.name, `name in use: ${name}`);
        Memory.spawnSequence++;
    }

    private reportSpawning(room: Room, spawn: StructureSpawn) {
        if (!spawn.spawning) return;
        var spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            spawn.pos.x + 1,
            spawn.pos.y,
            { align: 'left', opacity: 0.8 });
    }

    public run(room: Room): void {
        if (!isMyRoom(room))
            return;

        this.manageSpawns(room);
    }

    public static init(room: Room): void {
        initObjectMemory(room.memory, STRUCTURE_SPAWN);
        if (room.memory.objects) room.memory.objects[STRUCTURE_SPAWN] = [];  // reset if already present

        const spawns = room.find(FIND_MY_SPAWNS);

        spawns.forEach(l => {
            room.memory.objects?.spawn?.push(<SpawnMemory>{ id: l.id, pos: l.pos, type: STRUCTURE_SPAWN })
        });
    }

}

declare global {
    interface Memory {
        spawnSequence: number;
    }
}

profiler.registerClass(SpawnManager, 'SpawnManager');

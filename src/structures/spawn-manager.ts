import { singleton } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";
import { CreepState } from "utils/creep-state";
import { isDefined, isMyRoom } from "utils/utils";

import setup from "../config/setup.json";
import { config, roleConfig, stageConfig } from "../config/config";

import profiler from "screeps-profiler";
import { initObjectMemory } from "structures/memory/structure-memory";
import { forEach } from "lodash";

@singleton()
export class SpawnManager implements Manager {

    constructor(private log: Logger) { }

    private isBodyTemplate(str: string): str is BodyPartConstant {
        return (str as BodyPartConstant) != null;
    }

    private isStage(room: Room, roomCreeps: Creep[], cfg: stageConfig): boolean {
        return (cfg.roles.length > 0)
            && (cfg.controller < 0 || (room.controller != undefined && room.controller.level >= cfg.controller))
            && (cfg.energy < 0 || (room.energyCapacityAvailable >= cfg.energy))
            && (cfg.creeps <= 0 || roomCreeps.length >= cfg.creeps)
    }

    private isPrio(room: Room, roomCreeps: Creep[], cfg: roleConfig): boolean {
        return (cfg.count > 0)
            && (!cfg.emergency || (room.memory.emergency?.active))
            && (!cfg.condition || (room.memory.hasOwnProperty(cfg.condition) && (room.memory as any)[cfg.condition]))
            && (roomCreeps?.filter(c => c.memory.role === cfg.role
                && (!c.ticksToLive // spawning
                    || c.ticksToLive > c.body.length * 3
                ))?.length < cfg.count);
    }

    protected manageSpawns(room: Room): void {

        const spawns = room.memory.objects?.spawn;
        if (spawns && spawns.length > 0) {

            for (let spawnMem of spawns) {
                const spawn = Game.getObjectById(spawnMem.id) as StructureSpawn;
                if (spawn) {
                    if (spawn.spawning) {
                        this.reportSpawning(room, spawn);
                    } else {
                        this.trySpawn(room, spawn);
                    }
                }
            }
        }
    }

    protected trySpawn(room: Room, spawn: StructureSpawn): void {
        const roomCreeps = this.getRoomCreeps(room);

        const cfg = Object.assign(new config(), setup);

        const stage = _.last(
            _.sortBy(cfg, stage => stage.order)
                .filter(stage => this.isStage(room, roomCreeps, stage))
        )

        if (stage != undefined) {
            // this.log.info(`current stage: ${stage.order}`);
            room.memory.stage = stage.order;

            const prio = stage.roles
                .sort((a, b) => a.priority - b.priority)
                .filter(cfg => this.isPrio(room, roomCreeps, cfg))
                .find(x => x !== undefined);

            if (prio) {
                this.log.debug(room.name, `Requesting new spawn for ${prio.role}`)
                var template = prio.template ?? stage.template ?? { 'work': 1, 'move': 1, 'carry': 1 };
                var bodyTemplate = _.flatten(Object.entries(template)
                    .map(([key, value]) => this.isBodyTemplate(key) ? _.times(value, _ => key) : []));
                // template.map(i => this.isBodyTemplate(i) ? i : TOUGH);

                var newName = this.generateName(room, prio.role);
                const ret = spawn.spawnCreep(bodyTemplate, newName,
                    { memory: this.initialMemory(spawn, prio) });
                if (ret === OK) {
                    this.log.debug(room.name, `Spawning new ${prio.role}: ${newName}`);
                    if (prio.condition && prio.reset_condition
                        && room.memory.hasOwnProperty(prio.condition)) {
                        (room.memory as any)[prio.condition] = undefined;
                    }
                    this.nameInUse(room, prio.role, newName);
                } else if (ret === ERR_NAME_EXISTS) {
                    this.nameInUse(room, prio.role, newName);
                }
            }
        }
    }

    private getRoomCreeps(room: Room): Creep[] {
        //return room.find(FIND_MY_CREEPS);
        const creeps =
            _.filter(
                _.mapValues(Memory.creeps, (v, k) => { return { ...v, name: k } }),
                c => c.room === room.name
            ).map(i => i.name !== undefined
                && Game.creeps.hasOwnProperty(i.name)
                ? Game.creeps[i.name] : undefined)
                .filter(isDefined);
        return creeps;
    }

    private initialMemory(spawn: StructureSpawn, cfg: roleConfig): CreepMemory {
        return {
            id: undefined,
            role: cfg.role,
            state: CreepState.idle,
            room: spawn.room.name,
            targetRoom: undefined,
            staging: undefined,
            targetId: undefined,
            target: undefined,
            memoryId: undefined,
            memoryPos: undefined,
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

    private nameInUse(room: Room, role: string, name: string) {
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

import { injectable } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";

import setup from "./config/setup.json";
import { config, roleConfig, stageConfig } from "./config/config";

@injectable()
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
            && (roomCreeps?.filter(c => c.memory.role === cfg.role)?.length < cfg.count);
    }

    private manageSpawns(room: Room): void {

        const spawns = room.find(FIND_MY_SPAWNS)
        if (spawns.length > 0) {
            const spawn = spawns[0];
            if (spawn.spawning) {
                this.reportSpawning(room, spawn);
            } else {
                this.trySpawn(room, spawn);
            }
        }
    }

    private trySpawn(room: Room, spawn: StructureSpawn): void {
        const roomCreeps = room.find(FIND_MY_CREEPS);

        const cfg = Object.assign(new config(), setup);

        const stage = _.last(
            _.sortBy(cfg, stage => stage.order)
                .filter(stage => this.isStage(room, roomCreeps, stage))
        )

        if (stage != undefined) {
            this.log.Information(`current stage: ${stage.order}`);

            const prio = stage.roles
                .sort((a, b) => a.priority - b.priority)
                .filter(cfg => this.isPrio(room, roomCreeps, cfg))
                .find(x => x !== undefined);

            if (prio) {
                this.log.Information(`Requesting new spawn for ${prio.role}`)
                var template = prio.template ?? stage.template ?? [WORK, CARRY, MOVE];
                var bodyTemplate = template.map(i => this.isBodyTemplate(i) ? i : TOUGH);

                var newName = this.generateName(room, prio.role);
                const ret = spawn.spawnCreep(bodyTemplate, newName,
                    { memory: { role: prio.role, working: false, room: spawn.room.name } });
                if (ret === OK) {
                    this.log.Critical(`Spawning new ${prio.role}: ${newName}`);
                    this.nameInUse(room, prio.role, newName);
                } else if (ret === ERR_NAME_EXISTS) {
                    this.nameInUse(room, prio.role, newName);
                }
            }
        }
    }

    private generateName(room: Room, role: string) {
        // initialize spawn sequence (reset ever 3k ticks - creeps live 1.5k)
        if (!Memory.spawnSequence || Game.time % 3000 === 0)
            Memory.spawnSequence = 0;

        return `${role.slice(0, 4)}_${Memory.spawnSequence.toString()}`
    }

    private nameInUse(room: Room, role: string, name: string) {
        this.log.Critical(`name in use: ${name}`);
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
        this.manageSpawns(room);
    }

}

declare global {
    interface Memory {
        spawnSequence: number;
    }
}
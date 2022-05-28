import { injectable, inject } from "tsyringe";

import { Manager } from "manager";
import basic from './basic.json';
import { SourceController } from "./source-controller";

@injectable()
export class RoomManager implements Manager {

    constructor(private sources: SourceController) { }

    // spawn according to json

    public spawn(): void {
        const spawn = Game.spawns['Spawn1'];

        const state: { [key: string]: number } = {};
        basic.initial
            .forEach(cfg => state[cfg.role] =
                _.filter(Game.creeps, (creep) => creep.memory.role == cfg.role).length);

        const prio = basic.initial
            .sort((a, b) => b.priority - a.priority)
            .filter(cfg => _.filter(Game.creeps, (creep) => creep.memory.role == cfg.role)?.length < cfg.count)
            .find(x => x !== undefined);

        if (prio) {
            var newName = 'drone_' + Game.time;
            console.log(`Spawning new ${prio.role}: ${newName}`);
            spawn.spawnCreep([WORK, CARRY, MOVE], newName,
                { memory: { role: prio.role, working: false, room: spawn.room.name } });

        }


        if (spawn.spawning) {
            var spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }

    public state(): void {

    }

    public run(): void {
        this.spawn();

        // TODO rework room manager for a single room
        _.forEach(Game.rooms, room => this.sources.run(room));
    }

}

import { injectable } from "tsyringe";

import { Manager } from "manager";

injectable()
export class RoomManager implements Manager {

    constructor() { }

    // spawn according to json

    public spawn(): void {
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        console.log('Harvesters: ' + harvesters.length);

        const spawn = Game.spawns['Spawn1'];

        if (harvesters.length < 2) {
            var newName = 'Harvester' + Game.time;
            console.log('Spawning new harvester: ' + newName);
            spawn.spawnCreep([WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester', working: false, room: spawn.room.name } });
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

    public run(): void {
        this.spawn();
    }

}

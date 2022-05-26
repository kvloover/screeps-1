import { inject, injectable } from "tsyringe";

import { Manager } from "manager";
import { Role, Roles } from "./role";

@injectable()
export class CreepsManager implements Manager {

    constructor(@inject(Roles.token) private role: Role) { }

    public spawn(): void {
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        console.log('Harvesters: ' + harvesters.length);

        if (harvesters.length < 2) {
            var newName = 'Harvester' + Game.time;
            console.log('Spawning new harvester: ' + newName);
            Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }

        if (Game.spawns['Spawn1'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }

    public performRole(): void {
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == 'harvester') {
                this.role.run(creep);
            }
            // if(creep.memory.role == 'upgrader') {
            //     roleUpgrader.run(creep);
            // }
        }
    }

    public run(): void {
        this.spawn();
        this.performRole();
    }

}

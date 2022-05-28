import { injectable } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";

@injectable()
export class TowerManager implements Manager {

    constructor(private log: Logger) { }

    private defend(tower: StructureTower) {

        const closestDamagedStructure = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if (closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
        }
    }

    public run(): void {

        // rewrite
        Object.keys(Game.rooms)
            .forEach(key => {
                const towers = Game.rooms[key].find<StructureTower>(FIND_MY_STRUCTURES,
                    { filter: (struct) => struct.structureType == STRUCTURE_TOWER });
                this.log.Information(`${towers.length} towers found in room ${Game.rooms[key].name}`);
                if (towers.length > 0) {
                    towers.forEach(t => this.defend(t));
                }
            });

    }
}

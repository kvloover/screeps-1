import { injectable } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";

@injectable()
export class TowerManager implements Manager {

    constructor(private log: Logger) { }

    private defend(tower: StructureTower) {
        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
        }

        const closestContainer = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (c) =>
                c.structureType === STRUCTURE_CONTAINER
                && c.hits < c.hitsMax
        });
        if (closestContainer) {
            tower.repair(closestContainer);
        }
    }

    public run(room: Room): void {

        // rewrite
        const towers = room.find<StructureTower>(FIND_MY_STRUCTURES,
            { filter: (struct) => struct.structureType == STRUCTURE_TOWER });
        // this.log.Information(`${towers.length} towers found in room ${room.name}`);
        if (towers.length > 0) {
            towers.forEach(t => this.defend(t));
        }

    }
}

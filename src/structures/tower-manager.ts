import { injectable } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";

@injectable()
export class TowerManager implements Manager {

    constructor(private log: Logger) { }

    private defend(room: Room, tower: StructureTower) {
        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile && tower.pos.getRangeTo(closestHostile.pos) < room.memory.towerRange) {
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

            if (!room.memory.towerRange) {
                const sources = room.find(FIND_SOURCES);
                room.memory.towerRange = 8 + towers.reduce((p, c) => {
                    const dist = sources.reduce((m, s) => {
                        const distSrc = s.pos.getRangeTo(c.pos);
                        return distSrc > p ? distSrc : p;
                    }, 0);
                    return p > dist ? p : dist;
                }, 0);
            }

            towers.forEach(t => this.defend(room, t));

        }

    }
}

declare global {
    interface RoomMemory {
        towerRange: number;
    }
}

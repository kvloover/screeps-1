import { injectable } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";
import { isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class TowerManager implements Manager {

    constructor(private log: Logger) { }

    private defend(room: Room, tower: TowerMemory, hostiles: Creep[]) {
        const closestHostile = tower.pos.findClosestByRange(hostiles);
        if (closestHostile && tower.pos.getRangeTo(closestHostile.pos) < tower.range) {
            const struct = Game.getObjectById(tower.id) as StructureTower;
            if (struct) {
                struct.attack(closestHostile);
            }
        }
    }

    public run(room: Room): void {
        if (!isMyRoom(room))
            return;

        const towers = room.memory.towers;

        if (towers && towers.length > 0) {
            const hostiles = room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {
                towers.forEach(t => this.defend(room, t, hostiles));
            }
        }

    }

    public static init(room: Room): void {
        room.memory.towers = [];

        const towers = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_TOWER });
        const sources = room.find(FIND_SOURCES);

        towers.forEach(l => {
            const dist = sources.reduce((m, s) => {
                const distSrc = s.pos.getRangeTo(l.pos);
                return distSrc > m ? distSrc : m;
            }, 0);
            room.memory.towers.push({ id: l.id, pos: l.pos, range: dist + 5 })
        });
    }
}

declare global {
    interface RoomMemory {
        towerRange: number;
    }
}

profiler.registerClass(TowerManager, 'TowerManager');

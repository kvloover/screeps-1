import { singleton } from "tsyringe";

import { Manager } from "manager";
import { Timings } from "utils/timings";
import { isMyRoom } from "utils/utils";
import { BUILDING_MAP } from "./util/constants";
import { Logger } from "logger";
import { outerPerimeter, Point } from "utils/distance-util";
import { getRoomCostMatrix } from "./util/room-cost-matrix";

@singleton()
export class DefenseManager implements Manager {

    constructor(private log: Logger) { }

    run(room: Room): void {
        if (!isMyRoom(room)) return;
        if (global.defense && global.defense?.[room.name]?.closed) return;

        const [main, offset] = Timings.timingForKeyAndRoom('defense', room.name);
        if (Game.time % main != offset) return;

        if (!global.defense) global.defense = {};
        if (!global.defense[room.name]) global.defense[room.name] = { closed: false, patrolmatrix: undefined, visited: undefined };

        // wait for plan to be loaded
        if (!room.memory.manual && (!global.plans || !global.plans.hasOwnProperty(room.name))) return;

        // get cost matrix with ramparts/walls marked
        const ramps = this.getRamparts(room);
        const roomCostMatrix = this.getFindMatrix(room.name, ramps);

        // get main defense seeds
        const spawns = room.memory.objects?.spawn;
        if (!spawns || spawns.length == 0) return;
        const seeds = spawns.map(s => { return { x: s.pos.x, y: s.pos.y } });

        // get perimeter and innerArea to defend
        const [perimeter, visited, closed] = outerPerimeter(room.name, roomCostMatrix, seeds, true);

        global.defense[room.name] = {
            closed,
            patrolmatrix: this.getPatrolMatrix(room.name, visited, ramps),
            visited
        };

    }

    public showPatrol(room: Room): void {
        if (!isMyRoom(room)) return;

        const defense = global.defense[room.name];
        if (!defense || !defense.patrolmatrix) return;

        room.visual.costMatrix(defense.patrolmatrix, { opacity: 0.5 });
    }

    private getFindMatrix(roomName: string, ramps: Point[]): CostMatrix {
        const costs = getRoomCostMatrix(roomName);
        // get ramparts from planned if plan or from room if no plan

        for (let ramp of ramps) {
            costs.set(ramp.x, ramp.y, 0xff);
        }

        return costs;
    }

    private getPatrolMatrix(roomName: string, visited: CostMatrix, ramps: Point[]): CostMatrix {
        const costs = getRoomCostMatrix(roomName);

        for (let x = 0; x <= 49; x++) {
            for (let y = 0; y <= 49; y++) {
                if (visited.get(x, y) == 0) {
                    costs.set(x, y, 0xff); // do not walk
                }
            }
        }

        for (let ramp of ramps) {
            if (visited.get(ramp.x, ramp.y) == 1) {
                costs.set(ramp.x, ramp.y, 1); // 1 is the same value as road => try to force on roads and ramparts
            }
        }

        return costs;
    }

    private getRamparts(room: Room): Point[] {
        const pos: Point[] = []
        if (room.memory.manual) {
            const objRefs = room.memory.objects?.rampart;
            if (objRefs) {
                for (let structure of objRefs) {
                    pos.push({ x: structure.pos.x, y: structure.pos.y });
                }
            }
        } else if (global.plans.hasOwnProperty(room.name)) {
            const executable = global.plans[room.name];
            if (executable) {
                for (let gclPlan of Object.values(executable.plan)) {
                    for (let structure of gclPlan.structures) {
                        if (structure.structureType == STRUCTURE_RAMPART) {
                            pos.push({ x: structure.pos.x, y: structure.pos.y });
                        }
                    }
                }
            }
        }

        return pos;
    }

}


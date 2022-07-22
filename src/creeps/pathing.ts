import { injectable, singleton } from "tsyringe";

import { Logger } from "logger";
import { PathingOptions } from "./pathing-options";

import profiler from "screeps-profiler";
import { Console } from "console";

@singleton()
export class Pathing {

    constructor(private log: Logger, private opt: PathingOptions) { }

    public findClosest<K extends FindConstant, S extends FindTypes[K]>(creep: Creep, constant: K, opts?: FilterOptions<K, S>): S | null {
        const options: PathFinderOpts = this.opt.optimalFinder();
        const closest = creep.pos.findClosestByPath(constant, { ...options, ...opts });
        return closest as S;
    }

    public findClosestOf<K extends FindConstant, S extends FindTypes[K]>(creep: Creep, locations: S[]): S | null {
        if (locations.length == 0) return null;
        const options: PathFinderOpts = this.opt.optimalFinder();
        const closest = creep.pos.findClosestByPath(locations, options);
        return closest as S;
    }

    public moveTo(creep: Creep, pos: RoomPosition, allowHostile: boolean = false, range: number = 0,
        opts?: PathingOpts
    ): CreepActionReturnCode {

        const travelOpts: TravelToOptions = { allowHostile: allowHostile, range: range };
        if (opts && opts.overwrite) {
            travelOpts.roomCallback = (room, matrix) => this.mergeMatrix(room, matrix, opts.overwrite);
        }

        return creep.travelTo(pos, travelOpts) as CreepActionReturnCode;
    }

    private mergeMatrix(roomName: string, matrix: CostMatrix, overwrite: CostMatrix | undefined): CostMatrix {
        if (!overwrite) return matrix;

        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const cost = matrix.get(x, y);
                if (cost != 0xff) { // walkable
                    const additionalCost = overwrite.get(x, y);
                    if (additionalCost > 0) {
                        matrix.set(x, y, additionalCost);
                    }
                }
            }
        }

        return matrix;
    }

    public scoutRoom(creep: Creep, room: string, allowHostile: boolean = false): boolean {
        const pos = new RoomPosition(25, 25, room);
        const range = 24;
        if (creep.room.name == room && pos.getRangeTo(creep.pos) <= range) return false;
        creep.travelTo(pos, { range: range, allowHostile: allowHostile });
        return true;
    }

}

export class PathingOpts {
    overwrite?: CostMatrix
}


profiler.registerClass(Pathing, 'Pathing');

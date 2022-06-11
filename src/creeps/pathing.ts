import { injectable } from "tsyringe";

import { Logger } from "logger";
import { PathingOptions } from "./pathing-options";

import profiler from "screeps-profiler";

@injectable()
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

    public moveTo(creep: Creep, pos: RoomPosition) {
        creep.travelTo(pos);
        /*
        const options: PathFinderOpts = this.opt.optimalFinder();
        const pathing = PathFinder.search(creep.pos, { pos: pos, range: 1 }, options);

        // creep.moveTo(pos, { costCallback })
        if (pathing && pathing?.path?.length > 0) {
            const pos = pathing.path[0];
            this.log.debug(creep.room, `next step for ${creep.name}: ${JSON.stringify(pos)}`)
            creep.move(creep.pos.getDirectionTo(pos));
        }
        */
    }

    public scoutRoom(creep: Creep, room: string) {
        if (creep.room.name !== room) {
            // move to room
            this.moveTo(creep, new RoomPosition(25, 25, room));
        }
    }

    public gotoRoom(creep: Creep, pos: RoomPosition) {
        if (creep.room.name !== pos.roomName) {
            // move to room
            this.moveTo(creep, pos);
        }
    }
}

profiler.registerClass(Pathing, 'Pathing');

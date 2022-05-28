import { injectable } from "tsyringe";
import { PathingOptions } from "./pathing-options";

@injectable()
export class Pathing {

    constructor(private opt: PathingOptions) { }

    public findClosest<K extends FindConstant, S extends FindTypes[K]>(creep: Creep, constant: K, opts?: FilterOptions<K, S>): S | null {
        const options: PathFinderOpts = this.opt.optimal();
        const closest = creep.pos.findClosestByPath(constant, { ...options, ...opts });
        return closest as S;
    }

    public moveTo(creep: Creep, pos: RoomPosition) {

        const options: PathFinderOpts = this.opt.optimal();
        const pathing = PathFinder.search(creep.pos, { pos: pos, range: 1 }, options);

        if (pathing && pathing?.path?.length > 0) {
            const pos = pathing.path[0];
            creep.move(creep.pos.getDirectionTo(pos));
        }
    }
}

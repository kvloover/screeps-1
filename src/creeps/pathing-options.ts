import { singleton } from "tsyringe";
import { Pathing } from "./pathing";

@singleton()
export class PathingOptions {

    private static _optimalFinder: { tick: number, options: PathFinderOpts } | undefined = undefined;
    private static _optimalMove: { tick: number, options: MoveToOpts } | undefined = undefined;
    private static _matrix: { tick: number, cost: { [key: string]: CostMatrix } } | undefined = undefined;

    public optimalFinder(): PathFinderOpts {
        if (PathingOptions._optimalFinder == undefined || PathingOptions._optimalFinder.tick < Game.time) {
            PathingOptions._optimalFinder =
            {
                tick: Game.time,
                options: {
                    // We need to set the defaults costs higher so that we
                    // can set the road cost lower in `roomCallback`
                    plainCost: 2,
                    swampCost: 10,

                    roomCallback: (roomName) => {
                        return this.costFor(roomName, undefined);
                    },
                }
            }
        }
        return PathingOptions._optimalFinder.options;
    }

    private costFor(roomName: string, existing: CostMatrix | undefined): CostMatrix {
        if (PathingOptions._matrix
            && PathingOptions._matrix.tick === Game.time
            && PathingOptions._matrix.cost?.hasOwnProperty(roomName)) {
            return PathingOptions._matrix.cost[roomName]
        }

        // Calculate new for current tick
        const costs = existing ?? new PathFinder.CostMatrix;

        // PathFinder supports searches which span multiple rooms : also rooms you are not already in
        const room = Game.rooms[roomName];
        if (!room) return costs;

        room.find(FIND_STRUCTURES).forEach(function (struct) {
            if (struct.structureType === STRUCTURE_ROAD) {
                // Favor roads over plain tiles
                costs.set(struct.pos.x, struct.pos.y, 1);
            } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                (struct.structureType !== STRUCTURE_RAMPART ||
                    !struct.my)) {
                // Can't walk through non-walkable buildings
                costs.set(struct.pos.x, struct.pos.y, 0xff);
            }
        });

        // Avoid creeps in the room
        room.find(FIND_CREEPS).forEach(function (creep) {
            costs.set(creep.pos.x, creep.pos.y, 0xff);
        });

        return costs;
    }

}

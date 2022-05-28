import { singleton } from "tsyringe";
import { Pathing } from "./pathing";

@singleton()
export class PathingOptions {

    private static _optimal: { tick: number, options: PathFinderOpts } | undefined = undefined;

    public optimal(): PathFinderOpts {
        if (PathingOptions._optimal == undefined || PathingOptions._optimal.tick < Game.time) {
            PathingOptions._optimal =
            {
                tick: Game.time,
                options: {
                    // We need to set the defaults costs higher so that we
                    // can set the road cost lower in `roomCallback`
                    plainCost: 2,
                    swampCost: 10,

                    roomCallback: (roomName) => {

                        let room = Game.rooms[roomName];
                        // In this example `room` will always exist, but since
                        // PathFinder supports searches which span multiple rooms
                        // you should be careful!
                        if (!room) return false;
                        let costs = new PathFinder.CostMatrix;

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
                    },
                }
            }
        }
        return PathingOptions._optimal.options;
    }

}

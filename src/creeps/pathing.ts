import { injectable } from "tsyringe";

@injectable()
export class Pathing {

    public moveToClosest<T extends RoomObject>(creep: Creep, objects: T[]) {

        const options: PathFinderOpts = {
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
        };

        const paths =
            objects.map(obj => {
                return {
                    'loc': obj.pos,
                    'pathing': PathFinder.search(creep.pos, { pos: obj.pos, range: 1 }, options),
                    // 'length': creep.room.findPath(creep.pos, obj.pos).length
                }
            });

        // paths.forEach(i => console.log(`loc: ${i.loc}, length: ${i.length}`));

        const closest = paths
            //.sort((a,b) => a.path.cost - b.path.cost)
            .sort((a, b) => a.pathing.cost - b.pathing.cost)
            .find(i => i != undefined);

        //console.log(`closest: ${closest?.loc}, length: ${closest?.length}`)


        if (closest && closest.pathing?.path?.length > 0) {
            const pos = closest.pathing.path[0];
            creep.move(creep.pos.getDirectionTo(pos));
            // creep.moveTo(closest.loc, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
}

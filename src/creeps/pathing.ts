import { injectable } from "tsyringe";

@injectable()
export class Pathing {

    public moveToClosest<T extends RoomObject>(creep: Creep, objects: T[]) {

        const closest =
            objects.map(obj => {
                return {
                    'loc': obj.pos,
                    // 'path': PathFinder.search(creep.pos, obj.pos)
                    'path': creep.room.findPath(creep.pos, obj.pos).length
                }
            })
                //.sort((a,b) => a.path.cost - b.path.cost)
                .sort((a, b) => b.path - a.path)
                .find(i => i != undefined);

        if (closest && closest.loc && closest.path) {
            creep.moveTo(closest.loc, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
}

import { injectable } from "tsyringe";

@injectable()
export class Pathing {

    public moveToClosest<T extends RoomObject>(creep: Creep, objects: T[]) {

        const paths =
            objects.map(obj => {
                return {
                    'loc': obj.pos,
                    // 'path': PathFinder.search(creep.pos, obj.pos)
                    'length': creep.room.findPath(creep.pos, obj.pos).length
                }
            });

        // paths.forEach(i => console.log(`loc: ${i.loc}, length: ${i.length}`));

        const closest = paths
            //.sort((a,b) => a.path.cost - b.path.cost)
            .sort((a, b) => a.length - b.length)
            .find(i => i != undefined);

        //console.log(`closest: ${closest?.loc}, length: ${closest?.length}`)


        if (closest && closest.loc && closest.length) {
            creep.moveTo(closest.loc, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
}

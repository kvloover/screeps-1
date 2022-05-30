export class CreepUtils {

    public static tryForFind<K extends FindConstant, S extends FindTypes[K]>(creep: Creep, type: K, action: (loc: S) => number, opts?: FilterOptions<K, S>): boolean {
        const locs = creep.room.find(type, opts);
        return this.tryFor((locs as S[]), action);
        // return loc != undefined;
    }

    public static tryForFindInRoom<K extends FindConstant, S extends FindTypes[K]>(creep: Creep, room: Room, type: K, action: (loc: S) => number, opts?: FilterOptions<K, S>): boolean {
        const locs = room.find(type, opts);
        return this.tryFor((locs as S[]), action);
        // return loc != undefined;
    }

    public static tryFor<K extends FindConstant, S extends FindTypes[K]>(locs: S[], action: (loc: S) => number): boolean {
        return locs.some(loc => action(loc as S) === OK);
    }

}

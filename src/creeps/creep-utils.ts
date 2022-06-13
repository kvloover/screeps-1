export class CreepUtils {

    public static tryFor<K extends FindConstant, S extends FindTypes[K]>(locs: S[], action: (loc: S) => number): boolean {
        return locs.some(loc => action(loc as S) === OK);
    }

}

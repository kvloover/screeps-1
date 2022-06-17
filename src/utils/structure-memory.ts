export const initObjectMemory = (room: RoomMemory, key: StructureConstant | CustomConstant) => {
    if (!room.objects) room.objects = {};
    if (!room.objects.hasOwnProperty(key)) room.objects[key] = [];
}

declare global {

    interface RoomMemory {
        objects?: { [T in StructureConstant | CustomConstant]?: RoomObjectMemory<T>[] }
    }

    interface RoomObjectMemory<T extends StructureConstant | CustomConstant> {
        id: Id<_HasId>;
        pos: RoomPosition;
        type: T;
    }

    interface LinkMemory extends RoomObjectMemory<STRUCTURE_LINK> {
        storage: boolean;
    }

    interface TowerMemory extends RoomObjectMemory<STRUCTURE_TOWER> {
        range: number;
    }

    interface SourceMemory extends RoomObjectMemory<SOURCE> { }
    interface SpawnMemory extends RoomObjectMemory<STRUCTURE_SPAWN> { }

    type SOURCE = "source";
    type CustomConstant = SOURCE;

    // const SOURCE: SOURCE;


}

namespace NodeJS {
    declare const SOURCE: SOURCE;
    interface Global {
    }
}

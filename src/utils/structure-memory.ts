import { ObjectConstant, SOURCE } from "./custom-types";

export const initObjectMemory = (room: RoomMemory, key: StructureConstant | ObjectConstant) => {
    if (!room.objects) room.objects = {};
    if (!room.objects.hasOwnProperty(key)) room.objects[key] = [];
}

declare global {

    // Persistent
    interface RoomMemory {
        objects?: { [T in StructureConstant | ObjectConstant]?: RoomObjectMemory<T>[] }
    }

    interface RoomObjectMemory<T extends StructureConstant | ObjectConstant> {
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

}

// Heap
namespace NodeJS {
    interface Global {
        objects?: { [T in StructureConstant | ObjectConstant]?: RoomRef<T>[] }
    }

    interface RoomRef<T extends StructureConstant | ObjectConstant> {
        id: Id<_HasId>;
        pos: RoomPosition;
        type: T;
        visited: number;
    }
}

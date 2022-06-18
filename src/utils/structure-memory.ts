import { ObjectConstant, SOURCE } from "./custom-types";

export const initObjectMemory = (room: RoomMemory, key: StructureConstant | ObjectConstant) => {
    if (!room.objects) room.objects = {};
    if (!room.objects.hasOwnProperty(key)) room.objects[key] = [];
}

export const initHeapMemory = (roomName: string, key?: StructureConstant | ObjectConstant) => {
    if (!global.refs) global.refs = {};

    if (!global.refs.hasOwnProperty(roomName)) {
        global.refs[roomName] = { name: roomName, objects: {} }
        return true;
    } else {
        if (key) {
            const roomRef = global.refs[roomName];
            if (roomRef && roomRef.objects && !roomRef.objects?.hasOwnProperty(key)) {
                roomRef.objects[key] = [];
            }
        }
        return false;
    }
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

    // Heap
    namespace NodeJS {
        interface Global {
            refs?: { [key: string]: RoomRef };
        }
    }

    interface RoomRef {
        name: string;
        objects?: { [T in StructureConstant | ObjectConstant]?: ObjectRef<T>[] };
    }

    interface ObjectRef<T extends StructureConstant | ObjectConstant> {
        id: Id<_HasId>;
        pos: RoomPosition;
        type: T;
        visited: number;
    }
}

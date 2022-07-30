import { Task } from "repos/tasks/task";
import { ObjectConstant, SOURCE } from "../../utils/custom-types";

export const initObjectMemory = (room: RoomMemory, key: StructureConstant | ObjectConstant) => {
    if (!room.objects) room.objects = {};
    if (!room.objects.hasOwnProperty(key)) room.objects[key] = [];
}

export const initConstructionMemory = (room: RoomMemory, key: BuildableStructureConstant) => {
    if (!room.constructions) room.constructions = {};
    if (!room.constructions.hasOwnProperty(key)) room.constructions[key] = [];
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

export const bodyFromMap =
    (body: BodyMap): BodyPartConstant[] => {
        return _.flatten(Object.entries(body)
            .map(([key, value]) => _.times(value, _ => key as BodyPartConstant)));
    }

declare global {

    // Persistent
    interface RoomMemory {
        objects?: RoomObjectMap;
        constructions?: RoomConstructionMap;
        spawn?: SpawnQueue;
    }

    type RoomConstructionMap = RoomObjectMemoryMap<BuildableStructureConstant>;
    type RoomObjectMap = RoomObjectMemoryMap<StructureConstant | ObjectConstant>;
    type RoomObjectMemoryMap<C extends StructureConstant | ObjectConstant> = { [T in C]?: RoomObjectMemory<T>[] }

    interface RoomObjectMemory<T extends StructureConstant | ObjectConstant> {
        id: Id<_HasId>;
        pos: RoomPosition;
        type: T;
    }

    interface LinkMemory extends RoomObjectMemory<STRUCTURE_LINK> {
        storage: boolean;
        supply: boolean;
    }

    interface TowerMemory extends RoomObjectMemory<STRUCTURE_TOWER> {
        range: number;
        tasks: { [key: string]: TowerTask | undefined };
        // tasks_blacklist: { [key: string]: string[] }; // ignore specific requesters for the given type
    }

    interface TowerTask {
        repo: string;
        key: string,
        tick: number;
        amount?: number;
        task: Task;
        range: number;
        perAction: number;
    }

    interface SourceMemory extends RoomObjectMemory<SOURCE> { positions: number }
    interface SpawnMemory extends RoomObjectMemory<STRUCTURE_SPAWN> { }

    interface SpawnQueue {
        spawning: { [key: string]: SpawnInfo | undefined }; // spawn - spawning
        immediate: SpawnInfo[];
        urgent: SpawnInfo[];
        normal: SpawnInfo[];
        low: SpawnInfo[];
    }

    interface SpawnInfo {
        objective?: string;
        role: string;
        body: BodyInfo;
        initial: Partial<CreepMemory>;
    }

    interface BodyInfo {
        fixed?: BodyMap[];
        dynamic?: BodyMap;
        trail?: BodyMap;
    }

    type BodyMap = {
        [T in BodyPartConstant]?: number
    }

    // Heap
    namespace NodeJS {
        interface Global {
            refs?: { [key: string]: RoomRef };
        }
    }

    interface RoomRef {
        name: string;
        objects?: ObjectRefMap;
    }

    type ObjectRefMap = {
        [T in StructureConstant | ObjectConstant]?: ObjectRef<T>[]
    }

    interface ObjectRef<T extends StructureConstant | ObjectConstant> {
        id: Id<_HasId>;
        pos: RoomPosition;
        type: T;
        visited: number;
    }
}

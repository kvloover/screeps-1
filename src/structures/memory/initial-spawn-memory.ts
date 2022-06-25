import { singleton } from "tsyringe";
import { InitialMemory } from "./initial-struct-memory";

@singleton()
export class InitialSpawnMemory implements InitialMemory<STRUCTURE_SPAWN> {

    public type = STRUCTURE_SPAWN;

    public create(room: Room, structure: Structure<STRUCTURE_SPAWN>): RoomObjectMemory<STRUCTURE_SPAWN> {
        return <SpawnMemory>{
            id: structure.id,
            pos: structure.pos,
            type: STRUCTURE_SPAWN
        }
    }

}

import { singleton } from "tsyringe";
import { InitialMemory } from "./initial-struct-memory";

@singleton()
export class InitialTowerMemory implements InitialMemory<STRUCTURE_TOWER> {

    public type = STRUCTURE_TOWER;

    public create(room: Room, structure: Structure<STRUCTURE_TOWER>): RoomObjectMemory<STRUCTURE_TOWER> {
        return <TowerMemory>{
            id: structure.id,
            pos: structure.pos,
            type: STRUCTURE_TOWER,
            range: 20,
            tasks: {},
        }
    }

}

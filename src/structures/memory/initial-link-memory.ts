import { singleton } from "tsyringe";
import { InitialMemory } from "./initial-struct-memory";

@singleton()
export class InitialLinkMemory implements InitialMemory<STRUCTURE_LINK> {

    public type = STRUCTURE_LINK;

    public create(room: Room, structure: Structure<STRUCTURE_LINK>): RoomObjectMemory<STRUCTURE_LINK> {
        const refs = global.refs && global.refs[room.name] ? global.refs[room.name].objects : undefined;

        const storages = refs?.storage
        const storage = storages && storages.length > 0 ? storages[0] : undefined;
        const controller = room.controller;

        const nearStorage = storage ? structure.pos.getRangeTo(storage.pos) < 5 : false;
        const nearController = controller ? structure.pos.getRangeTo(controller.pos) < 3 : false;

        return <LinkMemory>{
            id: structure.id,
            pos: structure.pos,
            type: STRUCTURE_LINK,
            storage: nearStorage,
            supply: nearController,
        }
    }

}

import { singleton } from "tsyringe";
import { OnCreate } from "./on-structure-create";

@singleton()
export class OnStorageCreate implements OnCreate<STRUCTURE_STORAGE> {

    public type = STRUCTURE_STORAGE;

    public onCreate(room: Room, structure: Structure<STRUCTURE_STORAGE>): void {
        console.log(`on storage create ${room.name}`)

        const refs = global.refs && global.refs[room.name] ? global.refs[room.name].objects : undefined;
        const links = refs?.link;

        if (links && links.length > 0) {
            links.forEach(l => {
                const mem = room.memory.objects?.link?.find(i => i.id == l.id) as LinkMemory;
                if (mem) {
                    mem.storage = structure.pos.getRangeTo(l.pos) < 5;
                }
            });
        }
    }
}

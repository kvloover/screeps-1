import { Persistency, Persistent } from "repos/persistent";
import { container } from "tsyringe";

export class GarbageCollector {

    public static gc(): void {
        // Clear up persistent repos for artifacts
        const persistent = container.resolveAll<Persistent>(Persistency.token);
        persistent.forEach(p => p.gc());

        Object.keys(Memory.rooms)
            .forEach(name => this.gcRoom(name));
    }

    public static gcRoom(name: string): void {
        if (Game.rooms.hasOwnProperty(name)) {
            // leave GC of invisible rooms for now => need to leave sources
            const refs = Memory.rooms[name].objects;
            if (refs) {
                Object.entries(refs).forEach(([key, value]) => {
                    const removeIds: Id<_HasId>[] = [];
                    value.forEach(v => {
                        if (!Game.getObjectById(v.id)) {
                            removeIds.push(v.id);
                        }
                    })
                    _.remove(
                        value as RoomObjectMemory<BuildableStructureConstant>[],
                        i => removeIds.some(r => r == i.id));
                });
            }
            const globalRefs = global.refs?.[name]?.objects;
            if (globalRefs) {
                Object.entries(globalRefs).forEach(([key, value]) => {
                    const removeIds: Id<_HasId>[] = [];
                    value.forEach(v => {
                        if (!Game.getObjectById(v.id)) {
                            removeIds.push(v.id);
                        }
                    })
                    _.remove(
                        value as ObjectRef<StructureConstant>[],
                        i => removeIds.some(r => r == i.id));
                });
            }
        }
    }

}

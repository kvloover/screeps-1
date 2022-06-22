import { singleton } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";
import { isLinkStructure, isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";
import { initObjectMemory } from "utils/structure-memory";

@singleton()
export class LinkManager implements Manager {

    constructor(private log: Logger) { }

    public run(room: Room): void {
        if (!isMyRoom(room))
            return;

        const links = room.memory.objects?.link;

        if (links && links.length > 0) {

            const dest = links.filter(i => (i as LinkMemory)?.storage ?? false);
            const srces = links.filter(i => !(i as LinkMemory)?.storage ?? false);

            if (dest.length > 0) {
                const destLink = Game.getObjectById(dest[0].id);
                if (isLinkStructure(destLink)) {
                    srces.forEach(src => {
                        const srcLink = Game.getObjectById(src.id);
                        if (isLinkStructure(srcLink)) {
                            if (srcLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0.25 * srcLink.store.getCapacity(RESOURCE_ENERGY)
                                && destLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0.25 * destLink.store.getCapacity(RESOURCE_ENERGY)) {
                                srcLink.transferEnergy(destLink,
                                    Math.min(destLink.store.getFreeCapacity(RESOURCE_ENERGY), srcLink.store.getUsedCapacity(RESOURCE_ENERGY)));
                            }
                        }
                    });
                }
            }

        }
    }

    public static init(room: Room): void {
        initObjectMemory(room.memory, STRUCTURE_LINK);
        if (room.memory.objects) room.memory.objects[STRUCTURE_LINK] = [];  // reset if already present

        const storages = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_STORAGE })
        const storage = storages.length > 0 ? storages[0] : undefined;

        room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_LINK })
            .forEach(l => {
                const nearStorage = storage ? storage.pos.getRangeTo(l.pos) < 5 : false;
                room.memory.objects?.link?.push(<LinkMemory>{ id: l.id, pos: l.pos, storage: nearStorage, type: STRUCTURE_LINK })
            });
    }
}

profiler.registerClass(LinkManager, 'LinkManager');

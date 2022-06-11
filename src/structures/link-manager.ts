import { injectable } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";

import profiler from "screeps-profiler";
import { isLinkStructure } from "utils/utils";

@injectable()
export class LinkManager implements Manager {

    constructor(private log: Logger) { }

    public run(room: Room): void {

        const links = room.memory.links;

        if (links && links.length > 0) {

            const dest = links.filter(i => i.storage);
            const srces = links.filter(i => !i.storage);

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
        room.memory.links = [];

        const storages = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_STORAGE })
        const storage = storages.length > 0 ? storages[0] : undefined;

        room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_LINK })
            .forEach(l => {
                const nearStorage = storage ? storage.pos.getRangeTo(l.pos) < 5 : false;
                room.memory.links.push({ id: l.id, pos: l.pos, storage: nearStorage })
            });
    }
}

profiler.registerClass(LinkManager, 'LinkManager');

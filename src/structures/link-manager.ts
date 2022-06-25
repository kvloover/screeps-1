import { singleton } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";
import { isLinkStructure, isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";
import { initObjectMemory } from "structures/memory/structure-memory";

@singleton()
export class LinkManager implements Manager {

    constructor(private log: Logger) { }

    public run(room: Room): void {
        if (!isMyRoom(room))
            return;

        const links = room.memory.objects?.link;

        if (links && links.length > 0) {

            const destStorage: LinkMemory[] = [];
            const destSupply: LinkMemory[] = [];
            const srces: LinkMemory[] = [];

            links.forEach(i => {
                const link = i as LinkMemory
                if (link) {
                    if (link.supply) { destSupply.push(link); }
                    else if (link.storage) { destStorage.push(link); }
                    else { srces.push(link); }
                }
            });

            if (destStorage.length > 0 || destSupply.length > 0) {

                const fifoLinks: { link: StructureLink, energy: number }[] = []
                const srcLinks: { link: StructureLink, energy: number }[] = []

                destSupply.forEach(supply => {
                    const link = Game.getObjectById(supply.id);
                    if (isLinkStructure(link) && link.store.getUsedCapacity(RESOURCE_ENERGY) < 800) {
                        fifoLinks.push({ link: link, energy: 800 - link.store.getUsedCapacity(RESOURCE_ENERGY) })
                    }
                });

                destStorage.forEach(supply => {
                    const link = Game.getObjectById(supply.id);
                    if (isLinkStructure(link) && link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        fifoLinks.push({ link: link, energy: link.store.getFreeCapacity(RESOURCE_ENERGY) })
                    }
                });

                srces.forEach(supply => {
                    const link = Game.getObjectById(supply.id);
                    if (isLinkStructure(link) && link.store.getUsedCapacity(RESOURCE_ENERGY) > 0.25 * link.store.getCapacity(RESOURCE_ENERGY)) {
                        srcLinks.push({ link: link, energy: link.store.getUsedCapacity(RESOURCE_ENERGY) })
                    }
                });

                if (srcLinks.length > 0) {
                    let iDest = 0;
                    let jSrc = 0;
                    while (iDest < fifoLinks.length) {
                        const fifo = fifoLinks[iDest];
                        const src = srcLinks[jSrc];

                        if (fifo && src) {
                            const energy = Math.min(fifo.energy, src.energy);
                            src.link.transferEnergy(fifo.link, energy);
                            if (energy == fifo.energy) { iDest++; } else { fifo.energy -= energy; }
                            if (energy == src.energy) { jSrc++; } else { src.energy -= energy; }
                        }

                        if (jSrc >= srcLinks.length) break;
                    }
                }
            }

        }
    }

    public static init(room: Room): void {
        initObjectMemory(room.memory, STRUCTURE_LINK);
        if (room.memory.objects) room.memory.objects[STRUCTURE_LINK] = [];  // reset if already present

        const storages = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_STORAGE })
        const storage = storages.length > 0 ? storages[0] : undefined;
        const controller = room.controller;

        room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType == STRUCTURE_LINK })
            .forEach(l => {
                const nearStorage = storage ? l.pos.getRangeTo(storage.pos) < 5 : false;
                const nearController = controller ? l.pos.getRangeTo(controller.pos) < 3 : false;
                room.memory.objects?.link?.push(<LinkMemory>{
                    id: l.id,
                    pos: l.pos,
                    storage: nearStorage,
                    supply: nearController,
                    type: STRUCTURE_LINK
                })
            });
    }
}

profiler.registerClass(LinkManager, 'LinkManager');

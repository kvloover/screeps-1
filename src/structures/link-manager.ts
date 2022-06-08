import { injectable } from "tsyringe";

import { Manager } from "manager";
import { Logger } from "logger";

import profiler from "screeps-profiler";

@injectable()
export class LinkManager implements Manager {

    constructor(private log: Logger) { }

    public run(room: Room): void {

        // TODO rewrite
        const links = room.find<StructureLink>(FIND_MY_STRUCTURES,
            { filter: (struct) => struct.structureType == STRUCTURE_LINK });

        const sources = room.find(FIND_SOURCES);

        // this.log.Information(`${towers.length} towers found in room ${room.name}`);
        if (sources.length > 0 && links.length >= 2) {
            const inputs = links.filter(i => sources.some(s => s.pos.getRangeTo(i.pos) < 5))

            if (inputs.length > 0) {
                const src = inputs[0];
                const dest = links.filter(i => i.id !== src.id)[0];
                if (src.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && dest.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    src.transferEnergy(dest);
                }
            }
        }

    }
}

profiler.registerClass(LinkManager, 'LinkManager');

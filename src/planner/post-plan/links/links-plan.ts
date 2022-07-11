import { singleton } from 'tsyringe';

import { BUILDING_MAP, IPostPlan, PostPlanCreateFn, PlannedStructure, PostPlanKey } from '../../plan';

@singleton()
export class LinksPlan implements IPostPlan {
    name: PostPlanKey = 'links';

    constructor() { }

    create: PostPlanCreateFn = (roomName, poi, terrain, planned: PlannedStructure[][]): PlannedStructure[][] => {
        const structures: PlannedStructure[][] = [];
        const visual = new RoomVisual(roomName);

        if (planned.length == 0) { return structures; }

        for (let source of poi['source'] || []) {
            structures.push(this.placeLinkAndRampart(roomName, source, terrain, visual));
        }

        for (let controller of poi['controller'] || []) {
            structures.push(this.placeLinkAndRampart(roomName, controller, terrain, visual));
        }

        return structures;
    }

    private placeLinkAndRampart(roomName: string, loc: RoomPosition, terrain: CostMatrix, visual: RoomVisual): PlannedStructure[] {
        const structures: PlannedStructure[] = [];

        const roadValue = BUILDING_MAP.get(STRUCTURE_ROAD) || 254;

        let endpoint: RoomPosition | undefined = undefined
        for (let x = loc.x - 1; x <= loc.x + 1; x++) {
            for (let y = loc.y - 1; y <= loc.y + 1; y++) {
                // if road plan rampart
                const locValue = terrain.get(x, y);
                if (locValue == roadValue) {

                    const pos = new RoomPosition(x, y, roomName);
                    visual.structure(x, y, STRUCTURE_RAMPART, { opacity: 0.5 });
                    structures.push({ plan: this.name, type: STRUCTURE_RAMPART, pos: pos });
                    endpoint = pos;
                    break;
                }
            }
            if (endpoint) { break; }
        }

        if (endpoint) {
            let placedLink = false;
            for (let x = endpoint.x - 1; x <= endpoint.x + 1; x++) {
                for (let y = endpoint.y - 1; y <= endpoint.y + 1; y++) {
                    // check terrain, if not wall and not yet placed link, place link
                    const locValue = terrain.get(x, y);
                    if ((locValue < 200 || locValue == 250) && !placedLink) { // 250 is reserved around loc
                        placedLink = true;

                        visual.structure(x, y, STRUCTURE_LINK, { opacity: 0.5 });
                        terrain.set(x, y, BUILDING_MAP.get(STRUCTURE_LINK) || 254);
                        structures.push({ plan: this.name, type: STRUCTURE_LINK, pos: new RoomPosition(x, y, roomName) });

                        visual.structure(x, y, STRUCTURE_RAMPART, { opacity: 0.5 });
                        structures.push({ plan: this.name, type: STRUCTURE_RAMPART, pos: new RoomPosition(x, y, roomName) });

                    }
                }
            }
        }

        return structures;
    }
}

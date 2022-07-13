import { singleton } from 'tsyringe';

import { IPostPlan, PostPlanCreateFn, StructurePlan, PostPlanKey } from '../../entities/plan';
import { BUILDING_MAP } from '../../util/constants';

@singleton()
export class ContainersPlan implements IPostPlan {
    name: PostPlanKey = 'containers';

    constructor() { }

    create: PostPlanCreateFn = (roomName, poi, terrain, planned: StructurePlan[][]): StructurePlan[][] => {
        const structures: StructurePlan[][] = [];
        const visual = new RoomVisual(roomName);

        if (planned.length == 0) { return structures; }

        for (let source of poi['source'] || []) {
            structures.push(this.placeStructure(roomName, source, terrain, visual));
        }

        return structures;
    }

    private placeStructure(roomName: string, loc: RoomPosition, terrain: CostMatrix, visual: RoomVisual): StructurePlan[] {
        const structures: StructurePlan[] = [];

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
            visual.structure(endpoint.x, endpoint.y, STRUCTURE_CONTAINER, { opacity: 0.5 });
            terrain.set(endpoint.x, endpoint.y, BUILDING_MAP.get(STRUCTURE_CONTAINER) || 254);
            structures.push({ plan: this.name, type: STRUCTURE_CONTAINER, pos: new RoomPosition(endpoint.x, endpoint.y, roomName) });
        }

        return structures;
    }
}

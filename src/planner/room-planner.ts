import { injectAll, singleton } from "tsyringe";
import { SOURCE } from "utils/custom-types";
import { IPlan, IPostPlan, Poi, StructurePlan } from "./plan";
import { PlanConverter } from "./plan-converter";
import { Plans } from "./plan-service";
import { VisualWrapper } from "./visual-wrapper";

@singleton()
export class RoomPlanner {

    constructor(
        private visualWrapper: VisualWrapper,
        @injectAll(Plans.plan) private plans: IPlan[],
        @injectAll(Plans.postPlan) private postPlans: IPostPlan[]
    ) { }

    public getRoomCostMatrix(roomName: string, poi: Poi): CostMatrix {
        const costs = new PathFinder.CostMatrix();
        const terrain = Game.map.getRoomTerrain(roomName);
        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                const terrainType = terrain.get(x, y);
                if (terrainType == TERRAIN_MASK_WALL) {
                    costs.set(x, y, 0xff);
                } else {
                    costs.set(x, y, -1);
                }
            }
        }

        // add squares around source locations to terainMatrix as value 255 - cost of unwalkable terrain
        if (!('source' in poi) || !('controller' in poi)) return costs;
        const locs = poi['source']?.concat(poi['controller'] || []) || [];
        for (let loc of locs) {
            for (let x = loc.x - 1; x <= loc.x + 1; x++) {
                for (let y = loc.y - 1; y <= loc.y + 1; y++) {
                    if (costs.get(x, y) < 255) {
                        costs.set(x, y, 250);
                    }
                }
            }
        }

        return costs;
    }

    public planRoom(roomName: string): void {
        // todo determine algorithm on type of stamp
        // symmetric manhattan
        // asymmetric chebyshev

        if (!(roomName in Memory.rooms)) return;

        const sources = Memory.rooms[roomName].objects?.[SOURCE];
        const controller = global.refs?.[roomName]?.objects?.[STRUCTURE_CONTROLLER];
        if (!controller || !sources) return;
        if (controller.length == 0 || sources.length == 0) return;

        const poi: Poi = {};
        poi['source'] = sources.map(s => s.pos);
        poi['controller'] = [controller[0].pos];

        const terrain = this.getRoomCostMatrix(roomName, poi);
        const sorted = this.plans.sort((a, b) => this.planSequence(a.name) - this.planSequence(b.name));
        const sortedPost = this.postPlans.sort((a, b) => this.postPlanSequence(a.name) - this.postPlanSequence(b.name));

        let planned: StructurePlan[][] = [];
        for (let plan of sorted) {
            planned = planned.concat(
                this.visualWrapper.WrapVisual(roomName, plan.name, () => plan.create(roomName, poi, terrain))()
            );
        }
        for (let plan of sortedPost) {
            planned = planned.concat(
                this.visualWrapper.WrapVisual(roomName, plan.name, () => plan.create(roomName, poi, terrain, planned))()
            );
        }

        console.log(`${JSON.stringify(PlanConverter.convert(planned), null, "\t")}`);
    }

    private planSequence(name: string): number {
        switch (name) {
            case 'core': return 0;
            case 'labs': return 1;
            case 'extensions': return 2;
            default: return 99;
        }
    }

    private postPlanSequence(name: string): number {
        switch (name) {
            case 'perimeter': return 0;
            default: return 99;
        }
    }

}

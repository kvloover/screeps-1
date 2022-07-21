import { injectAll, singleton } from "tsyringe";
import { Plans } from "./ioc/plan-service";
import { IPlan, IPostPlan, PlanKey, Poi, PostPlanKey, StructurePlan } from "./entities/plan";
import { ExecutablePlan } from "./entities/executable-plan";
import { SOURCE } from "utils/custom-types";
import { PlanConverter } from "./util/plan-converter";
import { VisualWrapper } from "./util/visual-wrapper";
import { getRoomCostMatrix } from "./util/room-cost-matrix";
import { RESERVED_LOCATION } from "./util/constants";

@singleton()
export class RoomPlanner {

    constructor(
        private visualWrapper: VisualWrapper,
        @injectAll(Plans.plan) private plans: IPlan[],
        @injectAll(Plans.postPlan) private postPlans: IPostPlan[]
    ) { }


    private getCostMatrix(roomName: string, poi: Poi): CostMatrix {
        const costs = getRoomCostMatrix(roomName);
        // add squares around source locations to terainMatrix as value 255 - cost of unwalkable terrain
        if (!('source' in poi) || !('controller' in poi)) return costs;
        const locs = poi['source']?.concat(poi['controller'] || []) || [];
        for (let loc of locs) {
            for (let x = loc.x - 1; x <= loc.x + 1; x++) {
                for (let y = loc.y - 1; y <= loc.y + 1; y++) {
                    if (costs.get(x, y) < 255) {
                        costs.set(x, y, RESERVED_LOCATION);
                    }
                }
            }
        }
        return costs;
    }

    public planRoom(roomName: string, visualize: boolean = false): ExecutablePlan | undefined {
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

        const terrain = this.getCostMatrix(roomName, poi);
        const sorted = this.plans.sort((a, b) => this.planSequence(a.name) - this.planSequence(b.name));
        const sortedPost = this.postPlans.sort((a, b) => this.postPlanSequence(a.name) - this.postPlanSequence(b.name));

        let planned: StructurePlan[][] = [];
        for (let plan of sorted) {
            const fn = () => plan.create(roomName, poi, terrain);
            planned = planned.concat(
                visualize ? this.visualWrapper.WrapVisual(roomName, plan.name, fn)() : fn()
            );
        }
        for (let plan of sortedPost) {
            const fn = () => plan.create(roomName, poi, terrain, planned);
            planned = planned.concat(
                visualize ? this.visualWrapper.WrapVisual(roomName, plan.name, fn)() : fn()
            );
        }

        if (visualize) { new RoomVisual(roomName).costMatrix(terrain); }

        if (planned.length == 0)
            return;
        else
            return PlanConverter.convert(planned);
    }

    private planSequence(name: PlanKey): number {
        switch (name) {
            case 'core': return 0;
            case 'lab': return 1;
            case 'extensions': return 2;
            default: return 99;
        }
    }

    private postPlanSequence(name: PostPlanKey): number {
        switch (name) {
            case 'perimeter': return 0;
            default: return 99;
        }
    }

}

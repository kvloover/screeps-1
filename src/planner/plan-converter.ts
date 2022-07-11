import { STRUCTURE_BUDGET } from "./budget";
import { ExecutablePlan, PlanSummary, RclPlan } from "./executable-plan";
import { StructurePlan } from "./plan";
import { PlannedStructure } from "./planned-structure";

export class PlanConverter {

    public static convert(plan: StructurePlan[][]): ExecutablePlan {

        // for each stamp of plan
        // for each structure of stamp add to main summary count and find RCL required given the summary count
        // add new PlannedStructure from structure to ExecutablePlan for that RCL and increase rcl summary within rclPlan
        // keep lowest RCL for stamp
        // if RCL 0 : keep for processing after entire stamp and add to lowest RCL of stamp

        const summary: PlanSummary = {};
        const planRcl: { [key: number]: RclPlan } = {};
        const rcls = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        for (const rcl of rcls) {
            planRcl[rcl] = {
                rcl,
                summary: {},
                structures: []
            };
        }

        for (const stamp of plan) {
            const postProcess: StructurePlan[] = [];
            let lowestRcl = 8;
            for (const structure of stamp) {
                const count = (summary[structure.type] || 0) + 1;
                summary[structure.type] = count;
                const rcl = PlanConverter.getRclRequired(structure.type, count);

                if (rcl === -1) {
                    continue;
                } else if (rcl === 0) {
                    postProcess.push(structure);
                } else {
                    lowestRcl = Math.min(lowestRcl, rcl);
                    const rclPlan = planRcl[rcl];

                    rclPlan.summary[structure.type] = (rclPlan.summary[structure.type] || 0) + 1;
                    rclPlan.structures.push(new PlannedStructure(structure.pos, structure.type));
                }
            }

            for (const structure of postProcess) {
                const rclPlan = planRcl[lowestRcl];
                rclPlan.summary[structure.type] = (rclPlan.summary[structure.type] || 0) + 1;
                rclPlan.structures.push(new PlannedStructure(structure.pos, structure.type));
            }
        }

        return { summary, plan: planRcl };
    }

    public static getRclRequired(structure: BuildableStructureConstant, count: number): number {
        const budget = STRUCTURE_BUDGET[structure];
        if (budget === undefined) { return -1; }

        const entries = Object.entries(budget)
            .map(([rcl, count]) => [parseInt(rcl), count])
            .sort((a, b) => a[0] - b[0]);

        for (const pair of entries) {
            const rcl = pair[0];
            const limit = pair[1];
            if (limit < 0 || count <= limit) {
                return rcl;
            }
        }

        return -1;
    }

}

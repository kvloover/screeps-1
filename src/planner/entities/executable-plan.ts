import { PlannedStructure } from "./planned-structure";

export type ExecutablePlan = {
    summary: PlanSummary;
    plan: { [key: number]: RclPlan; };
};

export interface RclPlan {
    rcl: number;
    summary: PlanSummary;
    structures: PlannedStructure[];
}
export type PlanSummary = {
    [typ in BuildableStructureConstant]?: number;
}

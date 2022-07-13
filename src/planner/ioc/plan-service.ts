import { registry } from "tsyringe";

import { CorePlan } from "planner/plan/core/core-plan";
import { ExtensionsPlan } from "planner/plan/extensions/extensions-plan";
import { LabPlan } from "planner/plan/lab/lab-plan";
import { LinksPlan } from "planner/post-plan/links/links-plan";
import { PerimeterPlan } from "planner/post-plan/perimeter/perimeter-plan";
import { RoadPlan } from "planner/plan/road/road-plan";
import { ContainersPlan } from "planner/post-plan/containers/containers-plan";

@registry([
    { token: Plans.plan, useToken: CorePlan },
    { token: Plans.plan, useToken: ExtensionsPlan },
    { token: Plans.plan, useToken: RoadPlan },
    { token: Plans.plan, useToken: LabPlan },
    { token: Plans.postPlan, useToken: PerimeterPlan },
    { token: Plans.postPlan, useToken: LinksPlan },
    { token: Plans.postPlan, useToken: ContainersPlan },
])
export abstract class Plans {
    static readonly plan = Symbol('Plan');
    static readonly postPlan = Symbol('PostPlan');
}

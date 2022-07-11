import { registry } from "tsyringe";
import { CorePlan } from "./plan/core/core-plan";
import { ExtensionsPlan } from "./plan/extensions/extensions-plan";
import { LabPlan } from "./plan/lab/lab-plan";
import { LinksPlan } from "./post-plan/links/links-plan";
import { PerimeterPlan } from "./post-plan/perimeter/perimeter-plan";
import { RoadPlan } from "./plan/road/road-plan";

@registry([
    { token: Plans.plan, useToken: CorePlan },
    { token: Plans.plan, useToken: ExtensionsPlan },
    { token: Plans.plan, useToken: RoadPlan },
    { token: Plans.plan, useToken: LabPlan },
    { token: Plans.postPlan, useToken: PerimeterPlan },
    { token: Plans.postPlan, useToken: LinksPlan },
])
export abstract class Plans {
    static readonly plan = Symbol('Plan');
    static readonly postPlan = Symbol('PostPlan');
}

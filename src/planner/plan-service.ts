import { registry } from "tsyringe";
import { CorePlan } from "./core/core-plan";
import { ExtensionsPlan } from "./extensions/extensions-plan";
import { LabPlan } from "./lab/lab-plan";
import { LinksPlan } from "./links/links-plan";
import { PerimeterPlan } from "./perimeter/perimeter-plan";
import { RoadPlan } from "./roads/road-plan";

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

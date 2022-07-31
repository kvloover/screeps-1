import { registry } from "tsyringe";
import { ConquerHandler } from "./handlers/conquer/conquer-handler";
import { HarvestHandler } from "./handlers/harvest/harvest-handler";
import { RemoteHandler } from "./handlers/remote/remote-handler";
import { ScoutHandler } from "./handlers/scout/scout-handler";
import { Rcl2Handler } from "./handlers/upgrade/rcl2-handler";

@registry([
    { token: Handlers.token, useToken: ScoutHandler },
    { token: Handlers.token, useToken: RemoteHandler },
    { token: Handlers.token, useToken: ConquerHandler },
    { token: Handlers.token, useToken: HarvestHandler },
    { token: Handlers.token, useToken: Rcl2Handler },
])
export abstract class Handlers {
    static readonly token = Symbol('Handler');
}

import { registry } from "tsyringe";
import { ConquerHandler } from "./handlers/conquer/conquer-handler";
import { RemoteHandler } from "./handlers/remote/remote-handler";
import { ScoutHandler } from "./handlers/scout/scout-handler";

@registry([
    { token: Handlers.token, useToken: ScoutHandler },
    { token: Handlers.token, useToken: RemoteHandler },
    { token: Handlers.token, useToken: ConquerHandler },
])
export abstract class Handlers {
    static readonly token = Symbol('Handler');
}

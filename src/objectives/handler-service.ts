import { registry } from "tsyringe";
import { RemoteHandler } from "./handlers/remote/remote-handler";
import { ScoutHandler } from "./handlers/scout/scout-handler";

@registry([
    { token: Handlers.token, useToken: ScoutHandler },
    { token: Handlers.token, useToken: RemoteHandler },
])
export abstract class Handlers {
    static readonly token = Symbol('Handler');
}

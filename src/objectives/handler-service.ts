import { registry } from "tsyringe";
import { ScoutHandler } from "./handlers/scout/scout-handler";

@registry([
    { token: Handlers.token, useToken: ScoutHandler },
])
export abstract class Handlers {
    static readonly token = Symbol('Handler');
}

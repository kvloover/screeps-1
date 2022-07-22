import { registry } from "tsyringe";

@registry()
export abstract class Handlers {
    static readonly token = Symbol('Handler');
}

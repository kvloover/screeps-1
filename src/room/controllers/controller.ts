import { registry } from "tsyringe";
import { ContainerController } from "./container-controller";

import { EmergencyController } from "./emergency-controller";
import { SourceController } from "./source-controller";
import { SpawnController } from "./spawn-controller";

export interface Controller {
    monitor(room: Room): void;
}

@registry([
    { token: Controllers.token, useToken: EmergencyController },
    { token: Controllers.token, useToken: SourceController },
    { token: Controllers.token, useToken: SpawnController },
    { token: Controllers.token, useToken: ContainerController },
])
export abstract class Controllers {
    static readonly token = Symbol('Controller');
}

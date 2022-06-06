import { registry } from "tsyringe";
import { ContainerController } from "./container-controller";
import { DropsController } from "./drops-controller";

import { EmergencyController } from "./emergency-controller";
import { LinkController } from "./link-controller";
import { SourceController } from "./source-controller";
import { SpawnController } from "./spawn-controller";
import { StorageController } from "./storage-controller";

export interface Controller {
    monitor(room: Room): void;
}

@registry([
    { token: Controllers.token, useToken: EmergencyController },
    { token: Controllers.token, useToken: SourceController },
    { token: Controllers.token, useToken: SpawnController },
    { token: Controllers.token, useToken: ContainerController },
    { token: Controllers.token, useToken: DropsController },
    { token: Controllers.token, useToken: LinkController },
    { token: Controllers.token, useToken: StorageController },
])
export abstract class Controllers {
    static readonly token = Symbol('Controller');
}

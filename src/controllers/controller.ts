import { registry } from "tsyringe";
import { ConstructionController } from "./construction-controller";
import { ContainerController } from "./container-controller";
import { DropsController } from "./drops-controller";

import { EmergencyController } from "./emergency-controller";
import { EnergyController } from "./energy-controller";
import { LinkController } from "./link-controller";
import { SourceController } from "./source-controller";
import { SpawnController } from "./spawn-controller";
import { StorageController } from "./storage-controller";
import { StructuresController } from "./structure-controller";
import { TerminalController } from "./terminal-controller";
import { TowerController } from "./tower-controller";
import { WorkController } from "./work-controller";

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
    { token: Controllers.token, useToken: TowerController },
    { token: Controllers.token, useToken: ConstructionController },
    { token: Controllers.token, useToken: StructuresController },
    { token: Controllers.token, useToken: TerminalController },
    { token: Controllers.token, useToken: EnergyController },
    { token: Controllers.token, useToken: WorkController },
])
export abstract class Controllers {
    static readonly token = Symbol('Controller');
}

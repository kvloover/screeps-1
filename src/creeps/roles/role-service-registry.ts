// import { registry, DependencyContainer } from "tsyringe";

// import { HarvesterService } from "./harvester/harvester-service";
// import { HaulerService } from "./hauler/hauler-service";

// export interface RoleService {
//     register(cont: DependencyContainer, phase: number, token: symbol): void;
// }

// @registry([
//     { token: RoleServices.token, useToken: HarvesterService },
//     { token: RoleServices.token, useToken: HaulerService },
// ])
// export abstract class RoleServices {
//     static readonly token = Symbol('RoleService');
//     static readonly phases = [1, 2, 3];
//     static tokenPhase = (phase: number) => Symbol(`phase_${phase}`);
// }

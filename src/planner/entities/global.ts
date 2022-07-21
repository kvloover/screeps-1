import { ExecutablePlan } from "./executable-plan"

declare global {
    namespace NodeJS {
        interface Global {
            plans: { [roomName: string]: ExecutablePlan | undefined; }
            roomCostMatrix: { [roomName: string]: CostMatrix | undefined; }
            defense: { [roomName: string]: DefenseOptions | undefined; }
        }
    }
}

export interface DefenseOptions {
    closed: boolean;
    patrolmatrix: CostMatrix | undefined;
    visited: CostMatrix | undefined;
}

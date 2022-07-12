import { ExecutablePlan } from "./executable-plan"

declare global {
    namespace NodeJS {
        interface Global {
            plans: {
                [roomName: string]: ExecutablePlan | undefined
            }
        }
    }
}

export {}

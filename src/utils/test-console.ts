import { Role, Roles } from "creeps/roles/role-registry";
import { container } from "tsyringe";
import { relativeExitTo } from "./utils";

export class TestConsole {

    static init() {
        global.testing = {
            exit: TestConsole.exit,
            exitEst: TestConsole.exitEst,
            injection: TestConsole.injection
        }
    }

    static exit(room: string, target: string): string {
        const cost = countCpu(() => {
            Game.map.findExit(room, target);
        });
        return `exit used: ${cost}`;
    }

    static exitEst(room: string, target: string): string {
        const cost = countCpu(() => {
            relativeExitTo(room, target);
        });
        return `exitEst used: ${cost}`;
    }

    static injection(): string {
        const cost = countCpu(() => {
            const roles = container.resolveAll<Role>(Roles.token);
        });
        return `injection used: ${cost}`;
    }
}

const countCpu = (fn: () => void): number => {
    const cpu = Game.cpu.getUsed();
    fn();
    const post = Game.cpu.getUsed();
    return post - cpu;
}

declare global {
    namespace NodeJS {
        interface Global {
            testing?: TestConsole;
        }

        interface TestConsole {
            exit: (room: string, target: string) => string;
            exitEst: (room: string, target: string) => string;
            injection: () => string;
        }
    }
}

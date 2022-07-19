import { Role, Roles } from "creeps/roles/role-registry";
import { RoomPlanner } from "planner/room-planner";
import { Persistency, Persistent } from "repos/persistent";
import { container } from "tsyringe";
import { relativeExitTo } from "../utils/utils";
import util_mincut, { Rect } from "../utils/mincut";
import { PlanManager } from "planner/plan-manager";
import { RoomManager } from "room";

export class TestConsole {

    static init() {
        global.testing = {
            exit: TestConsole.exit,
            exitEst: TestConsole.exitEst,
            injection: TestConsole.injection,
            memory: TestConsole.memory,
            remove: TestConsole.remove,
            plan: TestConsole.plan,
            mincut: TestConsole.mincut,
            showPlan: TestConsole.showPlan,
            cleanRoom: TestConsole.cleanRoom,
            emptyRoom: TestConsole.emptyRoom
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

    static memory(roomName: string): string {
        if (Memory.rooms.hasOwnProperty(roomName) && Game.rooms.hasOwnProperty(roomName)) {
            const mem = Memory.rooms[roomName];
            const room = Game.rooms[roomName];
            const visual = room.visual;

            if (mem.objects) {
                Object.entries(mem.objects).forEach(([key, val]) => {
                    val.forEach(obj => {
                        visual.rect(obj.pos.x, obj.pos.y, 0.5, 0.5, { stroke: "#ff00ff" });
                    });
                });
            }
            const refs = global.refs ? global.refs[roomName] : undefined;
            if (refs && refs.objects) {
                Object.entries(refs.objects).forEach(([key, val]) => {
                    val.forEach(obj => {
                        visual.circle(obj.pos.x, obj.pos.y, { stroke: "#0000ff" });
                    });
                });
            }

            return `Visualised ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    static remove(id: string): string {
        const repo = container.resolveAll<Persistent>(Persistency.token);
        repo.forEach(r => r.clearReference(id as Id<_HasId>));

        return 'removed'
    }

    static plan(roomName: string): string {
        if (global.visuals) global.visuals[roomName] = {};
        container.resolve(RoomPlanner).planRoom(roomName, true);
        return `Planned ${roomName}.`;
    }

    static mincut(roomName: string, rect: Rect): string {
        util_mincut.GetCutTiles(roomName, [rect], undefined, true, true);
        return `Mincut run for ${roomName}.`;
    }

    static showPlan(roomName: string, rcl: number | undefined = undefined): string {
        if (Game.rooms.hasOwnProperty(roomName)) {
            const room = Game.rooms[roomName];
            container.resolve(PlanManager).showPlan(room, rcl);
            return `room plan shown for ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    static cleanRoom(roomName: string): string {
        if (Game.rooms.hasOwnProperty(roomName)) {
            const room = Game.rooms[roomName];
            container.resolve(PlanManager).cleanPlan(room);
            return `room plan cleaned ${roomName}.`;
        }
        return `Room not known: ${roomName}`
    }

    static emptyRoom(roomName: string): string {
        if (Game.rooms.hasOwnProperty(roomName)) {
            const room = Game.rooms[roomName];
            container.resolve(PlanManager).emptyRoom(room);
            return `room plan emptied ${roomName}.`;
        }
        return `Room not known: ${roomName}`
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
            memory: (room: string) => string;

            remove: (id: string) => string;

            plan: (room: string) => string;
            mincut(roomName: string, rect: Rect): string;
            showPlan: (room: string, rcl: number | undefined) => string;
            cleanRoom: (room: string) => string;
            emptyRoom: (roomName: string) => string;
        }
    }
}

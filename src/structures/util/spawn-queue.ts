import { singleton } from "tsyringe";

import { Logger } from "logger";

@singleton()
export class SpawnQueue {
    constructor(private log: Logger) { }

    public executing(room: string, context: string, info: SpawnInfo): void {
        if (!Memory.rooms[room]) return;
        if (!Memory.rooms[room].spawn)
            Memory.rooms[room].spawn = { spawning: {}, immediate: [], urgent: [], normal: [], low: [] };

        const spawnInfo = Memory.rooms[room].spawn;
        if (spawnInfo) {
            if (!spawnInfo.spawning) { spawnInfo.spawning = {}; }
            spawnInfo.spawning[context] = info;
        }
    }

    public clearExecuting(room: string, context: string): void {
        if (!Memory.rooms[room]?.spawn?.spawning) return;
        const spawnInfo = Memory.rooms[room].spawn;
        if (spawnInfo) {
            spawnInfo.spawning[context] = undefined;
        }
    }

    public push(room: string, queue: QueueKey, info: SpawnInfo): void {
        if (!Memory.rooms[room]) return;
        if (!Memory.rooms[room].spawn)
            Memory.rooms[room].spawn = { spawning: {}, immediate: [], urgent: [], normal: [], low: [] };

        const spawnInfo = Memory.rooms[room].spawn;
        if (spawnInfo) {
            if (!spawnInfo[queue]) { spawnInfo[queue] = []; }
            spawnInfo[queue].push(info);
        }
    }

    public pop(room: string): SpawnInfo | undefined {
        const memory = Memory.rooms[room];
        if (!memory) return;
        if (!memory.spawn) return undefined;

        const queueKeys: QueueKey[] = ['immediate', 'urgent', 'normal', 'low'];
        for (let key of queueKeys) {
            const queue = memory.spawn[key] as SpawnInfo[];
            if (queue && queue.length > 0) {
                return queue.shift();
            }
        }
        return undefined;
    }

    public peek(room: string): SpawnInfo | undefined {
        const memory = Memory.rooms[room];
        if (!memory) return;
        if (!memory.spawn) return undefined;

        const queueKeys: QueueKey[] = ['immediate', 'urgent', 'normal', 'low'];
        for (let key of queueKeys) {
            const queue = memory.spawn[key] as SpawnInfo[];
            if (queue && queue.length > 0) {
                return queue[0];
            }
        }
        return undefined;
    }
}

declare global {
    interface RoomMemory {
        spawn?: SpawnInfoQueue;
    }

    type QueueKey = "immediate" | "urgent" | "normal" | "low";

    type Queue = {
        [key in QueueKey]: SpawnInfo[]
    }

    type SpawnInfoQueue = Queue & {
        spawning: { [key: string]: SpawnInfo | undefined }; // spawn - spawning
        // immediate: SpawnInfo[];
        // urgent: SpawnInfo[];
        // normal: SpawnInfo[];
        // low: SpawnInfo[];
    }

    interface SpawnInfo {
        objective?: string;
        role: string;
        body: BodyInfo;
        initial: Partial<CreepMemory>;
    }

    interface BodyInfo {
        fixed?: BodyMap[];
        dynamic?: BodyMap;
        trail?: BodyMap;
    }

    type BodyMap = {
        [T in BodyPartConstant]?: number
    }

}


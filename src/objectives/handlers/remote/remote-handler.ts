import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { CreepState } from "utils/creep-state";
import { isMyRoom, whoAmI } from "utils/utils";

@singleton()
export class RemoteHandler implements Handler {

    type = 'remote';

    constructor(private log: Logger) { }

    generateObjectives(existing: Objective[]): Objective[] {
        const objectives: Objective[] = [];
        const visited: string[] = [];
        for (let [roomName, room] of Object.entries(Game.rooms)) {
            if (isMyRoom(room)) {
                if ((room.controller?.level || 0) >= 3) {
                    const remote = Memory.rooms[roomName].remote;
                    if (!remote) {
                        const subObjectives = this.stepRoom(roomName, roomName, existing, visited);
                        objectives.push(...subObjectives);
                    } else {
                        // reattach objective
                        if (existing.find(o => (o.data as ObjectiveRemoteData)?.room == remote)) continue;
                        const sources = Memory.rooms[remote].objects?.source?.length || 1; // default to 1 source, should be present due to active remote
                        const data: ObjectiveRemoteData = { started: Game.time, room: remote, sources: sources };
                        const obj = new Objective(roomName, this.type, data);
                        objectives.push(obj);
                        this.log.info(roomName, `re-attached remote objective for ${remote}`);
                    }
                }
            }
        }

        return objectives;
    }

    stepRoom(master: string, roomName: string, existing: Objective[], visited: string[], depth: number = 1): Objective[] {
        const objectives: Objective[] = [];
        // if (depth > 2) return objectives;

        if (!global.scoutData) return objectives; // nothing scouted

        const exits = Game.map.describeExits(roomName);
        if (exits) {

            const allScouted = !Object.values(exits).some(([direction, newRoom]) => !global.scoutData.hasOwnProperty(newRoom));
            if (!allScouted) return objectives; // wait for all scouted

            const sources = (rm: string) => global.scoutData[rm].sources || 0
            const sorted = Object.entries(exits).sort(([a, b], [c, d]) => - sources(b) - sources(d));

            for (let [direction, newRoom] of sorted) {
                if (existing.find(o => (o.data as ObjectiveRemoteData)?.room == newRoom)) continue;
                if (Game.rooms.hasOwnProperty(newRoom) && isMyRoom(Game.rooms[newRoom])) continue;

                const scoutData = global.scoutData[newRoom];
                if (scoutData.lastVisited < Game.time - 200) continue; // only initiate new remote when we know the situation
                if (!scoutData.sources || scoutData.sources == 0) continue;
                if (scoutData.owner) continue;
                if (scoutData.hostilePower > 0) continue;
                if (scoutData.reservation && scoutData.reservation != whoAmI()) continue;

                const data: ObjectiveRemoteData = { started: Game.time, room: newRoom, sources: scoutData.sources };
                const obj = new Objective(master, this.type, data);
                objectives.push(obj);

                visited.push(newRoom);

                this.log.info(master, `adding remote objective for ${newRoom}`);
                return objectives; // early return if remote found
            }
        }

        return objectives;
    }

    handle(obj: Objective): boolean {
        const data = obj.data as ObjectiveRemoteData;
        if (!data) return true; // finished invalid objective
        const roomMem = Memory.rooms[obj.master];
        if (!roomMem) return true; // invalid master room

        // monitor for hostiles
        // if hostiles, cancel remote till next scout

        if (Game.rooms.hasOwnProperty(data.room)) {
            const room = Game.rooms[data.room];
            const hostilePower = room.find(FIND_HOSTILE_CREEPS).reduce((s, c) =>
                c.getActiveBodyparts(ATTACK)
                + c.getActiveBodyparts(RANGED_ATTACK)
                + c.getActiveBodyparts(HEAL), 0);

            const friendlyPower = room.find(FIND_MY_CREEPS).reduce((s, c) =>
                c.getActiveBodyparts(ATTACK)
                + c.getActiveBodyparts(RANGED_ATTACK)
                + c.getActiveBodyparts(HEAL), 0);

            if (hostilePower > 0.9 * friendlyPower) {
                this.log.info(obj.master, `cancelling remote objective for ${data.room}`);

                roomMem.remote = undefined;
                roomMem.remote_mining = undefined;
                roomMem.remote_hauler = undefined;
                roomMem.remote_defend = undefined;
                roomMem.reserver = false;

                return true;
            }
        }

        roomMem.remote = data.room;
        roomMem.remote_mining = data.sources;
        roomMem.remote_hauler = data.sources;
        roomMem.remote_defend = data.sources;
        roomMem.reserver = true;

        return false; // keep active
    }

}

export interface ObjectiveRemoteData extends ObjectiveData {
    room: string;
    sources: number;
}

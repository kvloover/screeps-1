import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveRoomData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { isMyRoom, whoAmI } from "utils/utils";

@singleton()
export class RemoteHandler implements Handler {

    type = 'remote';

    constructor(private log: Logger) { }

    generateObjectives(existing: Objective[], other: Objective[]): Objective[] {
        const objectives: Objective[] = [];
        const visited: string[] = [];
        for (let [roomName, room] of Object.entries(Game.rooms)) {
            if (isMyRoom(room)) {
                if ((room.controller?.level || 0) >= 3) {

                    this.log.debug(room.name, `brain - generating remote objectives`);

                    const remote = Memory.rooms[roomName].remote;
                    if (!remote) {
                        const subObjectives = this.stepRoom(roomName, roomName, existing, other, visited);
                        objectives.push(...subObjectives);
                    } else {
                        // reattach objective
                        if (existing.find(o => (o.data as ObjectiveRemoteData)?.room == remote)) continue;
                        const sources = Memory.rooms[remote].objects?.source?.length || 1; // default to 1 source, should be present due to active remote
                        const data: ObjectiveRemoteData = { started: Game.time, room: remote, sources: sources };
                        const obj = new Objective(roomName, this.type, data);
                        objectives.push(obj);
                        this.log.info(roomName, `brain - re-attached remote objective for ${remote}`);
                    }
                }
            }
        }

        return objectives;
    }

    stepRoom(master: string, roomName: string, existing: Objective[], other: Objective[], visited: string[], depth: number = 1): Objective[] {
        const objectives: Objective[] = [];
        // if (depth > 2) return objectives;

        if (!global.scoutData) return objectives; // nothing scouted

        const exits = Game.map.describeExits(roomName);
        if (exits) {

            const allScouted = !Object.values(exits)
                .some((newRoom) => !global.scoutData.hasOwnProperty(newRoom) && !Game.rooms.hasOwnProperty(newRoom));
            if (!allScouted) return objectives; // wait for all scouted

            const sources = (rm: string) => global.scoutData[rm]?.sources
                || Game.rooms[rm]?.memory.objects?.source?.length
                || 0;
            const sorted = Object.values(exits)
                .filter(a => !Game.rooms.hasOwnProperty(a) || !isMyRoom(Game.rooms[a]))
                .sort((a, b) => sources(a) - sources(b));

            for (let newRoom of sorted) {
                this.log.debug(newRoom, `brain - recursing remote objectives for ${master}`);

                if (existing.find(o => (o.data as ObjectiveRemoteData)?.room == newRoom)) continue;
                if (other.find(o => o.type != 'scout' && (o.data as ObjectiveRoomData)?.room == newRoom)) continue;
                if (Game.rooms.hasOwnProperty(newRoom) && isMyRoom(Game.rooms[newRoom])) continue;

                const scoutData = global.scoutData[newRoom];
                let sources = 0;
                if (scoutData) {
                    if (scoutData.lastVisited < Game.time - 400) continue; // only initiate new remote when we know the situation
                    if (!scoutData.sources || scoutData.sources == 0) continue;
                    if (scoutData.owner) continue;
                    if (scoutData.hostilePower > 0) continue;
                    if (scoutData.reservation && scoutData.reservation != whoAmI()) continue;

                    sources = scoutData.sources;
                } else if (Game.rooms.hasOwnProperty(newRoom)) {
                    const roomData = Game.rooms[newRoom];
                    if (!roomData.memory.objects?.source || roomData.memory.objects?.source?.length == 0) continue;
                    if (roomData.controller?.owner) continue;
                    if (roomData.controller?.reservation && roomData.controller?.reservation.username != whoAmI()) continue;

                    sources = roomData.memory.objects?.source?.length;
                } else {
                    continue;
                }

                const data: ObjectiveRemoteData = { started: Game.time, room: newRoom, sources: sources };
                const obj = new Objective(master, this.type, data);
                objectives.push(obj);

                visited.push(newRoom);

                this.log.info(master, `brain - adding remote objective for ${newRoom}`);
                this.log.debug(newRoom, `brain - set as remote for ${master}`);

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

            if (hostilePower > 0.9 * friendlyPower || isMyRoom(room)) {
                this.log.info(obj.master, `brain - cancelling remote objective for ${data.room}`);

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

export interface ObjectiveRemoteData extends ObjectiveRoomData {
    sources: number;
}

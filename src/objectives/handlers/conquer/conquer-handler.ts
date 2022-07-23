import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { isMyRoom, whoAmI } from "utils/utils";

@singleton()
export class ConquerHandler implements Handler {

    type = 'conquer';

    constructor(private log: Logger) { }

    generateObjectives(existing: Objective[]): Objective[] {
        let rooms = Object.values(Game.rooms).filter(isMyRoom).length;
        rooms += existing.filter(i => !Game.rooms.hasOwnProperty((i.data as ObjectiveConquerData).room)).length;

        const gcl = Game.gcl.level;
        if (gcl <= rooms) return []; // no need to generate objectives, can't claim anything

        const objectives: Objective[] = [];
        const visited: string[] = [];
        for (let [roomName, room] of Object.entries(Game.rooms)) {

            if (gcl <= rooms) return objectives; // no need to generate more, can't claim anything

            if (isMyRoom(room)) {
                if ((room.controller?.level || 0) >= 5) {
                    const conquer = Memory.rooms[roomName].conquer;
                    if (!conquer) {
                        const subObjectives = this.stepRoom(roomName, roomName, existing, visited);
                        objectives.push(...subObjectives);
                        rooms += subObjectives.length; // should only be 1
                    } else {
                        // reattach objective
                        if (existing.find(o => (o.data as ObjectiveConquerData)?.room == conquer)) continue;

                        const conqRoom = Game.rooms[conquer];
                        if (!conqRoom || !conqRoom.controller) {
                            Memory.rooms[roomName].conquer = undefined;
                            continue;
                        };

                        const data: ObjectiveConquerData = { started: Game.time, room: conquer, controller: conqRoom.controller.pos };
                        const obj = new Objective(roomName, this.type, data);
                        objectives.push(obj);
                        this.log.info(roomName, `re-attached conquer objective for ${conquer}`);
                    }
                }
            }
        }

        return objectives;
    }

    stepRoom(master: string, roomName: string, existing: Objective[], visited: string[], depth: number = 1): Objective[] {
        const objectives: Objective[] = [];
        if (depth > 2) return objectives;

        if (!global.scoutData) return objectives; // nothing scouted

        const exits = Game.map.describeExits(roomName);
        if (exits) {

            const allScouted = !Object.values(exits).some(([direction, newRoom]) => !global.scoutData.hasOwnProperty(newRoom));
            if (!allScouted) return objectives; // wait for all scouted

            const sources = (rm: string) => global.scoutData[rm].sources || 0
            const sorted = Object.entries(exits).sort(([a, b], [c, d]) => - sources(b) - sources(d));

            for (let [direction, newRoom] of sorted) {
                if (Game.rooms.hasOwnProperty(newRoom) && isMyRoom(Game.rooms[newRoom])) continue;
                const scoutData = global.scoutData[newRoom];

                if (scoutData) {
                    let check = true;
                    if (existing.find(o => (o.data as ObjectiveConquerData)?.room == newRoom)) check = false;
                    if (scoutData.lastVisited < Game.time - 200) check = false; // only initiate new remote when we know the situation
                    if (!scoutData.sources || scoutData.sources == 0) check = false;
                    if (scoutData.owner) check = false;
                    if (scoutData.hostilePower > 0) check = false;
                    if (scoutData.reservation && scoutData.reservation != whoAmI()) check = false;

                    if (check && scoutData.controller) {
                        const data: ObjectiveConquerData = { started: Game.time, room: newRoom, controller: scoutData.controller };
                        const obj = new Objective(master, this.type, data);
                        objectives.push(obj);
                        this.log.info(master, `created conquer objective for ${newRoom}`);
                        return objectives; // do not check further
                    }
                }

                if (scoutData && !scoutData.owner) {
                    const subObjectives = this.stepRoom(master, newRoom, existing, visited, depth + 1);
                    objectives.push(...subObjectives);
                    if (objectives.length > 0) return objectives; // do not check further
                }
            }
        }

        return []; // empty return
    }

    handle(obj: Objective): boolean {
        const data = obj.data as ObjectiveConquerData;
        if (!data) return true; // finished invalid objective
        const roomMem = Memory.rooms[obj.master];
        if (!roomMem) return true; // invalid master room

        // monitor for hostiles
        // if hostiles, cancel conquer till next scout

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

                roomMem.conquer = undefined;
                roomMem.conquerer = false;
                roomMem.remote_builder = false;

                return true;
            }
        }

        roomMem.conquer = data.room;

        // if not claimed, send claimer
        const conqRoom = Game.rooms[data.room];
        if (!conqRoom || !conqRoom.controller?.my) {
            roomMem.conquerer = true;
            return false;
        } else {
            if (conqRoom.controller.my && conqRoom.controller.level <= 2) {
                roomMem.conquerer = false;
                roomMem.remote_builder = true;
                return false;
            } else {
                roomMem.conquerer = false;
                roomMem.remote_builder = false;
                return true;
            }
        }
    }

}

export interface ObjectiveConquerData extends ObjectiveData {
    room: string;
    controller: RoomPosition;
}

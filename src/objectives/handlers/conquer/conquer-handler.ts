import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveData, ObjectiveRoomData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { isMyRoom, whoAmI } from "utils/utils";

@singleton()
export class ConquerHandler implements Handler {

    type = 'conquer';

    constructor(private log: Logger) { }

    generateObjectives(existing: Objective[], other: Objective[]): Objective[] {
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

                    this.log.debug(room.name, `brain - generating conquer objectives`);

                    const conquer = Memory.rooms[roomName].conquer;
                    if (!conquer) {
                        const subObjectives = this.stepRoom(roomName, roomName, existing, other, visited);
                        objectives.push(...subObjectives);
                        rooms += subObjectives.length; // should only be 1

                        this.log.debug(room.name, `brain - found ${subObjectives.length} conquer objectives`);
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
                        this.log.info(roomName, `brain - re-attached conquer objective for ${conquer}`);
                    }
                }
            }
        }

        return objectives;
    }

    stepRoom(master: string, roomName: string, existing: Objective[], other: Objective[], visited: string[], depth: number = 1): Objective[] {
        const objectives: Objective[] = [];
        if (depth > 2) {
            this.log.debug(roomName, `brain - ${master} max depth reached: ${roomName}`);
            return objectives;
        }

        if (!global.scoutData) return objectives; // nothing scouted

        const exits = Game.map.describeExits(roomName);
        if (exits) {

            const allScouted = !Object.values(exits)
                .some((newRoom) => !global.scoutData.hasOwnProperty(newRoom)
                    && !Game.rooms.hasOwnProperty(newRoom) && !(Memory.avoid && Memory.avoid.some(i => i == newRoom)));
            if (!allScouted) {
                this.log.debug(roomName, `brain - ${master} not all exits scouted, stopping search path`);
                return objectives; // wait for all scouted
            }

            const sources = (rm: string) => global.scoutData[rm]?.sources
                || Game.rooms[rm]?.memory.objects?.source?.length
                || 0;
            const sorted = Object.values(exits)
                .filter(a => !Game.rooms.hasOwnProperty(a) || !isMyRoom(Game.rooms[a]))
                .sort((a, b) => sources(b) - sources(a));

            for (let newRoom of sorted) {
                this.log.debug(newRoom, `brain - ${master} recursing conquer objectives: ${newRoom}`);

                if (Game.rooms.hasOwnProperty(newRoom) && isMyRoom(Game.rooms[newRoom])) {
                    this.log.debug(newRoom, `brain - ${master} conquer target ${newRoom} is own room, skipping`);
                    continue;
                }
                if (Memory.avoid && Memory.avoid.some(i => i == newRoom)) {
                    this.log.debug(newRoom, `brain - ${master} conquer target ${newRoom} is to be avoided, skipping`);
                    continue;
                }

                const scoutData = global.scoutData[newRoom];

                let check = false;
                let controller: RoomPosition | undefined;
                if (scoutData) {
                    check = true;
                    if (scoutData.lastVisited < Game.time - 400) check = false; // only initiate new remote when we know the situation
                    if (!scoutData.sources || scoutData.sources == 0) check = false;
                    if (scoutData.owner) check = false;
                    if (scoutData.hostilePower > 0) check = false;
                    if (scoutData.reservation
                        && scoutData.reservation != whoAmI()
                        && scoutData.reservation != 'Invader') check = false;

                    this.log.debug(newRoom, `brain - ${master} conquer based on scoutdata ${newRoom}`);
                    controller = scoutData.controller;
                } else if (Game.rooms.hasOwnProperty(newRoom)) {
                    check = true;
                    const roomData = Game.rooms[newRoom];
                    if (!roomData.memory.objects?.source || roomData.memory.objects?.source?.length == 0) check = false;
                    if (roomData.controller?.owner) check = false;;
                    if (roomData.controller?.reservation
                        && roomData.controller?.reservation.username != whoAmI()
                        && roomData.controller?.reservation.username != 'Invader')
                        check = false;

                    this.log.debug(newRoom, `brain - ${master} conquer based on roomdata ${newRoom}`);
                    controller = roomData.controller?.pos;
                }

                if (existing.find(o => (o.data as ObjectiveConquerData)?.room == newRoom)) {
                    this.log.debug(newRoom, `brain - ${master} conquer target ${newRoom} already being conquered`);
                    check = false;
                }
                if (other.find(o => o.type != 'scout' && (o.data as ObjectiveRoomData)?.room == newRoom)) {
                    this.log.debug(newRoom, `brain - ${master} conquer target ${newRoom} already being remoted`);
                    check = false;
                }

                if (check && controller) {
                    const data: ObjectiveConquerData = { started: Game.time, room: newRoom, controller: controller };
                    const obj = new Objective(master, this.type, data);
                    objectives.push(obj);

                    this.log.info(master, `brain - ${master} conquer objective created for ${newRoom}`);
                    this.log.info(newRoom, `brain - ${master} conquer objective created for ${newRoom}`);

                    return objectives; // do not check further
                } else {
                    this.log.info(newRoom, `brain - ${master} conquer target ${newRoom} did not pass check`);
                }


                if ((scoutData && !scoutData.owner)
                    || (Game.rooms.hasOwnProperty(newRoom) && !Game.rooms[newRoom].controller?.owner)) {
                    const subObjectives = this.stepRoom(master, newRoom, existing, other, visited, depth + 1);
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

            const friendlies = room.find(FIND_MY_CREEPS);
            const friendlyPower = friendlies.reduce((s, c) =>
                c.getActiveBodyparts(ATTACK)
                + c.getActiveBodyparts(RANGED_ATTACK)
                + c.getActiveBodyparts(HEAL), 0);

            const avgFriendly = friendlies.length > 0 ? friendlyPower / friendlies.length : 0;

            const defenders = avgFriendly > 0 ? Math.max(Math.ceil(hostilePower / avgFriendly), 1) : 1;

            if ((hostilePower > 10 && hostilePower > 2 * friendlyPower) || defenders > 7) {
                this.log.info(obj.master, `brain - cancelling conquer objective for ${data.room}`);

                roomMem.conquer_attack = 0;
                roomMem.conquer = undefined;
                roomMem.conquerer = false;
                roomMem.remote_builder = false;

                return true;
            } else {
                this.log.info(obj.master, `brain - update defender count to ${defenders} on conquer objective for ${data.room}`);

                roomMem.conquer_attack = defenders;
                roomMem.conquer = data.room;
                roomMem.conquerer = !room.controller?.my;
                roomMem.remote_builder = (room.controller?.level || 0) <= 2;

                return false;
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
                roomMem.conquer_attack = 1;
                return false;
            } else {
                roomMem.conquerer = false;
                roomMem.remote_builder = false;
                roomMem.conquer_attack = 0;
                return true;
            }
        }
    }

}

export interface ObjectiveConquerData extends ObjectiveRoomData {
    controller: RoomPosition;
}

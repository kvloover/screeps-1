import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { CreepState } from "utils/creep-state";
import { isMyRoom } from "utils/utils";

@singleton()
export class ScoutHandler implements Handler {

    type = 'scout';
    private _role = 'scout';

    constructor(private log: Logger) { }

    generateObjectives(existing: Objective[]): Objective[] {
        const objectives: Objective[] = [];
        const visited: string[] = [];
        for (let [roomName, room] of Object.entries(Game.rooms)) {
            if (isMyRoom(room)) {
                const subObjectives = this.stepRoom(roomName, roomName, existing, visited);
                objectives.push(...subObjectives);
            }
        }

        return objectives;
    }

    stepRoom(master: string, roomName: string, existing: Objective[], visited: string[], depth: number = 1): Objective[] {
        const objectives: Objective[] = [];
        if (depth > 2) return objectives;

        const exits = Game.map.describeExits(roomName);
        if (exits) {
            for (let [direction, newRoom] of Object.entries(exits)) {
                if (Game.rooms.hasOwnProperty(newRoom)) continue;
                if (visited.includes(newRoom)) continue;
                if (existing.find(o => (o.data as ObjectiveScoutData)?.room == newRoom)) continue;

                if (!global.scoutData?.hasOwnProperty(newRoom) || global.scoutData[newRoom].lastVisited < Game.time - 1000) {
                    const data: ObjectiveScoutData = { started: Game.time, room: newRoom, origin: roomName, depth: depth };
                    const obj = new Objective(master, this.type, data);
                    objectives.push(obj);

                    visited.push(newRoom);

                    this.log.info(roomName, `adding scout objective for ${newRoom}`);
                }

                if (!global.scoutData || !global.scoutData.hasOwnProperty(newRoom) || !global.scoutData[newRoom].owner) {
                    const subObjectives = this.stepRoom(master, newRoom, existing, visited, depth + 1);
                    objectives.push(...subObjectives);
                }

            }
        }

        return objectives;
    }

    handle(obj: Objective): boolean {
        const data = obj.data as ObjectiveScoutData;
        if (!data) return true; // finished invalid objective
        const roomMem = Memory.rooms[obj.master];
        if (!roomMem) return true; // invalid master room

        // check if room has already been scouted
        if (global.scoutData?.hasOwnProperty(data.room) && global.scoutData[data.room].lastVisited > Game.time - 1000) {
            return true; // scouted
        }

        // find the scout of the room
        const res = Object.entries(Memory.creeps)
            .find(([name, memory]) => memory.role == this._role && memory.room == obj.master);
        if (!res) {
            // scout not alive yet
            if (!roomMem.scout) {
                // set scouting flag to spawn scout if needed
                this.log.info(obj.master, `scout not found, spawning`);
                roomMem.scout = true;
            }
            return false;
        } else {
            roomMem.scout = false;
        }

        // if scout is idle, assign it to scout the desired room
        // if scout is busy, wait for it to finish
        const [name, memory] = res;
        if (memory.state == CreepState.idle) {
            this.log.info(obj.master, `scout assigned to scout ${data.room}`);
            memory.targetRoom = data.room;
            memory.objective = obj.id;
            memory.state = CreepState.work;
        }

        return false; // not finished
    }
}

export interface ObjectiveScoutData extends ObjectiveData {
    room: string;
    origin: string;
    depth: number;
}

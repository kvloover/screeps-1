import { Logger } from "logger";
import { Handler } from "objectives/entities/handler";
import { Objective, ObjectiveData } from "objectives/entities/objective";
import { CreepState } from "utils/creep-state";

export class ScoutHandler implements Handler {

    constructor(private log: Logger) { }

    generateObjectives(): Objective[] {
        // todo: only for rooms we own or desired depth

        const objectives: Objective[] = [];
        for (let [roomName, room] of Object.entries(Game.rooms)) {
            if (room.memory.scout) continue; // already scouting | wait for it to finish
            const exits = Game.map.describeExits(roomName);
            if (exits) {
                for (let [direction, newRoom] of Object.entries(exits)) {
                    if (!global.scoutData?.hasOwnProperty(newRoom) || global.scoutData[newRoom].lastVisited < Game.time - 1000) {
                        const data: ObjectiveScoutData = { started: Game.time, room: newRoom };
                        const obj: Objective = { master: roomName, type: 'scout', data: data };
                        objectives.push(obj);

                        this.log.info(roomName, `adding scout objective for ${newRoom}`);
                    }
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
            .find(([name, memory]) => memory.role == 'scout' && memory.room == obj.master);
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
            memory.state = CreepState.work;
        }

        return false; // not finished
    }
}

export interface ObjectiveScoutData extends ObjectiveData {
    room: string;
}

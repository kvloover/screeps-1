import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { isMyRoom, roomCreeps } from "utils/utils";
import { bodyFromMap } from "structures/memory/structure-memory";
import { SpawnQueue } from "structures/util/spawn-queue";
import { UPGRADER_BODY } from "objectives/body/upgrader";

@singleton()
export class Rcl2Handler implements Handler {

    type = 'rcl2';
    count = 2;
    urgency: QueueKey = 'low';
    role = 'upgrader';

    constructor(private log: Logger, private queue: SpawnQueue) { }

    generateObjectives(existing: Objective[], other: Objective[]): Objective[] {
        const objectives: Objective[] = [];
        for (let [roomName, room] of Object.entries(Game.rooms)) {
            if (isMyRoom(room)) {
                if (room.controller?.level == 1) {
                    const roomObjectives = this.generateForRoom(room, existing);
                    objectives.push(...roomObjectives);
                }
            }
        }

        return objectives;
    }

    generateForRoom(room: Room, existing: Objective[]): Objective[] {
        const objectives: Objective[] = [];

        const data: ObjectiveRcl2Data = { started: Game.time };
        const obj = new Objective(room.name, this.type, data);
        objectives.push(obj);

        return objectives;
    }

    handle(obj: Objective): boolean {
        const data = obj.data as ObjectiveRcl2Data;

        if (!Game.rooms.hasOwnProperty(obj.master)) return true; // stop for unowned rooms
        const room = Game.rooms[obj.master];

        if (room.controller?.level == 2) {
            // TODO: change upgraders into builders ?
            return true;
        }

        // wait for current request to be spawned
        if (room.memory.spawn?.[this.urgency]?.find(i => i.objective == obj.id)) return false;
        if (room.memory.spawn?.spawning && Object.values(room.memory.spawn.spawning).find(i => i && i.objective == obj.id)) return false;

        // get current desired body

        const body = UPGRADER_BODY[room.controller?.level || 0]
        if (body) {
            const simpleBody = body.map(i => bodyFromMap(i)).reduce((a, c) => a.concat(c), []);

            if (simpleBody.length > 0) {

                const currCreeps = roomCreeps(obj.master, this.role);
                if (currCreeps.length >= this.count) return false;
                // add new upgrader with the given body and assign to the objective
                this.queue.push(obj.master, this.urgency,
                    {
                        objective: obj.id,
                        body: { fixed: body, trail: { work: 1 } },
                        initial: { objective: obj.id, role: this.role },
                        role: this.role,
                    });
            }

        }

        return false; // not finished
    }
}

export interface ObjectiveRcl2Data extends ObjectiveData {

}



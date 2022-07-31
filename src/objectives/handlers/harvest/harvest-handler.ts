import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { bodyCost, isMyRoom, roomCreeps } from "utils/utils";
import { bodyFromMap } from "structures/memory/structure-memory";
import { SpawnQueue } from "structures/util/spawn-queue";
import { HARVEST_BODY } from "objectives/body/harvester";
import { HAULER_BODY } from "objectives/body/hauler";

@singleton()
export class HarvestHandler implements Handler {

    type = 'harvest';
    urgency: QueueKey = 'normal';
    role = 'harvester';

    constructor(private log: Logger, private queue: SpawnQueue) { }

    generateObjectives(existing: Objective[], other: Objective[]): Objective[] {
        const objectives: Objective[] = [];
        for (let [roomName, room] of Object.entries(Game.rooms)) {
            if (isMyRoom(room)) {
                const roomObjectives = this.generateForRoom(room, existing);
                objectives.push(...roomObjectives);
            }
        }

        return objectives;
    }

    generateForRoom(room: Room, existing: Objective[]): Objective[] {
        const objectives: Objective[] = [];
        const sources = room.memory.objects?.source || [];
        for (let source of sources) {
            if (existing.find(o => (o.data as ObjectiveHarvestData)?.sourceId == source.id)) continue;

            const mem = source as SourceMemory;
            const data: ObjectiveHarvestData = { started: Game.time, sourceId: source.id, source: source.pos, positions: mem.positions };
            const obj = new Objective(room.name, this.type, data);
            objectives.push(obj);
        }

        return objectives;
    }

    handle(obj: Objective): boolean {
        // todo
        // - stop harvesting for unprotected sources if can't defend them
        // - bootstrap room with no harvesters and haulers



        if (!Game.rooms.hasOwnProperty(obj.master)) return true; // stop harvesting unowned rooms
        const room = Game.rooms[obj.master];

        // wait for current request to be spawned
        if (room.memory.spawn?.[this.urgency]?.find(i => i.objective == obj.id)) return false;
        if (room.memory.spawn?.spawning && Object.values(room.memory.spawn.spawning).find(i => i && i.objective == obj.id)) return false;

        const currCreeps = roomCreeps(obj.master, this.role).filter(c => c.memory.objective == obj.id);
        const haulers = roomCreeps(obj.master, 'hauler').filter(c => c.memory.objective == obj.id);

        if (currCreeps.length > 1 && haulers.length == 0) {
            this.spawnHauler(obj);
        } else {
            this.trySpawnHarvester(obj, room, currCreeps);
        }

        return false; // not finished
    }

    private trySpawnHarvester(obj: Objective, room: Room, creeps: Creep[]): void {
        const data = obj.data as ObjectiveHarvestData;

        // get current desired body
        // get current harvesting power
        // if not enough, determine new size and add if possible spot
        // include spawn time to replace in time

        const capacity = room.energyCapacityAvailable;
        let level = room.controller?.level || 0;
        let body: BodyMap[] | undefined;
        while (level >= 0 && !body) {
            const potential = HARVEST_BODY[level]
            if (bodyCost(potential.map(i => bodyFromMap(i)).reduce((a, c) => a.concat(c), [])) <= capacity)
                body = potential;
            level--;
        }

        if (body) {
            this.log.debug(obj.master, `harvesting ${data.sourceId} with harvester level ${level + 1} : ${JSON.stringify(body)}`);
            const simpleBody = body.map(i => bodyFromMap(i)).reduce((a, c) => a.concat(c), []);

            if (simpleBody.length > 0) {
                this.log.debug(obj.master, `harvesting ${data.sourceId} with ${simpleBody.join(',')}`);

                const assigned = creeps.filter(c => c.memory.objective == obj.id && (!c.ticksToLive || c.ticksToLive > simpleBody.length * 3));
                if (assigned.length >= data.positions) return;

                const harvestPower = assigned.map(c => c.getActiveBodyparts(WORK)).reduce((a, b) => a + b, 0);
                if (harvestPower < 5) {
                    // add new harvester with the given body and assign to the objective
                    this.queue.push(obj.master, this.urgency, {
                        objective: obj.id,
                        body: { fixed: body, trail: { work: 1 } },
                        initial: { objective: obj.id, role: this.role },
                        role: this.role,
                    });
                }
            }

        }
    }

    private spawnHauler(obj: Objective): void {
        const body = HAULER_BODY[0];// dynamic
        if (body) {
            const simpleBody = body.map(i => bodyFromMap(i)).reduce((a, c) => a.concat(c), []);
            if (simpleBody.length > 0) {
                // add new upgrader with the given body and assign to the objective
                this.queue.push(obj.master, 'urgent',
                    {
                        objective: obj.id,
                        body: { dynamic: body[0], dynamicAvailableEnergy: true },
                        initial: { objective: obj.id, role: 'hauler' },
                        role: 'hauler',
                    });
            }
        }
    }
}

export interface ObjectiveHarvestData extends ObjectiveData {
    sourceId: Id<_HasId>;
    source: RoomPosition;
    positions: number; // number of possible harvesting spots : upper limit harvesters
}

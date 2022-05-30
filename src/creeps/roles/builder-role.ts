import { injectable } from "tsyringe";
import { Pathing } from "creeps/pathing";
import { Role } from "../role";
import { CreepUtils } from "creeps/creep-utils";
import { ConsumerRole } from "./base/consumer-role";

@injectable()
export class BuilderRole extends ConsumerRole implements Role {

    name: string = 'builder'
    maxHits: number = 15000;

    constructor(pathing: Pathing) { super(pathing); }

    protected work(creep: Creep): void {
        // priority repairs > construction > repairs
        const emergency = creep.room.find(FIND_STRUCTURES, {
            filter: (struct) => struct.hits < 1500 && struct.hits < struct.hitsMax
                // (struct.structureType === STRUCTURE_TOWER && struct.hits <= 0.50 * struct.hitsMax)      // 1.5k HP
                // || (struct.structureType == STRUCTURE_WALL && struct.hits <= 0.000005 * struct.hitsMax) // 1.5k HP
                // || (struct.structureType == STRUCTURE_RAMPART && struct.hits <= 0.005 * struct.hitsMax) // 1.5k HP
        })
        if (emergency.length > 0) {
            // emergency repairs
            if (!CreepUtils.tryFor(emergency, loc => creep.repair(loc))) {
                const loc = this.pathing.findClosestOf(creep, emergency);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                }
            }
        } else {
            const constructions = creep.room.find(FIND_STRUCTURES);
            if (constructions.length > 0) {
                // construct
                if (!CreepUtils.tryForFind(creep, FIND_CONSTRUCTION_SITES, loc => creep.build(loc))) {
                    const loc = this.pathing.findClosest(creep, FIND_CONSTRUCTION_SITES);
                    if (loc != undefined) {
                        this.pathing.moveTo(creep, loc.pos);
                    }
                }
            } else {
                // repair
                if (!CreepUtils.tryForFind(creep, FIND_STRUCTURES, loc => creep.repair(loc), {
                    filter: (struct) =>
                        struct.hits < struct.hitsMax
                })) {
                    const loc = this.pathing.findClosest(creep, FIND_STRUCTURES);
                    if (loc != undefined) {
                        this.pathing.moveTo(creep, loc.pos);
                    }
                }
            }
        }
    }
}

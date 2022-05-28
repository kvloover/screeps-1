import { injectable } from "tsyringe";
import { Pathing } from "creeps/pathing";
import { Role } from "../role";
import { CreepUtils } from "creeps/creep-utils";

@injectable()
export class AttackerRole implements Role {

    name: string = 'attacker'

    constructor(private pathing: Pathing) {
    }

    public run(creep: Creep): void {

        const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            if (Game.time % 10 == 0) { creep.say('⚔️ hostiles found'); }
            if (!CreepUtils.tryFor(hostiles, (hostile) => creep.attack(hostile))) {
                const loc = this.pathing.findClosestOf(creep, hostiles);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                }
            }
        } else {
            const flag = this.pathing.findClosest(creep, FIND_FLAGS,  { filter: (fl) => fl.name.startsWith('Guardian') });
            if (flag != undefined) {
                this.pathing.moveTo(creep, flag.pos);
            }
        }


    }
}

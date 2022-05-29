import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { injectable } from "tsyringe";
import { Role } from "../role";
import { ConsumerRole } from "./base/consumer-role";

@injectable()
export class UpgraderRole extends ConsumerRole implements Role {

    name: string = 'upgrader'

    constructor(pathing: Pathing) { super(pathing) }

    protected work(creep: Creep): void {
        if (creep.room.controller && creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            this.pathing.moveTo(creep, creep.room.controller.pos);
        }
    }

}

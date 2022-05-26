import { inject, injectable } from "tsyringe";

import { Manager } from "manager";
import { Role, Roles } from "./role";

@injectable()
export class CreepsManager implements Manager {

    constructor(@inject(Roles.token) private role: Role) { }

    public performRole(): void {
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == 'harvester') {
                this.role.run(creep);
            }
            // if(creep.memory.role == 'upgrader') {
            //     roleUpgrader.run(creep);
            // }
        }
    }

    public run(): void {
        this.performRole();
    }

}

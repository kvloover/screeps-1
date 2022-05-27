import { inject, injectable, injectAll } from "tsyringe";

import { Manager } from "manager";
import { Role, Roles } from "./role";
import { object } from "lodash";

@injectable()
export class CreepsManager implements Manager {

    constructor(@injectAll(Roles.token) private roles: Role[]) { }

    public performRole(): void {
        this.roles.forEach(role => {
            Object.values(Game.creeps)
                .filter(crp => crp.memory.role == role.name)
                .forEach(crp => role.run(crp));
        })
    }

    public run(): void {
        this.performRole();
    }

    // have idle creeps switch task/roles
}

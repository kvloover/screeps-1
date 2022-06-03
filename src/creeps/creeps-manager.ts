import { inject, injectable, injectAll } from "tsyringe";

import { Manager } from "manager";
import { Role, Roles } from "./role";
import { object } from "lodash";
import { Logger } from "logger";

@injectable()
export class CreepsManager implements Manager {

    constructor(private log: Logger,
        @injectAll(Roles.token) private roles: Role[]
    ) { }

    public performRole(room: Room): void {
        this.roles.forEach(role => {
            _.filter(Game.creeps, crp =>
                crp.room.name === room.name
                && crp.memory.role == role.name)
                .forEach(crp => {
                    try {
                        role.run(crp)
                    } catch (error) {
                        this.log.Error(error)
                    }
                });
        })
    }

    public run(room: Room): void {
        this.performRole(room);
    }

    // have idle creeps switch task/roles
}

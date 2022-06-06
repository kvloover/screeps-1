import { container, injectable, injectAll } from "tsyringe";

import { Manager } from "manager";
import { Role, Roles, RoleService } from "./role";
import { Logger } from "logger";
import { memoryUsage } from "process";

@injectable()
export class CreepsManager implements Manager {

    constructor(private log: Logger,
        @injectAll(Roles.service) private services: RoleService[]
    ) { }

    private performRole(room: Room, roles: Role[]): void {
        roles.forEach(role => {
            _.filter(Game.creeps, crp =>
                crp.room.name === room.name
                && crp.memory.role == role.name)
                .forEach(crp => {
                    try {
                        this.log.debug(room, `running ${role.name} role for ${crp.name}`);
                        role.run(crp)
                    } catch (error) {
                        this.log.error(error, `error for creep ${crp.name}`);
                    }
                });
        })
    }

    public run(room: Room): void {
        let phase = 1;
        if (room.memory.stage && room.memory.stage >= 3) phase = 2;

        const cont = container; //.createChildContainer(); //! container scope has seperate for each child
        this.services.forEach(s => s.register(cont, phase))

        const roles = cont.resolveAll<Role>(Roles.token);
        this.performRole(room, roles);
    }

    // have idle creeps switch task/roles
}

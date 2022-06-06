import { container, injectable, injectAll } from "tsyringe";

import { Logger } from "logger";
import { Manager } from "manager";

import { Role } from "./roles/role";
import { RoleService } from "./roles/role-service";
import { Roles } from "./roles/role-registry";
import { RoleServices } from "./roles/role-service-registry";

@injectable()
export class CreepsManager implements Manager {

    constructor(private log: Logger,
        @injectAll(RoleServices.token) private services: RoleService[]
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

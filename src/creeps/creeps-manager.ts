import { container, injectable, injectAll } from "tsyringe";

import { Logger } from "logger";
import { Manager } from "manager";

// import { RoleService } from "./roles/role-service";
import { Role, Roles } from "./roles/role-registry";
// import { RoleServices } from "./roles/role-service-registry";

@injectable()
export class CreepsManager implements Manager {

    constructor(private log: Logger,
        // @injectAll(RoleServices.token) private services: RoleService[]
    ) { }

    private performRole(room: Room, roles: Role[], phase: number): void {
        roles
            .filter(i => i.phase.start <= phase && i.phase.end >= phase)
            .forEach(role => {
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

        const struct = room.find(FIND_STRUCTURES, { filter: (struct) => struct.structureType === STRUCTURE_CONTAINER })
        if (room.memory.stage && room.memory.stage >= 3 && struct.length > 0) phase = 2;

        const roles = container.resolveAll<Role>(Roles.token);
        this.performRole(room, roles, phase);
    }

    // have idle creeps switch task/roles
}

import { container, injectable } from "tsyringe";

import { Logger } from "logger";
import { Manager } from "manager";

import { Role, Roles } from "./roles/role-registry";
import { isMyRoom } from "utils/utils";

import profiler from "screeps-profiler";

@injectable()
export class CreepsManager implements Manager {

    constructor(private log: Logger,
        // @injectAll(RoleServices.token) private services: RoleService[]
    ) { }

    private performRole(room: Room, phase: number, roles: Role[], creeps: Creep[]): void {
        roles
            .filter(i => i.phase.start <= phase && i.phase.end >= phase)
            .forEach(role => {
                _.filter(creeps, crp => crp.memory.role == role.name)
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
        const creeps = _.filter(Game.creeps, crp => crp.room.name === room.name);
        if (creeps.length == 0) return;
        const phase = this.phase(room);
        const roles = container.resolveAll<Role>(Roles.token);
        this.performRole(room, phase, roles, creeps);
    }

    private phase(room: Room): number {
        let phase = 1;
        const struct = room.find(FIND_STRUCTURES, { filter: (struct) => struct.structureType === STRUCTURE_CONTAINER })
        const storage = room.find(FIND_MY_STRUCTURES, { filter: (struct) => struct.structureType === STRUCTURE_STORAGE })
        if (room.memory.stage && room.memory.stage >= 3 && struct.length > 0) phase = 2;
        if (room.memory.stage && room.memory.stage >= 5 && storage.length > 0) phase = 3;
        if (phase === 3 && room.memory.links?.length > 0) phase = 4;

        return phase;
    }

    // have idle creeps switch task/roles
}

profiler.registerClass(CreepsManager, 'CreepsManager');

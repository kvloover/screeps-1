import { Roles } from "creeps/role";
import {
    BuilderRole,
    ClaimerRole,
    HarvesterDirectRole,
    HaulerRole,
    MeleeAttackerRole,
    RangedAttackerRole,
    RemoteAttackerRole,
    RemoteHarvesterRole,
    UpgraderRole
} from "creeps/roles";
import { container, DependencyContainer } from "tsyringe";

export class PhaseService {

    public init(): void {
    }

    public phase(phase: number): DependencyContainer {
        switch (phase) {
            case 1:
                return this.phase_1();
            case 2:
                return this.phase_2();
            case 3:
                return this.phase_3();
            default:
                return container;
        }
    }

    private phase_1(): DependencyContainer {
        const cont = container.createChildContainer();

        cont.register(Roles.token, { useToken: HarvesterDirectRole });
        cont.register(Roles.token, { useToken: HaulerRole });
        cont.register(Roles.token, { useToken: BuilderRole });
        cont.register(Roles.token, { useToken: RemoteHarvesterRole });
        cont.register(Roles.token, { useToken: UpgraderRole });
        cont.register(Roles.token, { useToken: MeleeAttackerRole });
        cont.register(Roles.token, { useToken: RangedAttackerRole });
        cont.register(Roles.token, { useToken: RemoteAttackerRole });
        cont.register(Roles.token, { useToken: ClaimerRole });

        return cont;
    }

    private phase_2(): DependencyContainer {
        const cont = container.createChildContainer();

        cont.register(Roles.token, { useToken: HarvesterDirectRole });
        cont.register(Roles.token, { useToken: HaulerRole });
        cont.register(Roles.token, { useToken: BuilderRole });
        cont.register(Roles.token, { useToken: RemoteHarvesterRole });
        cont.register(Roles.token, { useToken: UpgraderRole });
        cont.register(Roles.token, { useToken: MeleeAttackerRole });
        cont.register(Roles.token, { useToken: RangedAttackerRole });
        cont.register(Roles.token, { useToken: RemoteAttackerRole });
        cont.register(Roles.token, { useToken: ClaimerRole });

        return cont;
    }

    private phase_3(): DependencyContainer {
        const cont = container.createChildContainer();

        cont.register(Roles.token, { useToken: HarvesterDirectRole });
        cont.register(Roles.token, { useToken: HaulerRole });
        cont.register(Roles.token, { useToken: BuilderRole });
        cont.register(Roles.token, { useToken: RemoteHarvesterRole });
        cont.register(Roles.token, { useToken: UpgraderRole });
        cont.register(Roles.token, { useToken: MeleeAttackerRole });
        cont.register(Roles.token, { useToken: RangedAttackerRole });
        cont.register(Roles.token, { useToken: RemoteAttackerRole });
        cont.register(Roles.token, { useToken: ClaimerRole });

        return cont;
    }

}

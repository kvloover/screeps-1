import { injectable } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

// import { RoleService } from "creeps/roles/role-service-registry";

import { HaulerRole } from "./hauler-role";

import { DemandTaskRepo } from "repos/tasks/demand-task-repo";
import { ProviderTaskRepo } from "repos/tasks/providor-task-repo";
import { BatteryTaskRepo } from "repos/tasks/battery-task-repo";


@injectable()
export class HaulerMidstreamRole extends HaulerRole {

    phase = {
        start: 1,
        end: 2
    };

    constructor(log: Logger, pathing: Pathing,
        provider: ProviderTaskRepo, supply: DemandTaskRepo) {
        super(log, pathing, provider, supply)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler midstream`);
        super.run(creep);
    }
}

@injectable()
export class HaulerStorageRole extends HaulerRole {

    phase = {
        start: 3,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: BatteryTaskRepo, supply: DemandTaskRepo) {
        super(log, pathing, provider, supply)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler storage`);
        super.run(creep);
    }
}


// @injectable()
// export class HaulerService implements RoleService {
//     register(cont: DependencyContainer, phase: number, token: symbol): void {
//         // if downgraded from point of existence (phase 2): use lowest role
//         if (phase <= 2) { cont.register(token, { useToken: HaulerMidstreamRole }); }
//         else if (phase >= 3) { cont.register(token, { useToken: HaulerStorageRole }); }
//     }
// }

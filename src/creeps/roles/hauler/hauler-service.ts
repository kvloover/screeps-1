import { injectable } from "tsyringe";
import { Logger } from "logger";
import { Pathing } from "../../pathing";

import { HaulerRole } from "./hauler-role";

import { DemandTaskRepo } from "repos/demand-task-repo";
import { SupplyTaskRepo } from "repos/supply-task-repo";
import profiler from "screeps-profiler";


// @injectable()
// export class HaulerMidstreamRole extends HaulerRole {

//     phase = {
//         start: 1,
//         end: 2
//     };

//     constructor(log: Logger, pathing: Pathing,
//         provider: ProviderTaskRepo, supply: DemandTaskRepo) {
//         super(log, pathing, provider, supply)
//     }

//     public run(creep: Creep): void {
//         this.log.debug(creep.room, `Running hauler midstream`);
//         super.run(creep);
//     }
// }

@injectable()
export class HaulerStorageRole extends HaulerRole {

    phase = {
        start: 1,
        end: 9
    };

    constructor(log: Logger, pathing: Pathing,
        provider: SupplyTaskRepo, supply: DemandTaskRepo) {
        super(log, pathing, provider, supply)
    }

    public run(creep: Creep): void {
        this.log.debug(creep.room, `Running hauler storage`);
        super.run(creep);
    }
}

profiler.registerClass(HaulerStorageRole, 'HaulerStorageRole');

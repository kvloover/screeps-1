import { injectable } from "tsyringe";

import { Logger } from "logger";
import { Pathing } from "creeps/pathing";

import { Role } from "../role-registry";
import { TransferRole } from "../_base/transfer-role";

import { ProviderTaskRepo } from "repos/provider-task-repo";
import { StorageTaskRepo } from "repos/storage-task-repo";

/**
 * Get Energy from containers and store in buildings
 */
 @injectable()
export class FillerRole extends TransferRole implements Role {

    // TODO dropped and other resources

    name: string = 'filler'
    phase = {
        start: 2,
        end: 9
    };

    constructor(log: Logger,
        pathing: Pathing,
        private providers: ProviderTaskRepo,
        private demands: StorageTaskRepo
    ) { super(log, pathing); }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.providers, 'consume');
    }

    protected supply(creep: Creep) {
        this.supplyToRepo(creep, this.demands, 'supply');
    }

}


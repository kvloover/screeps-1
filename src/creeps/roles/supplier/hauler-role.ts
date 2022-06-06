import { injectable } from "tsyringe";

import { Logger } from "logger";
import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";
import { isDefined } from "utils/utils";

import { Role } from "../../role";
import { SupplierRole } from "./supplier-role";

import { DemandTaskRepo } from "repos/tasks/demand-task-repo";
import { ProviderTaskRepo } from "repos/tasks/providor-task-repo";

@injectable()
/**
 * Get Energy from containers and store in buildings
 */
export class HaulerRole extends SupplierRole implements Role {

    name: string = 'hauler'

    constructor(log: Logger,
        pathing: Pathing,
        private providers: ProviderTaskRepo,
        private demands: DemandTaskRepo
    ) { super(log, pathing); }

    protected consume(creep: Creep): void {
        this.consumeFromRepo(creep, this.providers, 'consume');
    }

    protected supply(creep: Creep) {
        this.supplyToRepo(creep, this.demands, 'supply');
    }

    // protected work(creep: Creep): void {

    //     if (!CreepUtils.tryForFindInRoom(
    //         creep, this.supplyRoom(creep), FIND_TOMBSTONES,
    //         loc => creep.withdraw(loc, RESOURCE_ENERGY), { filter: (loc) => loc.store[RESOURCE_ENERGY] > 0 })
    //     ) {
    //         const loc = this.pathing.findClosest(creep, FIND_TOMBSTONES, { filter: (loc) => loc.store[RESOURCE_ENERGY] > 0 });
    //         if (loc != undefined) {
    //             this.pathing.moveTo(creep, loc.pos);

    //         } else {
    //             if (!CreepUtils.tryForFindInRoom(
    //                 creep, this.supplyRoom(creep), FIND_DROPPED_RESOURCES,
    //                 loc => creep.pickup(loc))
    //             ) {
    //                 const loc = this.pathing.findClosest(creep, FIND_DROPPED_RESOURCES);
    //                 if (loc != undefined) {
    //                     this.pathing.moveTo(creep, loc.pos);
    //                 } else {

    //                     const prio: FilterOptions<FIND_STRUCTURES> = {
    //                         filter: (structure) =>
    //                             structure.structureType == STRUCTURE_CONTAINER
    //                             && structure.store[RESOURCE_ENERGY] > 0
    //                     };

    //                     if (!CreepUtils.tryForFindInRoom(
    //                         creep, this.supplyRoom(creep), FIND_STRUCTURES,
    //                         loc => creep.withdraw(loc, RESOURCE_ENERGY), prio
    //                     )) {
    //                         const loc = this.pathing.findClosest(creep, FIND_STRUCTURES, prio);
    //                         if (loc != undefined) {
    //                             this.pathing.moveTo(creep, loc.pos);
    //                         } else {
    //                             creep.memory.state = CreepState.idle;
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

}


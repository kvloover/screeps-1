import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";
import { CreepState } from 'utils/creep-state';

export abstract class SupplierRole<T extends FIND_STRUCTURES | FIND_MY_STRUCTURES> {

    constructor(protected pathing: Pathing) { }

    protected abstract work(creep: Creep): void;
    protected abstract workState(creep: Creep): CreepState;
    protected abstract findConstant(): T;
    protected abstract filter(): FilterOptions<T>;

    protected supplyRoom(creep: Creep): Room { return creep.room };

    public run(creep: Creep): void {
        this.setState(creep);
        this.switchState(creep);
    }

    protected setState(creep: Creep): void {
        if (creep.store.getFreeCapacity() == 0
            || creep.memory.state == CreepState.idle)
            creep.memory.state = CreepState.supply;

        if (creep.memory.state == CreepState.supply
            && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.state = this.workState(creep);
        }
    }

    protected switchState(creep: Creep): void {
        if (creep.memory.state != CreepState.idle
            && creep.memory.state != CreepState.supply) {
            this.work(creep);
        }
        if (creep.memory.state == CreepState.supply) {
            this.deposit(creep);
        }
    }

    protected deposit(creep: Creep) {
        const opt = this.filter();
        const supplyRoom = this.supplyRoom(creep);

        if (supplyRoom.name !== creep.room.name) {
            this.pathing.moveTo(creep, new RoomPosition(25, 25, supplyRoom.name))
        } else {
            if (!CreepUtils.tryForFind(
                creep, this.findConstant(),
                loc => creep.transfer(loc, RESOURCE_ENERGY), opt
            )) {
                const loc = this.pathing.findClosest(creep, this.findConstant(), opt);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                } else {
                    this.noDepositFound(creep);
                }
            }
        }
    }

    protected noDepositFound(creep: Creep) {
        creep.memory.state = this.workState(creep); // try to force work
    }

}

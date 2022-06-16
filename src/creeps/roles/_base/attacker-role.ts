import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";

export abstract class AttackerRole {

    constructor(protected pathing: Pathing) { }

    protected abstract attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode;

    public run(creep: Creep): void {
        this.findAttack(creep);
    }

    protected findAttack(creep: Creep, room?: Room) {
        const hostiles = (room ?? creep.room).find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {

            if (creep.memory.targetId && hostiles.some(i => i.id == creep.memory.targetId)) {
                const hostile = Game.getObjectById(creep.memory.targetId) as Creep;
                if (this.attack(creep, hostile) == ERR_NOT_IN_RANGE) {
                    this.pathing.moveTo(creep, hostile.pos);
                }
            } else {
                const hostile = this.pathing.findClosestOf(creep, hostiles);
                if (hostile) {
                    creep.memory.targetId = hostile.id;
                    if (this.attack(creep, hostile) == ERR_NOT_IN_RANGE) {
                        this.pathing.moveTo(creep, hostile.pos);
                    }
                }
            }

        } else {

            const hostileStruct = (room ?? creep.room).find(FIND_HOSTILE_STRUCTURES);
            if (hostileStruct.length > 0) {

                if (creep.memory.targetId && hostileStruct.some(i => i.id == creep.memory.targetId)) {
                    const hostile = Game.getObjectById(creep.memory.targetId) as AnyOwnedStructure;
                    if (this.attack(creep, hostile) == ERR_NOT_IN_RANGE) {
                        this.pathing.moveTo(creep, hostile.pos);
                    }
                } else {
                    const hostile = this.pathing.findClosestOf(creep, hostileStruct);
                    if (hostile) {
                        creep.memory.targetId = hostile.id;
                        if (this.attack(creep, hostile) == ERR_NOT_IN_RANGE) {
                            this.pathing.moveTo(creep, hostile.pos);
                        }
                    }
                }

            } else {

                const controller = (room ?? creep.room).controller;
                if (controller && !controller.my && controller.owner) {

                    creep.memory.targetId = controller.id;
                    if (this.attack(creep, controller) == ERR_NOT_IN_RANGE) {
                        this.pathing.moveTo(creep, controller.pos);
                    }

                } else {

                    if (creep.memory.target) {
                        this.pathing.moveTo(creep, creep.memory.target);
                    } else {
                        const flag = creep.room.find(FIND_FLAGS, { filter: (fl) => fl.name.startsWith('Guardian') });
                        if (flag && flag.length > 0) {
                            creep.memory.target = flag[0].pos;
                            this.pathing.moveTo(creep, flag[0].pos);
                        }
                    }

                }
            }
        }
    }
}


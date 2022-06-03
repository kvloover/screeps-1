import { Pathing } from "creeps/pathing";
import { CreepUtils } from "creeps/creep-utils";

export abstract class AttackerRole {

    constructor(protected pathing: Pathing) { }

    protected abstract attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode;

    public run(creep: Creep): void {
        this.findAttack(creep);
    }

    protected findAttack(creep: Creep) {
        const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {

            if (Game.time % 10 == 0) { creep.say('⚔️ hostiles found'); }
            if (!CreepUtils.tryFor(hostiles, (hostile) => this.attack(creep, hostile))) {
                const loc = this.pathing.findClosestOf(creep, hostiles);
                if (loc != undefined) {
                    this.pathing.moveTo(creep, loc.pos);
                }
            }

        } else {

            const hostileStruct = creep.room.find(FIND_HOSTILE_STRUCTURES);
            if (hostileStruct.length > 0) {

                if (Game.time % 10 == 0) { creep.say('⚔️ hostiles found'); }
                if (!CreepUtils.tryFor(hostileStruct, (hostile) => this.attack(creep, hostile))) {
                    const loc = this.pathing.findClosestOf(creep, hostileStruct);
                    if (loc != undefined) {
                        this.pathing.moveTo(creep, loc.pos);
                    }
                }

            } else {

                const controller = creep.room.controller;
                if (controller && !controller.my) {

                    if (Game.time % 10 == 0) { creep.say('⚔️ hostiles found'); }
                    if (!CreepUtils.tryFor([controller], (hostile) => this.attack(creep, hostile))) {
                        this.pathing.moveTo(creep, controller.pos);
                    }

                } else {

                    const flag = this.pathing.findClosest(creep, FIND_FLAGS, { filter: (fl) => fl.name.startsWith('Guardian') });
                    if (flag != undefined) {
                        this.pathing.moveTo(creep, flag.pos);
                    }

                }
            }
        }
    }
}


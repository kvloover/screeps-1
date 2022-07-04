import { singleton } from "tsyringe";

import { CreepUtils } from "creeps/creep-utils";
import { Pathing } from "creeps/pathing";
import { CreepState } from "utils/creep-state";

import { Role } from "../role-registry";
import { RangedAttackerRole } from "./ranged-attacker-role";
import profiler from "screeps-profiler";
import { isStructure } from "utils/utils";

@singleton()
export class RemoteAttackerRole extends RangedAttackerRole implements Role {

    name: string = 'remote-attacker'
    phase = {
        start: 1,
        end: 9
    };

    constructor(pathing: Pathing) {
        super(pathing);
        console.log(`construtor ${this.name}`);
    }

    public override run(creep: Creep): void {
        // First entry to work: find target room
        if (!creep.memory.targetRoom) {
            // get setting on room:
            if (Memory.rooms[creep.memory.room]) {
                const target = Memory.rooms[creep.memory.room].attack;
                creep.memory.targetRoom = target;
            }
        }

        if (creep.memory.targetRoom
            && !creep.memory.target
            && !creep.memory.targetId
            && creep.room.name != creep.memory.targetRoom) {
            if (!Game.rooms.hasOwnProperty(creep.memory.targetRoom)) {
                // move to room
                this.pathing.scoutRoom(creep, creep.memory.targetRoom, true);
            } else {
                // move to room
                this.pathing.scoutRoom(creep, creep.memory.targetRoom, true);
                // const room = Game.rooms[creep.memory.targetRoom]
                // super.findAttack(creep, room);;
            }
        } else {
            super.findAttack(creep, creep.memory.targetRoom ? Game.rooms[creep.memory.targetRoom] : creep.room);
        }

    }

    protected override attack(creep: Creep, hostile: Creep | AnyOwnedStructure): CreepActionReturnCode {
        let ret: CreepActionReturnCode;
        if (isStructure(hostile)) {
            console.log('attacking structure');
            const range = hostile.pos.getRangeTo(creep.pos);
            if (range < 3) {
                creep.rangedMassAttack();
            }
            ret = range < 2 ? OK : ERR_NOT_IN_RANGE
        } else {
            console.log('attacking creep');
            ret = creep.rangedAttack(hostile);
        }
        if (creep.getActiveBodyparts(HEAL) > 0) {
            console.log('healing');
            const retHeal = creep.heal(creep);
            console.log(`healed: ${retHeal}`);
        }
        if (creep.getActiveBodyparts(ATTACK) > 0)
            return creep.attack(hostile);
        else
            return ret;
    }

}

profiler.registerClass(RemoteAttackerRole, 'RemoteAttackerRole');

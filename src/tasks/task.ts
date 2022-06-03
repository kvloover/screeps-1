import { v4 as uuid } from 'uuid';

export class Task {
    id: string = uuid();
    constructor(
        public prio: number,
        public amount?: number,
        public requester?: Id<_HasId>,
        public executer?: Id<_HasId>,
        public pos?: RoomPosition,
    ) { }
}

export class AttackTask extends Task {}
export class BuildTask extends Task {}
export class ClaimTask extends Task {}
export class HarvestTask extends Task {}
// RangedAttack, RangedHeal, RangedMassAttack, Pull,
export class RepairTasl extends Task {}
export class TransferTask extends Task {}
export class ContainerTransferTask extends Task {}
export class WithdrawTask extends Task {}

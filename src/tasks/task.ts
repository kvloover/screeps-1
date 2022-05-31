import { v4 as uuid } from 'uuid';

export abstract class Task {
    id: string = uuid();
    amount?: number;

    requester?: Id<_HasId>;
    pos?: RoomPosition;
}

export class AttackTask extends Task { }
export class BuildTask extends Task { }
export class ClaimTask extends Task { }
export class HarvestTask extends Task { dummy: number = 1; }
// RangedAttack, RangedHeal, RangedMassAttack, Pull,
export class RepairTasl extends Task { }
export class TransferTask extends Task { }
export class WithdrawTask extends Task { }

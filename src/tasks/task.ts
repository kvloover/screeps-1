import { v4 as uuid } from 'uuid';

export abstract class Task {
    id: string = uuid();
    constructor(
        public prio: number,
        public amount?: number,
        public requester?: Id<_HasId>,
        public executer?: Id<_HasId>,
        public pos?: _HasRoomPosition,
    ) { }
}

export class AttackTask extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}
export class BuildTask extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}
export class ClaimTask extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}
export class HarvestTask extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}
// RangedAttack, RangedHeal, RangedMassAttack, Pull,
export class RepairTasl extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}
export class TransferTask extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}
export class ContainerTransferTask extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}
export class WithdrawTask extends Task {
    constructor(
        prio: number,
        amount?: number,
        requester?: Id<_HasId>,
        executer?: Id<_HasId>,
        pos?: _HasRoomPosition
    ) { super(prio, amount, requester, executer, pos) }
}

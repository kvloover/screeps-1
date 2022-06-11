import uuid from 'v4-uuid';

export class Task {
    id: string = uuid();
    constructor(
        public room: string,
        public prio: number,
        public amount?: number,
        public type?: ResourceConstant,
        public requester?: Id<_HasId>,
        public executer?: Id<_HasId>,
        public pos?: RoomPosition
    ) { }
}

export class AttackTask extends Task {}
export class BuildTask extends Task {}
export class ClaimTask extends Task {}
// RangedAttack, RangedHeal, RangedMassAttack, Pull,
export class RepairTask extends Task {}

export class HarvestTask extends Task {}
export class DemandTask extends Task {}
export class MidstreamTask extends Task {}
export class ProviderTask extends Task {}
export class StorageTask extends Task {}
export class SupplyTask extends Task {}

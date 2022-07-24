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


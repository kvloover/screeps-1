import { ObjectiveData } from 'objectives/entities/objective';
import uuid from 'v4-uuid';

export class Objective {
    id: string = uuid();
    constructor(
        public master: string,
        // public prio: number,
        public type: string,
        public data: ObjectiveData,
    ) { }
}

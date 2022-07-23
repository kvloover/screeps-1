import { Pathing } from "creeps/pathing";
import { singleton } from "tsyringe";
import { ClaimerRole } from "./claimer-role";

import profiler from "screeps-profiler";

@singleton()
export class ReserverRole extends ClaimerRole {
    name: string = 'reserver';
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(protected pathing: Pathing) { super(pathing); }
}

profiler.registerClass(ReserverRole, 'ReserverRole');

@singleton()
export class ConquererRole extends ClaimerRole {
    name: string = 'conquerer';
    prio = 2;
    phase = { start: 1, end: 9 };

    constructor(protected pathing: Pathing) { super(pathing); }
}

profiler.registerClass(ConquererRole, 'ConquererRole');

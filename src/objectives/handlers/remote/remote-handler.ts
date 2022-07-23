import { singleton } from "tsyringe";
import { Logger } from "logger";

import { Handler } from "objectives/entities/handler";
import { ObjectiveData } from "objectives/entities/objective";
import { Objective } from "repos/objectives/objective";
import { CreepState } from "utils/creep-state";
import { isMyRoom } from "utils/utils";

@singleton()
export class RemoteHandler implements Handler {

    type='remote';

    generateObjectives(existing: Objective[]): Objective[] {
        throw new Error("Method not implemented.");
    }

    handle(obj: Objective): boolean {
        throw new Error("Method not implemented.");
    }

}

import { injectable, injectAll } from "tsyringe";

import { Manager, Managers } from "manager";
import { Logger } from "logger";

@injectable()
export class GameWorld {

    constructor(
        private log: Logger,
        @injectAll(Managers.token) private managers: Manager[]
        ) { }

    public cleanMemory(): void {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }

    public run(): void {
        this.log.Important(`Current game tick is ${Game.time}`);
        this.cleanMemory();

        this.managers.forEach(manager => {
          manager.run();
        });
    }

}

import { container, injectable, injectAll } from "tsyringe";

import { Manager, Managers } from "manager";
import { Logger } from "logger";

@injectable()
export class GameWorld {

    constructor(private log: Logger) { }

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

        _.forEach(Game.rooms, room => {
            const managers = container.resolveAll<Manager>(Managers.token);
            managers.forEach(m => m.run(room));
        });
    }

}

import { container, injectable } from "tsyringe";

import { Logger } from "logger";
import { Manager, Managers } from "manager";
import { Persistency, Persistent } from "tasks/Persistent";

@injectable()
export class GameWorld {

    constructor(private log: Logger) { }

    public cleanMemory(persistent: Persistent[]): void {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                const id = Memory.creeps[name].id;
                if (id) { persistent.forEach(p => p.clearReference(id)); }
                delete Memory.creeps[name];
            }
        }
    }

    public run(): void {
        // this.log.Important(`Current game tick is ${Game.time}`);
        Persistency.Initialize();

        // ? use resolveScope and resolve seperate for rooms ?
        const persistency = container.resolveAll<Persistent>(Persistency.token);
        this.cleanMemory(persistency);
        persistency.forEach(persistent => persistent.restore());

        _.forEach(Game.rooms, room => {
            const managers = container.resolveAll<Manager>(Managers.token);
            managers.forEach(m => m.run(room));
        });

        // TODO time constraint ? > limit manager executions to make sure persistency is stored ?
        persistency.forEach(persistent => persistent.save());
    }

}

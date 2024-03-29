import { container, singleton } from "tsyringe";

import { Logger } from "logger";
import { Manager, Managers } from "manager";
import { Persistency, Persistent } from "repos/persistent";
import { GarbageCollector } from "utils/garbage-collect";
import { Brain } from "objectives/brain";
// import { RoleService, RoleServices } from "creeps/roles/role-service-registry";

@singleton()
export class GameWorld {

    constructor(private log: Logger) {
        this.log.info('GameWorld', 'GameWorld initialized');
        global.lastReset = Game.time;
    }

    private cleanMemory(persistent: Persistent[]): void {
        if (!Memory.creeps) return;
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                const id = Memory.creeps[name].id;
                if (id) { persistent.forEach(p => p.clearReference(id)); }
                delete Memory.creeps[name];
            }
        }
    }

    private setIds(): void {
        if (!Memory.creeps) return;
        Object.entries(Memory.creeps)
            .forEach(([key, val]) => {
                if (Game.creeps[key]) {
                    val.id = Game.creeps[key].id
                }
            });
    }

    public run(): void {
        Persistency.Initialize();

        const persistency = container.resolveAll<Persistent>(Persistency.token);
        persistency.forEach(persistent => persistent.restore());

        // Clean old memory | TODO: move to GC ?
        this.cleanMemory(persistency);

        // Run brain
        container.resolve(Brain).process();

        // Main logic
        _.forEach(Game.rooms, room => {
            const managers = container.resolveAll<Manager>(Managers.token);
            managers.forEach(m => m.run(room));
        });

        // Store Id's for cleaning
        this.setIds();

        if (Game.time % 100 == 0) GarbageCollector.gc();

        // TODO time constraint ? > limit manager executions to make sure persistency is stored ?
        persistency.forEach(persistent => persistent.save());
    }

}

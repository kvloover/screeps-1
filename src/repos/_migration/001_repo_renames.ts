import { Task } from "repos/task";
import { injectable } from "tsyringe";

@injectable()
export class repo_renames {
    index: number = 1;

    public migrate(): void {
        console.log(`Migrating repo renames`);

        const curMemory = Memory.persistency as any;

        const midstream: Task[] = curMemory['midstream'] || [];

        Memory.persistency.link_demand = midstream.filter(x => x.prio == 1);
        Memory.persistency.link_supply = curMemory['provider'] || [];
        Memory.persistency.link_supply_utility = curMemory['utility'] || [];

        Memory.persistency.container_demand = midstream.filter(x => x.prio == 2);
        Memory.persistency.container_demand_temp = []; // new

        Memory.persistency.spawn_demand = curMemory['demand'] || [];

        const supply: Task[] = curMemory['supply'] || [];
        const storage: Task[] = curMemory['storage'] || [];
        Memory.persistency.storage_demand = storage.filter(x => x.prio != 3);
        Memory.persistency.storage_supply = supply.filter(x => x.prio == 2);

        Memory.persistency.container_supply = supply.filter(x => x.prio == 1); // ! includes drops but will be automaticly migrate upon completing

        Memory.persistency.terminal_demand = storage.filter(x => x.prio == 3);
        Memory.persistency.terminal_supply = supply.filter(x => x.prio == 3);

    }
}

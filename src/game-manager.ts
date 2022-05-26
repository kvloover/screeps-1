import { injectable } from "tsyringe";

import { Manager } from "manager";

injectable()
export class GameManager implements Manager {

    constructor() { }

    public cleanMemory(): void {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }

    public run(): void {
        console.log(`Current game tick is ${Game.time}`);
        this.cleanMemory();
    }

}

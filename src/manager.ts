import { registry } from "tsyringe";

import { CreepsManager } from "creeps";
import { RoomManager } from "room";
import { TowerManager } from "structures";

export interface Manager {
    run(): void;
}

@registry([
    { token: Managers.token, useToken: RoomManager },
    { token: Managers.token, useToken: CreepsManager },
    { token: Managers.token, useToken: TowerManager },
])
export abstract class Managers {
    static readonly token = Symbol('Manager');
}

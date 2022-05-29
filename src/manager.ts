import { registry } from "tsyringe";

import { RoomManager } from "room";
import { CreepsManager } from "creeps";
import { TowerManager, SpawnManager } from "structures";

export interface Manager {
    run(room: Room): void;
}

@registry([
    { token: Managers.token, useToken: RoomManager },
    { token: Managers.token, useToken: CreepsManager },
    { token: Managers.token, useToken: SpawnManager },
    { token: Managers.token, useToken: TowerManager },
])
export abstract class Managers {
    static readonly token = Symbol('Manager');
}

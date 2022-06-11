import { registry } from "tsyringe";

import { RoomManager } from "room";
import { CreepsManager } from "creeps";
import { TowerManager, SpawnManager, LinkManager } from "structures";

export interface Manager {
    run(room: Room): void;
}

@registry([
    { token: Managers.token, useToken: RoomManager },
    { token: Managers.token, useToken: CreepsManager },
    { token: Managers.token, useToken: SpawnManager },
    { token: Managers.token, useToken: TowerManager },
    { token: Managers.token, useToken: LinkManager },
])
export abstract class Managers {
    static readonly token = Symbol('Manager');
}

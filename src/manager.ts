import { registry } from "tsyringe";

import { GameManager } from "game-manager";
import { RoomManager } from "room";
import { CreepsManager } from "creeps";
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

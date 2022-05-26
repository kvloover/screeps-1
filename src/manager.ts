import { registry } from "tsyringe";

import { CreepsManager } from "creeps";
import { RoomManager } from "room";

export interface Manager {
    run(): void;
}

@registry([
    { token: Managers.token, useToken: RoomManager },
    { token: Managers.token, useToken: CreepsManager },
])
export abstract class Managers {
    static readonly token = Symbol('Manager');
}

import { registry } from "tsyringe";

import { InitialLinkMemory } from "./initial-link-memory";
import { InitialSpawnMemory } from "./initial-spawn-memory";
import { InitialTowerMemory } from "./initial-tower-memory";

@registry([
    { token: InitialStructMemory.token, useToken: InitialLinkMemory },
    { token: InitialStructMemory.token, useToken: InitialSpawnMemory },
    { token: InitialStructMemory.token, useToken: InitialTowerMemory },
])
export abstract class InitialStructMemory {
    static readonly token = Symbol('InitialStructMemory');
}

export interface InitialMemory<T extends StructureConstant> {
    type: T;
    create(room: Room, structure: Structure<T>): RoomObjectMemory<T>
}

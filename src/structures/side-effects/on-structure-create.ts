import { registry } from "tsyringe";
import { OnStorageCreate } from "./on-storage-create";


@registry([
    { token: OnStructureCreate.token, useToken: OnStorageCreate },
])
export abstract class OnStructureCreate {
    static readonly token = Symbol('OnStructureCreate');
}

export interface OnCreate<T extends StructureConstant> {
    type: T;
    onCreate(room: Room, structure: Structure<T>): void; // TODO move side effect to other class
}

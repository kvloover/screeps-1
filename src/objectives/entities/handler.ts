import { Objective } from "./objective";

export interface Handler {
    generateObjectives(): Objective[];
    handle(obj: Objective): boolean;
}

import { Objective } from "repos/objectives/objective";

export interface Handler {
    type: string;
    generateObjectives(): Objective[];
    handle(obj: Objective): boolean;
}

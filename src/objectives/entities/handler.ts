import { Objective } from "repos/objectives/objective";

export interface Handler {
    type: string;
    generateObjectives(existing: Objective[]): Objective[];
    handle(obj: Objective): boolean;
}

import { Objective } from "repos/objectives/objective";

export interface Handler {
    type: string;
    generateObjectives(existing: Objective[], other: Objective[]): Objective[];
    handle(obj: Objective): boolean;
}

import { Objective } from "repos/objectives/objective";
import { ObjectiveRepo } from "repos/objectives/objectives-repo";
import { injectAll, singleton } from "tsyringe";

import { Handler } from "./entities/handler";
import { Handlers } from "./handler-service";

@singleton()
export class Brain {

    constructor(
        @injectAll(Handlers.token) private handlers: Handler[],
        private repo: ObjectiveRepo
    ) { }

    public process(): void {

        const objectives = this.repo.list();

        for (let handler of this.handlers) {
            const existing = objectives.filter(i => i.type == handler.type);
            const others = objectives.filter(i => i.type != handler.type);
            const newObj = handler.generateObjectives(existing, others);

            // Handle prev objectives first
            for (let obj of existing) {
                if (handler.handle(obj)) {
                    this.repo.removeById(obj.id);
                }
            }

            // If persisting, keep them in memory
            for (let obj of newObj) {
                if (handler.handle(obj)) {
                    this.repo.removeById(obj.id);
                } else {
                    this.repo.add(obj);
                    objectives.push(obj);
                }
            }
        }
    }

}

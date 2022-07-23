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
            const newObj = handler.generateObjectives();
            newObj.forEach(obj => this.repo.add(obj));

            const handlerObjectives = newObj.concat(objectives.filter(i => i.type == handler.type));
            for (let obj of handlerObjectives) {
                if (handler.handle(obj)) {
                    this.repo.removeById(obj.id);
                }
            }
        }
    }

}
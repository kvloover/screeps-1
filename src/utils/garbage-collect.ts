import { Persistency, Persistent } from "repos/persistent";
import { container } from "tsyringe";

export class GarbageCollector {

    public static gc(): void {
        // Clear up persistent repos for artifacts
        const persistent = container.resolveAll<Persistent>(Persistency.token);
        persistent.forEach(p => p.gc());
    }

}

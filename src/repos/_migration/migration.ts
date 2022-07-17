import { container, registry } from "tsyringe";
import { repo_renames } from "./001_repo_renames";

export interface Migration {
    index: number;
    migrate(): void;
}

@registry([
    { token: Migrations.token, useToken: repo_renames },
])
export abstract class Migrations {
    static readonly token = Symbol('Migrations');

    public static Migrate(): void {
        const migrations = container.resolveAll<Migration>(Migrations.token);
        migrations
            .filter(m => m.index > (Memory.persistency.migration || 0))
            .sort((a, b) => a.index - b.index)
            .forEach(m => m.migrate());
    }
}

declare global {
    interface Persistency {
        migration: number | undefined;
    }
}



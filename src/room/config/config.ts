export class config {
    public template: string[] = ["work", "carry", "move"];
    public roles: roleConfig[] = [];
}

export class roleConfig {
    public priority: number = 9;
    public role: string | undefined;
    public count: number = 0;
    public template: string[] | undefined;
}

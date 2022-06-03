export class config {
    [key: string]: stageConfig;
}

export class stageConfig {
    public order: number = 0;
    public energy: number = 0;
    public controller: number = 0;
    public creeps: number = 0;
    public template: string[] = ["work", "carry", "move"];
    public roles: roleConfig[] = [];
}

export class roleConfig {
    public priority: number = 9;
    public role: string = '';
    public emergency: boolean = false;
    public count: number = 0;
    public template: string[] | undefined;
}

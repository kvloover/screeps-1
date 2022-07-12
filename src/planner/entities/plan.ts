export type PoiKey = 'source' | 'controller' | 'anchor';
export type PlanKey = 'core' | 'lab' | 'extensions' | 'road';
export type PostPlanKey = 'perimeter' | 'links';
export type PlannedKey = PlanKey | PostPlanKey;

export interface IPlan {
    name: PlanKey;
    create: PlanCreateFn;
}

export interface IPostPlan {
    name: PostPlanKey;
    create: PostPlanCreateFn;
}

export type PlanFn = () => StructurePlan[][];
export type PlanCreateFn = (roomName: string, poi: Poi, terrain: CostMatrix) => StructurePlan[][];
export type PostPlanCreateFn = (roomName: string, poi: Poi, terrain: CostMatrix, planned: StructurePlan[][]) => StructurePlan[][];

export type Poi = {
    [key in PoiKey]?: RoomPosition[];
};

export interface StructurePlan {
    plan: PlannedKey;
    type: BuildableStructureConstant;
    pos: RoomPosition;
}

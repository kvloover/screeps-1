export interface IPlan {
    name: string;
    create: PlanCreateFn;
}

export interface IPostPlan {
    name: string;
    create: PostPlanCreateFn;
}

export type PlanFn = () => PlannedStructure[][];
export type PlanCreateFn = (roomName: string, poi: Poi, terrain: CostMatrix) => PlannedStructure[][];
export type PostPlanCreateFn = (roomName: string, poi: Poi, terrain: CostMatrix, planned: PlannedStructure[][]) => PlannedStructure[][];

export interface Poi {
    [key: string]: RoomPosition[]
}

export interface PlannedStructure {
    type: BuildableStructureConstant;
    pos: RoomPosition;
}

export const BUILDING_MAP = new Map<BuildableStructureConstant, number>(
    [
        [STRUCTURE_ROAD, 201],
        [STRUCTURE_SPAWN, 260],
        [STRUCTURE_EXTENSION, 261],
        [STRUCTURE_CONTAINER, 262],
        [STRUCTURE_STORAGE, 263],
        [STRUCTURE_LINK, 264],
        [STRUCTURE_TERMINAL, 265],
        [STRUCTURE_RAMPART, 266],
        [STRUCTURE_WALL, 267],
        [STRUCTURE_TOWER, 268],
        [STRUCTURE_OBSERVER, 269],
        [STRUCTURE_NUKER, 270],
        [STRUCTURE_POWER_SPAWN, 271],
        [STRUCTURE_EXTRACTOR, 272],
        [STRUCTURE_LAB, 273],
        [STRUCTURE_FACTORY, 274],
    ]);

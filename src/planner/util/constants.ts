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

export const BUILD_PRIORITY = new Map<StructureConstant, number>([
        // Defense
        [STRUCTURE_TOWER, 1],
        [STRUCTURE_RAMPART, 2],
        [STRUCTURE_WALL, 3],
        // Spawn
        [STRUCTURE_SPAWN, 4],
        [STRUCTURE_EXTENSION, 5],
        // Logistics
        [STRUCTURE_STORAGE, 6],
        [STRUCTURE_LINK, 7],
        // Utility
        [STRUCTURE_CONTAINER, 8],
        [STRUCTURE_ROAD, 9],
        // Factory
        [STRUCTURE_TERMINAL, 11],
        [STRUCTURE_EXTRACTOR, 12],
        [STRUCTURE_LAB, 13],
        [STRUCTURE_FACTORY, 14],
        // Late game
        [STRUCTURE_POWER_SPAWN, 15],
        [STRUCTURE_OBSERVER, 16],
        [STRUCTURE_NUKER, 17],
    ]);

export const STRUCTURE_BUDGET: { [key in BuildableStructureConstant]: { [rcl: number]: number } }
    = {
    extractor: { 6: 1 },
    constructedWall: { 0: -1 },
    rampart: { 0: -1 },
    road: { 0: -1 },
    container: { 0: 5 },
    spawn: { 1: 1, 6: 2, 8: 3 },
    extension: { 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 },
    tower: { 3: 1, 5: 2, 7: 3, 8: 6 },
    link: { 5: 2, 6: 3, 7: 4, 8: 6 },
    storage: { 4: 1 },
    lab: { 6: 3, 7: 6, 8: 10 },
    terminal: { 6: 1 },
    factory: { 7: 1 },
    nuker: { 8: 1 },
    powerSpawn: { 8: 1 },
    observer: { 8: 1 },
};

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

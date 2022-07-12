export interface StampCollection {
    plans: Stamp[];
}

export interface Stamp {
    priority: number;
    name: string;
    size: Position;
    buildings: Building;
}

export interface Building {
    [key: string]: BuildingData;
}

export interface BuildingData {
    pos: Position[];
}

export interface Position {
    x: number;
    y: number;
}

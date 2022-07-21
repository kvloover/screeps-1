export interface Rect { x1: number, x2: number, y1: number, y2: number }
export interface Tile { x: number, y: number }

export interface Graph {
    // Statefull object, functions alter state
    New_edge: (u: number, v: number, c: number) => void,
    Bfs: (s: number, t: number) => boolean,
    Dfsflow: (u: number, f: number, t: number, c: number[]) => number,
    Bfsthecut: (s: number) => any[],
    Calcmincut: (s: number, t: number) => number,
}

export function create_graph(roomname: string, rect: Rect[], bounds: Rect, visualise?: boolean): Graph
export function delete_tiles_to_dead_ends(roomname: string, cut_tiles_array: Tile[]): void
export function GetCutTiles(roomname: string, rect: Rect[], bounds?: Rect, verbose?: boolean, visualise?: boolean): Tile[]
export function test(roomname: string): string

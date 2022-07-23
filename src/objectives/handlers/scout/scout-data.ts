export interface ScoutData {
    room: string;
    lastVisited: number;
    lastVisitedByRoom: string;
    depth: number;

    sources: number | undefined;
    controller: RoomPosition | undefined;
    level: number | undefined;

    owner: string | undefined;
    reservation: string | undefined;
    hostilePower: number;
}

declare global {

    namespace NodeJS {
        interface Global {
            scoutData: { [room: string]: ScoutData };
        }
    }

}

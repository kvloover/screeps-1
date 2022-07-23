export interface ScoutData {
    room: string;
    lastVisited: number;
    lastVisitedByRoom: string;
    depth: number;

    controller: RoomPosition | undefined;

    owner: string | undefined;
    reservation: string | undefined;
    level: number | undefined;
}

declare global {

    namespace NodeJS {
        interface Global {
            scoutData: { [room: string]: ScoutData };
        }
    }

}

export interface ScoutData {
    room: string;
    lastVisited: number;
    lastVisitedByRoom: string;
    controller: RoomPosition | undefined;

    owner: string | undefined;
    level: number | undefined;
}

declare global {

    namespace NodeJS {
        interface Global {
            scoutData: { [room: string]: ScoutData };
            scoutRequest: { [room: string]: ScoutData };
        }
    }

}

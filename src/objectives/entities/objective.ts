// export interface Objective {
//     master: string;
//     type: string;
//     data: ObjectiveData
// }

export interface ObjectiveData {
    started: number;
}

export interface ObjectiveRoomData extends ObjectiveData {
    room: string;
}

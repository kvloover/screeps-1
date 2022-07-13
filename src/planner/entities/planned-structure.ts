import { packPos } from "utils/packrat";

let plannedStructures: Record<string, PlannedStructure> = {};

export class PlannedStructure<T extends BuildableStructureConstant = BuildableStructureConstant> {
    constructor(
        public pos: RoomPosition,
        public structureType: T,
    ) {
        const key = packPos(pos) + structureType;
        if (plannedStructures[key]) {
            return plannedStructures[key] as PlannedStructure<T>;
        } else {
            plannedStructures[key] = this;
        }
    }
}

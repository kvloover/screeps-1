import { packPos } from "utils/packrat";

let plannedStructures: Record<string, PlannedStructure> = {};

export class PlannedStructure<T extends BuildableStructureConstant = BuildableStructureConstant> {
    private lastSurveyed = 0;
    private lastGet = 0;
    private _structure: Structure<T> | undefined = undefined;
    constructor(
        public pos: RoomPosition,
        public structureType: T,
        public structureId?: Id<Structure<T>>
    ) {
        const key = packPos(pos) + structureType;
        if (plannedStructures[key]) {
            return plannedStructures[key] as PlannedStructure<T>;
        } else {
            plannedStructures[key] = this;
        }
    }

    get structure() {
        if (!this.structureId) return undefined;
        if (Game.time !== this.lastGet) {
            const struct = Game.getObjectById(this.structureId);
            this._structure = struct ? struct : undefined;
            if (!this._structure) return undefined;
            this.lastGet = Game.time;
        }
        return this._structure;
    }

    get constructionSite() {
        return this.pos.lookFor(LOOK_CONSTRUCTION_SITES).find(c => c.structureType === this.structureType);
    }

    survey() {
        // rework
        if (Game.time === this.lastSurveyed) return !!this.structure; // Only survey once per tick
        if (Game.rooms[this.pos.roomName]) {
            if (this.structure) {
                return true; // Actual structure is visible
            } else {
                this.structureId = Game.rooms[this.pos.roomName]
                    .lookForAt(LOOK_STRUCTURES, this.pos)
                    .find(s => s.structureType === this.structureType)
                    ?.id as Id<Structure<T>>;
                if (this.structure) return true;
            }
        } else if (this.structureId) {
            return true; // Cached structure exists
        }
        return false; // Structure does not exist
    }
}

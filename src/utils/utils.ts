// misc utils
// https://github.com/Jomik/screeps-ai/blob/7b8ca87028df257471f43dc9b13b9ee362bf7f30/packages/bot/src/utils/index.ts#L18

export const isDefined =
  <T>(value: T | undefined | null): value is T => value !== undefined && value !== null;

export const isTombStone =
  (item: any): item is Tombstone => isDefined((item as Tombstone)?.store)

export const isRuin =
  (item: any): item is Ruin => isDefined((item as Ruin)?.store)

export const isResource =
  (item: any): item is Resource<ResourceConstant> => isDefined((item as Resource<ResourceConstant>)?.amount)

export const isResourceConstant =
  (item: any): item is ResourceConstant => isDefined((item as ResourceConstant))

export const isStructure =
  (item: any): item is Structure => isDefined((item as Structure)?.structureType)

export const isOwnStructure =
  (item: any): item is OwnedStructure => isDefined((item as OwnedStructure)?.my)

export const isStoreStructure =
  (item: any): item is AnyStoreStructure => isDefined((item as AnyStoreStructure)?.store);

export const isLinkStructure =
  (item: any): item is StructureLink => isDefined((item as StructureLink)?.store);

export const isConstruction =
  (item: any): item is ConstructionSite => isDefined((item as ConstructionSite)?.progress);

export const isTower =
  (item: any): item is StructureTower => isDefined((item as StructureTower)?.my);

export const isTerminal =
  (item: any): item is StructureTerminal => isDefined((item as StructureTerminal)?.my);

export const isController =
  (item: any): item is StructureController => item instanceof StructureController;

export const isContainer =
  (item: any): item is StructureContainer => item instanceof StructureContainer;

export const isHasPos =
  (item: any): item is HasPos => isDefined((item as HasPos)?.pos);

export const whoAmI =
  () => (Object.values(Game.structures).find(s => isOwnStructure(s)) as OwnedStructure)?.owner?.username ?? 'N/A';

export const isMyRoom =
  (room: Room) => room.controller && room.controller.my; // && room.controller.owner.username == whoAmI();

export const isRemote =
  (room: Room) => Object.values(Memory.rooms).some(i => i.remote === room.name);

export const parseRoomName =
  (roomName: string): { x: number, y: number } => {
    const coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g;
    const match = coordinateRegex.exec(roomName)!;

    // 0-0 is top left corner
    const xDir = match[1] === 'E' ? 1 : -1;
    const x = Number(match[2]);
    const yDir = match[3] === 'S' ? 1 : -1;;
    const y = Number(match[4]);

    return { x: xDir * x, y: yDir * y }
  }

export const relativeExitTo =
  (roomName: string, target: string): { xDir: number, yDir: number } => {
    // Estimation : can be inacurate, quick way to fetch normal axis direction
    //~ 4 times more efficient than Game.map.findExit
    const current = parseRoomName(roomName);
    const dest = parseRoomName(target);

    const x = dest.x == current.x ? 0 : dest.x > current.x ? 1 : -1;
    const y = dest.y == current.y ? 0 : dest.y > current.y ? 1 : -1;

    return { xDir: x, yDir: y };
  }

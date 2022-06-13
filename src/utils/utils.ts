// misc utils
// https://github.com/Jomik/screeps-ai/blob/7b8ca87028df257471f43dc9b13b9ee362bf7f30/packages/bot/src/utils/index.ts#L18

export const isDefined =
  <T>(value: T | undefined | null): value is T => value !== undefined && value !== null;

export const isStoreStructure =
  (item: any): item is AnyStoreStructure => isDefined((item as AnyStoreStructure)?.store);

export const isLinkStructure =
  (item: any): item is StructureLink => isDefined((item as StructureLink)?.store);

export const isTombStone =
  (item: any): item is Tombstone => isDefined((item as Tombstone)?.store)

export const isRuin =
  (item: any): item is Ruin => isDefined((item as Ruin)?.store)

export const isResource =
  (item: any): item is Resource<ResourceConstant> => isDefined((item as Resource<ResourceConstant>)?.amount)

export const isResourceConstant =
  (item: any): item is ResourceConstant => isDefined((item as ResourceConstant))

export const isController =
  (item: any): item is StructureController => isDefined((item as StructureController)?.id)

export const isOwnStructure =
  (item: any): item is OwnedStructure => isDefined((item as OwnedStructure)?.id)

export const whoAmI =
  () => (Object.values(Game.structures).find(s => isOwnStructure(s)) as OwnedStructure)?.owner?.username ?? 'N/A';

export const isMyRoom =
  (room: Room) => room.controller && room.controller.my; // && room.controller.owner.username == whoAmI();

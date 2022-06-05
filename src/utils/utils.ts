// misc utils
// https://github.com/Jomik/screeps-ai/blob/7b8ca87028df257471f43dc9b13b9ee362bf7f30/packages/bot/src/utils/index.ts#L18

export const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== undefined && value !== null;

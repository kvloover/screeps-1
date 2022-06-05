declare const global: { Memory?: Memory };

// there are two ways of saving Memory with different advantages and disadvantages
// 1. RawMemory.set(JSON.stringify(Memory));
// + ability to use custom serialization method
// - you have to pay for serialization
// - unable to edit Memory via Memory watcher or console
// 2. RawMemory._parsed = Memory;
// - undocumented functionality, could get removed at any time
// + the server will take care of serialization, it doesn't cost any CPU on your site
// + maintain full functionality including Memory watcher and console

// this implementation uses the official way of saving Memory

// https://github.com/Jomik/screeps-ai/blob/7b8ca87028df257471f43dc9b13b9ee362bf7f30/packages/bot/src/utils/memory-hack.ts
// Adapted from https://github.com/screepers/screeps-snippets/blob/8b557a3fcb82cb734fca155b07d5a48622f9da60/src/misc/JavaScript/Memory%20Cache.js

export const wrapMemory = (fn: () => void) => {
  const memory = Memory;

  return () => {
    delete global.Memory;
    global.Memory = memory;

    fn();

    RawMemory.set(JSON.stringify(Memory));
  };
};

import "reflect-metadata";
import { container } from "tsyringe";

import { ErrorMapper } from "utils/ErrorMapper";
import { wrapMemory } from "utils/memory-hack";
import { ExConsole } from "utils/console";

import { GameWorld } from "game-world";

export const loop = ErrorMapper.wrapLoop(
  wrapMemory(
    () => {
      ExConsole.init();
      container.resolve(GameWorld)
        .run();
    }
  )
);

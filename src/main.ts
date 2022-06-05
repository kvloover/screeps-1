import "reflect-metadata";
import { container } from "tsyringe";

import { ErrorMapper } from "utils/ErrorMapper";
import { wrapWithMemoryHack } from "utils/memory-hack";
import { ExConsole } from "utils/console";

import { GameWorld } from "game-world";

export const loop = ErrorMapper.wrapLoop(
  //wrapWithMemoryHack( // Disabled for now to allow console memory editing
    () => {

      ExConsole.init();

      container.resolve(GameWorld)
        .run();
    }
  //)
);

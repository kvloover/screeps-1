import "reflect-metadata";
import { container } from "tsyringe";

import { ErrorMapper } from "utils/ErrorMapper";
import { wrapMemory } from "utils/memory-hack";
import { ExConsole } from "utils/console";

import { GameWorld } from "game-world";

import profiler from 'screeps-profiler';

profiler.enable();
ExConsole.init();

profiler.registerObject(container, 'container');

export const loop =
  ErrorMapper.wrapLoop(
    wrapMemory(
      () => {
        profiler.wrap(function () {
          container.resolve(GameWorld).run();
        });
      }
    )
  );

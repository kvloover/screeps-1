import "reflect-metadata";
import { container } from "tsyringe";

import { ErrorMapper } from "utils/error-mapper";
import { wrapMemory } from "utils/memory-hack";
import { exportStats } from "utils/stats";

import "traveller/traveler";
import "utils/misc-hacks";

import { ExConsole } from "consoles/extended-console";
import { TestConsole } from "consoles/test-console";
import { MigrateConsole } from "consoles/migrate-console";

import { GameWorld } from "game-world";

import profiler from 'screeps-profiler';

profiler.enable();

ExConsole.init();
TestConsole.init();
MigrateConsole.init();

export const loop =
  ErrorMapper.wrapLoop(
    wrapMemory(
      () => {
        profiler.wrap(function () {
          container.resolve(GameWorld).run();
          exportStats();
        });
      }
    )
  );

import "reflect-metadata";
import { container } from "tsyringe";

import { ErrorMapper } from "utils/error-mapper";
import MemHack from "utils/memory-hack";
import { exportStats } from "utils/stats";

import "traveller/traveler";
import "utils/misc-hacks";
import "utils/distance-util";
import "utils/room-visual";

import { ExConsole } from "consoles/extended-console";
import { TestConsole } from "consoles/test-console";

import { GameWorld } from "game-world";

import { Migrations } from "repos/_migration/migration";
import { onRespawn, resetRespawned } from "utils/respawn";
import { initializeOnRespawn } from "init-respawn";

import profiler from 'screeps-profiler';

profiler.enable();

ExConsole.init();
TestConsole.init();

onRespawn(initializeOnRespawn)

export const loop =
  ErrorMapper.wrapLoop(
    () => {

      if (Game.cpu.bucket < 200) {
        console.log(`Waiting for bucket to reach 200 (currently ${Game.cpu.bucket})`);
        return;
      }

      MemHack.pretick();

      Migrations.Migrate();

      profiler.wrap(function () {
        container.resolve(GameWorld).run();
        exportStats();
      });

      resetRespawned(); // prep for OnRespawn - TODO set only on detecting no rooms/spawns/...
    }
  );

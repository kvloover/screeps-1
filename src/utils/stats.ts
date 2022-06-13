// Call this function at the end of your main loop

export function exportStats() {
  // Reset stats object
  Memory.stats = {
    time: Game.time,
    gcl: {},
    rooms: {},
    cpu: {},
  };

  // Collect room stats
  for (let roomName in Game.rooms) {
    let room = Game.rooms[roomName];
    if (room.controller && room.controller.my) {
      Memory.stats.rooms[roomName] = {};
      Memory.stats.rooms[roomName].storageEnergy = (room.storage ? room.storage.store.energy : 0);
      Memory.stats.rooms[roomName].terminalEnergy = (room.terminal ? room.terminal.store.energy : 0);
      Memory.stats.rooms[roomName].energyAvailable = room.energyAvailable;
      Memory.stats.rooms[roomName].energyCapacityAvailable = room.energyCapacityAvailable;
      Memory.stats.rooms[roomName].controllerProgress = room.controller.progress;
      Memory.stats.rooms[roomName].controllerProgressTotal = room.controller.progressTotal;
      Memory.stats.rooms[roomName].controllerLevel = room.controller.level;
    }
  }

  // Collect GCL stats
  Memory.stats.gcl.progress = Game.gcl.progress;
  Memory.stats.gcl.progressTotal = Game.gcl.progressTotal;
  Memory.stats.gcl.level = Game.gcl.level;

  // Collect CPU stats
  Memory.stats.cpu.bucket = Game.cpu.bucket;
  Memory.stats.cpu.limit = Game.cpu.limit;
  Memory.stats.cpu.used = Game.cpu.getUsed();
}

declare global {
  interface Memory {
    stats: {
      time: number,
      gclMilestones?: Record<number, number>,
      gcl: {
        progress?: number,
        progressTotal?: number,
        level?: number,
      },
      cpu: {
        bucket?: number,
        limit?: number,
        used?: number,
      },
      rooms: {
        [id: string]: {
          storageEnergy?: number,
          terminalEnergy?: number,
          energyAvailable?: number,
          energyCapacityAvailable?: number,
          controllerProgress?: number,
          controllerProgressTotal?: number,
          controllerLevel?: number
        }
      }
    }
  }
}


export class MigrateConsole {

    static init() {
        global.migrate = {
            // migrate_links: this.migrate_links
        }
    }

    // static migrate_links(roomName: string): string {
    //     if (Game.rooms.hasOwnProperty(roomName)) {
    //         const room = Game.rooms[roomName];
    //         if (!room.memory.objects) room.memory.objects = {};
    //         if (!room.memory.objects.link) room.memory.objects.link = [];
    //         room.memory.links
    //             .forEach(l => room.memory.objects?.link?.push(<LinkMemory>{ id: l.id, pos: l.pos, storage: l.storage }));
    //         return `room links init for ${roomName}.`;
    //     }
    //     return `Room not known: ${roomName}`
    // }

}

declare global {
    namespace NodeJS {
        interface Global {
            migrate?: MigrateConsole;
        }

        interface MigrateConsole {
            // migrate_links: (roomName: string) => string;
        }
    }
}

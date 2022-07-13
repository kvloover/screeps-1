import { TimingKey, TIMINGS_MAIN } from "global";
import { random } from "lodash";

export class Timings {

    public static timingForKeyAndRoom(key: TimingKey, roomName: string): [main: number, offset: number] {
        let offsets = global.timingOffset;
        if (!offsets) {
            global.timingOffset = {};
            offsets = global.timingOffset;
        }
        if (!offsets[key]) {
            offsets[key] = {};
        }

        const refs = offsets[key];
        if (refs) {
            const offset = refs[roomName];
            if (offset) {
                return [TIMINGS_MAIN[key], offset];
            } else {
                const rand = random(1, TIMINGS_MAIN.plan);
                refs[roomName] = rand;
                return [TIMINGS_MAIN[key], rand];
            }
        }
        return [TIMINGS_MAIN.plan, 0];
    }

}

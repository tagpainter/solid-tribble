import { lerp } from "./utils/math";
import type { StrokePoint } from "./stroke-point";

export class StrokeStabilizer {
    private window: StrokePoint[] = [];

    private size: number;

    constructor(size = 10) {
        this.size = size;
    }

    next(raw: StrokePoint): StrokePoint {
        if (this.window.length < this.size) {
            for (let i = 0; i < this.size - 1; i++) {
                this.window.push(raw);
            }
        }

        this.window.push(raw);

        if (this.window.length > this.size) this.window.shift();

        const n = this.window.length;

        let sx = 0,
            sy = 0,
            sp = 0,
            stx = 0,
            sty = 0;

        for (const pt of this.window) {
            sx += pt.x;
            sy += pt.y;
            sp += pt.pressure;
            stx += pt.tiltX;
            sty += pt.tiltY;
        }

        const result = {
            x: sx / n,
            y: sy / n,
            pressure: sp / n,
            tiltX: stx / n,
            tiltY: sty / n,
            timeStamp: raw.timeStamp,
        };

        return result;
    }

    close(): StrokePoint[] {
        const result: StrokePoint[] = [];
        const last = this.window[this.window.length - 1];
        for (let i = 0; i < this.window.length; i++) {
            const progress = i / (this.window.length - 1);
            const point = this.next(last);
            point.pressure = lerp(point.pressure, last.pressure, progress);
            result.push(point);
        }
        return result;
    }
}

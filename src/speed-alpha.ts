import { mapRange } from "./utils/math";

const MIN_DISTANCE = 0;
const MAX_DISTANCE = 100;
const MIN_ALPHA = 0.5;
const MAX_ALPHA = 1.0;

export class SpeedAlpha {
    private currX;
    private currY;
    private prevX;
    private prevY;
    private time;

    constructor() {
        this.currX = 0;
        this.currY = 0;
        this.prevX = 0;
        this.prevY = 0;
        this.time = 0;
    }

    down(x: number, y: number, time: number) {
        this.currX = x;
        this.currY = y;
        this.prevX = x;
        this.prevY = y;
        this.time = time;
    }

    move(x: number, y: number, time: number) {
        this.currX = x;
        this.currY = y;

        const dx = this.prevX - this.currX;
        const dy = this.prevY - this.currY;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = mapRange(dist, MIN_DISTANCE, MAX_DISTANCE, MAX_ALPHA, MIN_ALPHA);

        this.time = time;
        this.prevX = x;
        this.prevY = y;

        return alpha;
    }
}

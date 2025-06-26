import { mapRange } from "./utils/math";

const MIN_DISTANCE = 0;
const MAX_DISTANCE = 30;
const MIN_ALPHA = 0.75;
const MAX_ALPHA = 1.0;

export class SpeedAlpha {
    private prevX: number;
    private prevY: number;
    private emaAlpha: number;
    private smoothing: number;

    /**
     * @param smoothing
     */
    constructor(smoothing: number = 0.2) {
        this.prevX = 0;
        this.prevY = 0;
        this.emaAlpha = MAX_ALPHA; // 초기 alpha
        this.smoothing = smoothing;
    }

    down(x: number, y: number, time: number) {
        this.prevX = x;
        this.prevY = y;
        this.emaAlpha = MAX_ALPHA;
    }

    move(x: number, y: number, time: number): number {
        const dx = x - this.prevX;
        const dy = y - this.prevY;
        const dist = Math.hypot(dx, dy);

        // 즉시 alpha 값
        const rawAlpha = mapRange(dist, MIN_DISTANCE, MAX_DISTANCE, MAX_ALPHA, MIN_ALPHA);

        // EMA 적용
        this.emaAlpha = rawAlpha * this.smoothing + this.emaAlpha * (1 - this.smoothing);

        this.prevX = x;
        this.prevY = y;

        return this.emaAlpha;
    }
}

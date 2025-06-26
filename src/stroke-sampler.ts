import { catmullRomStrokePoint, type StrokePoint } from "./stroke-point";

export class StrokeSampler {
    private spacing: number;
    private remainLength = 0;
    private points: StrokePoint[] = [];
    private lastSample?: StrokePoint;

    constructor(spacing: number) {
        this.spacing = spacing;
    }

    next(point: StrokePoint) {
        const last = this.points[this.points.length - 1];
        if (point.x === last?.x && point.y === last?.y) {
            return [];
        } else {
            return this.add(point);
        }
    }

    close(): StrokePoint[] {
        const last = this.points[this.points.length - 1];
        return this.add(last);
    }

    private add(point: StrokePoint): StrokePoint[] {
        if (this.points.length < 4) {
            this.points = [point, point, point, point];
        } else {
            this.points.shift();
            this.points.push(point);
        }
        return this.sample();
    }

    private sample(): StrokePoint[] {
        const [p0, p1, p2, p3] = this.points;
        const result: StrokePoint[] = [];

        const dx1 = p2.x - p1.x;
        const dy1 = p2.y - p1.y;
        const dx2 = p3.x - p2.x;
        const dy2 = p3.y - p2.y;

        const len1 = Math.hypot(dx1, dy1);
        const len2 = Math.hypot(dx2, dy2);

        const ux1 = dx1 / len1;
        const uy1 = dy1 / len1;
        const ux2 = dx2 / len2;
        const uy2 = dy2 / len2;

        const steps = this.adaptiveStepEstimate(p1, p2);
        const arcLengths: number[] = [0];
        const pts: StrokePoint[] = [catmullRomStrokePoint(p0, p1, p2, p3, 0)];

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const pt = catmullRomStrokePoint(p0, p1, p2, p3, t);
            pts.push(pt);
            const d = Math.hypot(pts[i - 1].x - pt.x, pts[i - 1].y - pt.y);
            arcLengths.push(arcLengths[i - 1] + d);
        }

        const totalLength = arcLengths[arcLengths.length - 1];
        let sampleLength = this.remainLength;

        while (sampleLength < totalLength) {
            const t = this.findT(arcLengths, sampleLength);
            const sample = catmullRomStrokePoint(p0, p1, p2, p3, t);

            const dx = this.lastSample ? sample.x - this.lastSample.x : 0;
            const dy = this.lastSample ? sample.y - this.lastSample.y : 0;

            const ux = (1 - t) * ux1 + t * ux2;
            const uy = (1 - t) * uy1 + t * uy2;

            const angle = Math.atan2(uy, ux);

            result.push({ ...sample, angle, dx, dy });
            this.lastSample = sample;

            sampleLength += this.spacing;
        }

        this.remainLength = sampleLength - totalLength;

        return result;
    }

    private findT(lengths: number[], target: number) {
        for (let i = 1; i < lengths.length; i++) {
            if (lengths[i] >= target) {
                const l0 = lengths[i - 1];
                const l1 = lengths[i];
                const ratio = (target - l0) / (l1 - l0);
                return (i - 1 + ratio) / (lengths.length - 1);
            }
        }
        return 1;
    }

    private adaptiveStepEstimate(p1: StrokePoint, p2: StrokePoint): number {
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        let value = Math.ceil((len / this.spacing) * 2);
        value = Math.max(1, Math.min(50, value));
        return value;
    }
}

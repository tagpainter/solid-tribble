import type { StrokePoint } from "./stroke-point";
import paper from "paper";

paper.setup([1, 1]);
paper.view.autoUpdate = false;
paper.settings.insertItems = false;

export class StrokeSnapSampler {
    private paths: paper.Path[];
    private path?: paper.Path;
    private spacing: number;
    private remainder: number;
    private lastOffset?: number;
    private lastPoint?: StrokePoint;
    private lastSample?: { x: number; y: number };

    constructor(paths: string[], spacing: number) {
        this.paths = paths.map((d) => new paper.Path(d));
        this.spacing = spacing;
        this.remainder = spacing;
    }

    private findNearestPath(point: { x: number; y: number }): paper.Path {
        let bestDist2 = Infinity;
        let bestPath: paper.Path | null = null;
        for (const p of this.paths) {
            const loc = p.getNearestLocation(point)!;
            const d2 = loc.point.getDistance(point) ** 2;
            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPath = p;
            }
        }
        return bestPath!;
    }

    next(point: StrokePoint): StrokePoint[] {
        // 1) 활성 패스 결정
        if (!this.path) {
            this.path = this.findNearestPath(point);
        }

        // 2) 현재/이전 offset
        const loc = this.path.getNearestLocation(point)!;
        const toOff = loc.offset;
        const fromOff = this.lastOffset;
        this.lastOffset = toOff;

        // 3) 첫 호출
        if (fromOff == null || !this.lastPoint) {
            const first: StrokePoint = {
                x: loc.point.x,
                y: loc.point.y,
                pressure: point.pressure,
                tiltX: point.tiltX,
                tiltY: point.tiltY,
                timeStamp: point.timeStamp,
                dx: 0,
                dy: 0,
                angle: 0,
            };
            this.lastPoint = point;
            this.lastSample = { x: first.x, y: first.y };
            this.remainder = this.spacing;
            return [first];
        }

        // 4) 이동량 계산
        const prev = this.lastPoint;
        const dt = point.timeStamp - prev.timeStamp;
        const L = this.path.length;
        const rawDelta = toOff - fromOff;
        const half = L / 2;
        let signedDelta = rawDelta;
        if (this.path.closed) {
            if (rawDelta > half) signedDelta = rawDelta - L;
            if (rawDelta < -half) signedDelta = rawDelta + L;
        }
        const travelLen = Math.abs(signedDelta);
        const dir = Math.sign(signedDelta);

        let distToNext = this.remainder;
        const samples: StrokePoint[] = [];

        if (travelLen < distToNext) {
            this.remainder -= travelLen;
            this.lastPoint = point;
            return samples;
        }

        // 5) 샘플 위치 리스트
        const dists: number[] = [];
        for (let d = distToNext; d <= travelLen; d += this.spacing) {
            dists.push(d);
        }

        // 6) 샘플링 루프: lastSample 과 비교
        let refX = this.lastSample!.x;
        let refY = this.lastSample!.y;

        for (const d of dists) {
            let off = fromOff + dir * d;
            if (this.path.closed) {
                off = ((off % L) + L) % L;
            }
            const locAt = this.path.getLocationAt(off)!;
            const x = locAt.point.x;
            const y = locAt.point.y;

            const dx = x - refX;
            const dy = y - refY;
            const angle = Math.atan2(dy, dx);

            // 보간
            const t = d / travelLen;
            const sample: StrokePoint = {
                x,
                y,
                pressure: prev.pressure + t * (point.pressure - prev.pressure),
                tiltX: prev.tiltX + t * (point.tiltX - prev.tiltX),
                tiltY: prev.tiltY + t * (point.tiltY - prev.tiltY),
                timeStamp: prev.timeStamp + t * dt,
                dx,
                dy,
                angle,
            };
            samples.push(sample);

            // 다음 비교 기준 갱신
            refX = x;
            refY = y;
            this.lastSample = { x, y };
        }

        // 7) remainder & lastPoint 업데이트
        const used = dists[dists.length - 1];
        this.remainder = this.spacing - (travelLen - used);
        this.lastPoint = point;

        return samples;
    }

    close(): StrokePoint[] {
        return [];
    }
}

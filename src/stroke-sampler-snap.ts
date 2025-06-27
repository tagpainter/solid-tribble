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

    constructor(paths: string[], spacing: number) {
        this.paths = paths.map((d) => new paper.Path(d));
        this.spacing = spacing;
        this.remainder = spacing;
    }

    private findNearestPath(point: { x: number; y: number }): paper.Path {
        let bestDist2 = Infinity;
        let bestPath: paper.Path | null = null;
        for (const path of this.paths) {
            const loc = path.getNearestLocation(point)!;
            const d2 = loc.point.getDistance(point) ** 2;
            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPath = path;
            }
        }
        return bestPath!;
    }

    next(point: StrokePoint): StrokePoint[] {
        if (!this.path) {
            this.path = this.findNearestPath(point);
        }

        const loc = this.path.getNearestLocation(point)!;
        const toOff = loc.offset;
        const fromOff = this.lastOffset;
        this.lastOffset = toOff;

        // 첫 입력이면 단일 샘플
        if (fromOff == null || !this.lastPoint) {
            this.lastPoint = point;
            this.remainder = this.spacing;
            return [
                {
                    x: loc.point.x,
                    y: loc.point.y,
                    pressure: point.pressure,
                    tiltX: point.tiltX,
                    tiltY: point.tiltY,
                    timeStamp: point.timeStamp,
                    dx: 0,
                    dy: 0,
                    angle: 0,
                },
            ];
        }

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

        // 충분히 이동 안 했으면 remainder만 갱신
        if (travelLen < distToNext) {
            this.remainder -= travelLen;
            this.lastPoint = point;
            return samples;
        }

        // 이전 샘플의 좌표 (첫 번째는 마지막 입력점)
        let lastX = prev.x;
        let lastY = prev.y;

        // 거리 리스트
        const dists: number[] = [];
        for (let d = distToNext; d <= travelLen; d += this.spacing) {
            dists.push(d);
        }

        // 각 거리마다 샘플링
        for (const d of dists) {
            // 전역 offset
            let off = fromOff + dir * d;
            if (this.path.closed) {
                off = ((off % L) + L) % L;
            }
            const locAt = this.path.getLocationAt(off)!;
            const x = locAt.point.x;
            const y = locAt.point.y;

            // dx, dy, angle 계산
            const dx = x - lastX;
            const dy = y - lastY;
            const angle = Math.atan2(dy, dx);

            // 보간값
            const t = d / travelLen;
            samples.push({
                x,
                y,
                pressure: prev.pressure + t * (point.pressure - prev.pressure),
                tiltX: prev.tiltX + t * (point.tiltX - prev.tiltX),
                tiltY: prev.tiltY + t * (point.tiltY - prev.tiltY),
                timeStamp: prev.timeStamp + t * dt,
                dx,
                dy,
                angle,
            });

            // 다음 샘플 비교용으로 업데이트
            lastX = x;
            lastY = y;
        }

        // remainder 갱신
        const used = dists[dists.length - 1];
        this.remainder = this.spacing - (travelLen - used);
        this.lastPoint = point;
        return samples;
    }

    close(): StrokePoint[] {
        return [];
    }
}

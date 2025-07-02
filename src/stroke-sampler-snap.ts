import type { StrokePoint } from "./stroke-point";

export class StrokeSnapSampler {
    private path: paper.Path;
    private spacing: number;
    private remainder: number;
    private lastOffset?: number;
    private lastPoint?: StrokePoint;
    private lastSample?: { x: number; y: number };
    private offsetThreshold: number;

    constructor(path: paper.Path, spacing: number, offsetThreshold: number = 100) {
        this.path = path;
        this.spacing = spacing;
        this.remainder = spacing;
        this.offsetThreshold = offsetThreshold;
    }

    next(point: StrokePoint): StrokePoint[] {
        const loc = this.path.getNearestLocation(point)!;
        const toOff = loc.offset;
        const fromOff = this.lastOffset;
        this.lastOffset = toOff;

        const currX = loc.point.x;
        const currY = loc.point.y;

        // 1) 첫 호출 또는 초기화 이후
        if (fromOff == null || !this.lastPoint) {
            const first: StrokePoint = {
                x: currX,
                y: currY,
                pressure: point.pressure,
                tiltX: point.tiltX,
                tiltY: point.tiltY,
                timeStamp: point.timeStamp,
                dx: 0,
                dy: 0,
                angle: 0,
            };
            this.lastPoint = point;
            this.lastSample = { x: currX, y: currY };
            this.remainder = this.spacing;
            return [first];
        }

        // 2) 오프셋 이동량 계산
        const rawDelta = toOff - fromOff!;
        const L = this.path.length;
        const half = L / 2;
        let signedDelta = rawDelta;
        if (rawDelta > half) signedDelta = rawDelta - L;
        if (rawDelta < -half) signedDelta = rawDelta + L;
        const travelLen = Math.abs(signedDelta);
        const dir = Math.sign(signedDelta);

        // 3) 오프셋 점프 임계값 초과 시 초기화
        if (travelLen > this.offsetThreshold) {
            const reset: StrokePoint = {
                x: currX,
                y: currY,
                pressure: point.pressure,
                tiltX: point.tiltX,
                tiltY: point.tiltY,
                timeStamp: point.timeStamp,
                dx: 0,
                dy: 0,
                angle: 0,
            };
            this.lastPoint = point;
            this.lastSample = { x: currX, y: currY };
            this.remainder = this.spacing;
            return [reset];
        }

        // 4) 잔여 거리 체크 및 샘플링 준비
        const prev = this.lastPoint!;
        const dt = point.timeStamp - prev.timeStamp;
        let distToNext = this.remainder;
        if (travelLen < distToNext) {
            this.remainder -= travelLen;
            this.lastPoint = point;
            return [];
        }

        const dists: number[] = [];
        for (let d = distToNext; d <= travelLen; d += this.spacing) {
            dists.push(d);
        }

        // 5) 샘플링 루프
        const samples: StrokePoint[] = [];
        let refX = this.lastSample!.x;
        let refY = this.lastSample!.y;
        for (const d of dists) {
            let off = fromOff! + dir * d;
            off = ((off % L) + L) % L;
            const locAt = this.path.getLocationAt(off)!;
            const x = locAt.point.x;
            const y = locAt.point.y;
            const dx = x - refX;
            const dy = y - refY;
            const angle = Math.atan2(dy, dx);
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

            refX = x;
            refY = y;
            this.lastSample = { x, y };
        }

        // 6) remainder 및 상태 업데이트
        const used = dists[dists.length - 1];
        this.remainder = this.spacing - (travelLen - used);
        this.lastPoint = point;

        return samples;
    }

    close(): StrokePoint[] {
        return [];
    }
}

import type { Vec2 } from "./utils/vec2";
import type { StrokePoint } from "./stroke-point";

export class StrokeRulerSampler {
    private path: Vec2[];
    private spacing: number;
    private segmentIndex = 0;
    private remnant = 0;

    constructor(path: Vec2[], spacing: number) {
        if (path.length < 2) throw new Error("path는 최소 2개 이상의 점이어야 합니다");
        // path를 변경하지 않도록 깊은 복사
        this.path = path.map((p) => ({ x: p.x, y: p.y }));
        this.spacing = spacing;
    }

    /**
     * 입력 좌표를 폴리라인 위로 투영
     */
    private project(pt: StrokePoint): StrokePoint {
        let bestDistSq = Infinity;
        let projX = pt.x;
        let projY = pt.y;

        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i];
            const b = this.path[i + 1];
            const vx = b.x - a.x;
            const vy = b.y - a.y;
            const wx = pt.x - a.x;
            const wy = pt.y - a.y;
            const denom = vx * vx + vy * vy;
            if (denom === 0) continue;
            const t = Math.max(0, Math.min(1, (vx * wx + vy * wy) / denom));
            const xProj = a.x + vx * t;
            const yProj = a.y + vy * t;
            const dx = pt.x - xProj;
            const dy = pt.y - yProj;
            const distSq = dx * dx + dy * dy;
            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                projX = xProj;
                projY = yProj;
            }
        }

        return {
            ...pt,
            x: projX,
            y: projY,
        };
    }

    /**
     * 투영된 포인트를 받아 등간격으로 샘플링
     */
    next(pt: StrokePoint): StrokePoint[] {
        const projected = this.project(pt);
        const samples: StrokePoint[] = [];

        while (this.segmentIndex < this.path.length - 1) {
            const a = this.path[this.segmentIndex];
            const b = this.path[this.segmentIndex + 1];
            const vx = b.x - a.x;
            const vy = b.y - a.y;
            const segLen = Math.hypot(vx, vy);

            if (segLen + this.remnant < this.spacing) {
                this.remnant += segLen;
                this.segmentIndex++;
                continue;
            }

            const t = (this.spacing - this.remnant) / segLen;
            const sampleX = a.x + vx * t;
            const sampleY = a.y + vy * t;

            const interp: StrokePoint = {
                x: sampleX,
                y: sampleY,
                pressure: projected.pressure,
                tiltX: projected.tiltX,
                tiltY: projected.tiltY,
                timeStamp: projected.timeStamp,
            };
            samples.push(interp);

            // 방금 찍은 위치를 새로운 시작점으로 설정
            this.path[this.segmentIndex] = { x: sampleX, y: sampleY };
            this.remnant = 0;
        }

        return samples;
    }
}

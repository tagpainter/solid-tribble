import { catmullRom, lerp } from "./utils/math";

export type StrokePoint = {
    x: number;
    y: number;
    pressure: number;
    angle?: number;
    tiltX: number;
    tiltY: number;
    timeStamp: number;
    index?: number;
    dx?: number;
    dy?: number;
};

export function catmullRomStrokePoint(p0: StrokePoint, p1: StrokePoint, p2: StrokePoint, p3: StrokePoint, t: number): StrokePoint {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t, t2, t3),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t, t2, t3),
        pressure: catmullRom(p0.pressure, p1.pressure, p2.pressure, p3.pressure, t, t2, t3),
        tiltX: catmullRom(p0.tiltX, p1.tiltX, p2.tiltX, p3.tiltX, t, t2, t3),
        tiltY: catmullRom(p0.tiltY, p1.tiltY, p2.tiltY, p3.tiltY, t, t2, t3),
        timeStamp: lerp(p1.timeStamp, p2.timeStamp, t),
    };
}

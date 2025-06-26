export const DEG_TO_RAD = Math.PI / 180;

export const RAD_TO_DEG = 180 / Math.PI;

export function degToRad(deg: number) {
    return deg * DEG_TO_RAD;
}

export function radToDeg(rad: number) {
    return rad * RAD_TO_DEG;
}

export function isPowerOf2(x: number) {
    return (x & (x - 1)) === 0;
}

export function clamp(x: number, min: number, max: number) {
    return Math.max(min, Math.min(max, x));
}

export function clamp01(x: number) {
    return clamp(x, 0, 1);
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function mapRange(x: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    if (inMax - inMin === 0) return outMin;
    const t = (x - inMin) / (inMax - inMin);
    return outMin + t * (outMax - outMin);
}

export function smoothstep(t: number) {
    return t * t * (3 - 2 * t);
}

export function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number, t2?: number, t3?: number): number {
    if (t2 == null) t2 = t * t;
    if (t3 == null) t3 = t2 * t;
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export const PI2 = 2 * Math.PI;

export function normalizeAngle(a: number) {
    return ((a % PI2) + PI2) % PI2;
}

export function snapAngle(angle: number, threshold: number, angles: number[]) {
    const normalizedAngle = normalizeAngle(angle);

    let closest = null;
    let closestDiff = Infinity;

    for (const target of angles) {
        const normalizedTarget = normalizeAngle(target);
        const diff = Math.abs(normalizedAngle - normalizedTarget);

        const circularDiff = Math.min(diff, 2 * Math.PI - diff);

        if (circularDiff < closestDiff) {
            closestDiff = circularDiff;
            closest = normalizedTarget;
        }
    }

    if (closestDiff <= threshold && closest != null) {
        return closest;
    }

    return angle;
}

export function randomInt(from: number, to: number): number {
    return Math.floor(Math.random() * (to - from + 1)) + from;
}

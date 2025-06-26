export type Vec2 = { readonly x: number; readonly y: number };

export const VEC2_ZERO: Vec2 = { x: 0, y: 0 };

export function length2d(v: Vec2): number {
    return Math.hypot(v.x, v.y);
}

export function distance2d(a: Vec2, b: Vec2): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

export function normalize2d(v: Vec2): Vec2 {
    const length = Math.hypot(v.x, v.y);
    return {
        x: v.x / length,
        y: v.y / length,
    };
}

export function add2d(a: Vec2, b: Vec2): Vec2 {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    };
}

export function addScalar2d(v: Vec2, scalar: number): Vec2 {
    return {
        x: v.x + scalar,
        y: v.y + scalar,
    };
}

export function subtract2d(a: Vec2, b: Vec2): Vec2 {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    };
}

export function subtractScalar2d(v: Vec2, scalar: number): Vec2 {
    return {
        x: v.x - scalar,
        y: v.y - scalar,
    };
}

export function multiply2d(a: Vec2, b: Vec2): Vec2 {
    return {
        x: a.x * b.x,
        y: a.y * b.y,
    };
}

export function multiplyScalar2d(v: Vec2, scalar: number): Vec2 {
    return {
        x: v.x * scalar,
        y: v.y * scalar,
    };
}

export function divide2d(a: Vec2, b: Vec2): Vec2 {
    return {
        x: a.x / b.x,
        y: a.y / b.y,
    };
}

export function divideScalar2d(v: Vec2, scalar: number): Vec2 {
    return {
        x: v.x / scalar,
        y: v.y / scalar,
    };
}

export function dot2d(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y;
}

export function cross2d(a: Vec2, b: Vec2): number {
    return a.x * b.y - a.y * b.x;
}

export function clamp2d(v: Vec2, min: Vec2, max: Vec2): Vec2 {
    return {
        x: Math.max(min.x, Math.min(max.x, v.x)),
        y: Math.max(min.y, Math.min(max.y, v.y)),
    };
}

export function lerp2d(a: Vec2, b: Vec2, t: number): Vec2 {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    };
}

export function angle2d(v: Vec2): number {
    return Math.atan2(v.y, v.x);
}

export function angleBetween2d(a: Vec2, b: Vec2): number {
    const dot = dot2d(a, b);
    const lenA = length2d(a);
    const lenB = length2d(b);
    return Math.acos(dot / (lenA * lenB));
}

export function equals2d(a: Vec2, b: Vec2): boolean {
    return a.x === b.x && a.y === b.y;
}

export function equalsApprox2d(a: Vec2, b: Vec2, epsilon: number = 1e-6): boolean {
    return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

export function rotate2d(v: Vec2, angle: number, origin: Vec2 = VEC2_ZERO): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = v.x - origin.x;
    const y = v.y - origin.y;
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return {
        x: rx + origin.x,
        y: ry + origin.y,
    };
}

export function average2d(points: readonly Vec2[]): Vec2 {
    if (points.length === 0) return VEC2_ZERO;

    let sumX = 0;
    let sumY = 0;

    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
    }

    const count = points.length;
    return {
        x: sumX / count,
        y: sumY / count,
    };
}

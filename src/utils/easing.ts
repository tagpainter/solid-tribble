export function easeOutCirc(x: number): number {
    return Math.sqrt(1 - Math.pow(x - 1, 2));
}

export function easeInCirc(x: number): number {
    return 1 - Math.sqrt(1 - x * x);
}

export function easeInSine(x: number): number {
    return 1 - Math.cos((x * Math.PI) / 2);
}

export function easeInQuad(x: number): number {
    return x * x;
}

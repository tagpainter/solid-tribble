export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function createRect(x: number, y: number, width: number, height: number): Rect {
    return { x, y, width, height };
}

export function createRectFromCenter(cx: number, cy: number, width: number, height: number): Rect {
    return {
        x: cx - width / 2,
        y: cy - height / 2,
        width,
        height,
    };
}

export function cloneRect(r: Rect): Rect {
    return { ...r };
}

export function rectContainsPoint(r: Rect, px: number, py: number): boolean {
    return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
}

export function rectContainsRect(a: Rect, b: Rect): boolean {
    return a.x <= b.x && a.y <= b.y && a.x + a.width >= b.x + b.width && a.y + a.height >= b.y + b.height;
}

export function rectIntersects(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function rectUnion(a: Rect, b: Rect): Rect {
    let x = a.x;
    if (b.x < x) x = b.x;

    let y = a.y;
    if (b.y < y) y = b.y;

    let right = a.x + a.width;
    const bRight = b.x + b.width;
    if (bRight > right) right = bRight;

    let bottom = a.y + a.height;
    const bBottom = b.y + b.height;
    if (bBottom > bottom) bottom = bBottom;

    return {
        x,
        y,
        width: right - x,
        height: bottom - y,
    };
}

export function rectsUnion(rects: Rect[]): Rect {
    if (rects.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = rects[0].x;
    let minY = rects[0].y;
    let maxX = rects[0].x + rects[0].width;
    let maxY = rects[0].y + rects[0].height;

    for (let i = 1; i < rects.length; i++) {
        const r = rects[i];
        const rx1 = r.x;
        const ry1 = r.y;
        const rx2 = r.x + r.width;
        const ry2 = r.y + r.height;

        if (rx1 < minX) minX = rx1;
        if (ry1 < minY) minY = ry1;
        if (rx2 > maxX) maxX = rx2;
        if (ry2 > maxY) maxY = ry2;
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function rectIntersection(a: Rect, b: Rect): Rect | null {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    const right = Math.min(a.x + a.width, b.x + b.width);
    const bottom = Math.min(a.y + a.height, b.y + b.height);
    if (right <= x || bottom <= y) return null;
    return { x, y, width: right - x, height: bottom - y };
}

export function inflateRect(r: Rect, dx: number, dy: number): Rect {
    return {
        x: r.x - dx,
        y: r.y - dy,
        width: r.width + dx * 2,
        height: r.height + dy * 2,
    };
}

export function getRectCenter(r: Rect): { x: number; y: number } {
    return {
        x: r.x + r.width / 2,
        y: r.y + r.height / 2,
    };
}

export function rectEquals(a: Rect, b: Rect): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function hexToFloatRGB(hex: string): [number, number, number] {
    hex = hex.replace(/^#/, "");
    const full =
        hex.length === 3
            ? hex
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : hex;
    if (full.length !== 6) {
        throw new Error("Invalid hex color");
    }
    const int = parseInt(full, 16);
    return [((int >> 16) & 0xff) / 255, ((int >> 8) & 0xff) / 255, (int & 0xff) / 255];
}

export function rgbToHex(rgb: string): string {
    const match = rgb.match(/^rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
    if (!match) return rgb;

    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");

    return `#${r}${g}${b}`;
}

export function lightenU8(v: number, amount: number) {
    return Math.min(255, v + (255 - v) * amount);
}

export function lightenU8RGBA(r: number, g: number, b: number, a: number, amount: number): [number, number, number, number] {
    return [lightenU8(r, amount), lightenU8(g, amount), lightenU8(b, amount), a];
}

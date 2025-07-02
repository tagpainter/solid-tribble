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

export function rgbToFloatRGB(color: string): [number, number, number] {
    const [r, g, b] = color.replace("rgb(", "").replace(")", "").split(",").map(Number);
    return [r / 255, g / 255, b / 255];
}

export function stringToFloatRGB(color: string): [number, number, number] {
    if (color.startsWith("#")) {
        return hexToFloatRGB(color);
    } else if (color.startsWith("rgb(")) {
        return rgbToFloatRGB(color);
    } else {
        throw new Error("Unknown format.");
    }
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

export type Rgb = {
    r: number;
    g: number;
    b: number;
};

export type Hsl = {
    h: number;
    s: number;
    l: number;
};

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
    const R = r / 255,
        G = g / 255,
        B = b / 255;
    const max = Math.max(R, G, B),
        min = Math.min(R, G, B);
    let h = 0,
        s = 0,
        l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case R:
                h = (G - B) / d + (G < B ? 6 : 0);
                break;
            case G:
                h = (B - R) / d + 2;
                break;
            case B:
                h = (R - G) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
    function hue2rgb(p: number, q: number, t: number): number {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    let R: number, G: number, B: number;
    if (s === 0) {
        R = G = B = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        R = hue2rgb(p, q, h + 1 / 3);
        G = hue2rgb(p, q, h);
        B = hue2rgb(p, q, h - 1 / 3);
    }
    return {
        r: Math.round(R * 255),
        g: Math.round(G * 255),
        b: Math.round(B * 255),
    };
}

export function lighten(color: Rgb, mixFraction: number = 0.4): Rgb {
    return {
        r: Math.round(color.r + (255 - color.r) * mixFraction),
        g: Math.round(color.g + (255 - color.g) * mixFraction),
        b: Math.round(color.b + (255 - color.b) * mixFraction),
    };
}

export function rotateHue(h: number, angleDeg: number): number {
    let newH = (h + angleDeg / 360) % 1;
    if (newH < 0) newH += 1;
    return newH;
}

export function hexToRgb(hex: string): Rgb {
    const h = hex.replace(/^#/, "");
    const full =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h;
    const bigint = parseInt(full, 16);
    return {
        r: (bigint >> 16) & 0xff,
        g: (bigint >> 8) & 0xff,
        b: bigint & 0xff,
    };
}

import { clamp, lerp } from "./math";

export function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.onload = () => resolve(image);
        image.onerror = (error) => reject(error);
    });
}

export function imageToCanvas(image: HTMLImageElement, width = image.width, height = image.height): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
}

export function imageToImageData(image: HTMLImageElement, width = image.width, height = image.height): ImageData {
    const canvas = imageToCanvas(image, width, height);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.remove();
    return imageData;
}

export function resizeImage(image: HTMLImageElement, width = image.width, height = image.height): Promise<HTMLImageElement> {
    const canvas = imageToCanvas(image, width, height);
    return loadImage(canvas.toDataURL());
}

type ImageToFloatMode = "r" | "g" | "b" | "a" | "avg" | "luminance";

export function imageDataToFloat32Array(imageData: ImageData, mode: ImageToFloatMode = "r"): Float32Array {
    const { data, width, height } = imageData;
    const out = new Float32Array(width * height);

    for (let i = 0; i < width * height; i++) {
        const r = data[i * 4 + 0] / 255;
        const g = data[i * 4 + 1] / 255;
        const b = data[i * 4 + 2] / 255;
        const a = data[i * 4 + 3] / 255;

        let value = 0;

        switch (mode) {
            case "r":
                value = r;
                break;
            case "g":
                value = g;
                break;
            case "b":
                value = b;
                break;
            case "a":
                value = a;
                break;
            case "avg":
                value = (r + g + b) / 3;
                break;
            case "luminance":
                value = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                break;
        }

        out[i] = value;
    }

    return out;
}

export function computeSobelHighlight(input: ImageData, low = 0.95, high = 1.0): ImageData {
    const { width, height, data } = input;
    const output = new ImageData(width, height);

    const getR = (x: number, y: number) => {
        x = clamp(x, 0, width - 1);
        y = clamp(y, 0, height - 1);
        const i = (y * width + x) * 4;
        return data[i] / 255;
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const j = i * 4;
            const l = getR(x - 1, y);
            const r = getR(x + 1, y);
            const t = getR(x, y - 1);
            const b = getR(x, y + 1);

            const dx = r - l;
            const dy = b - t;
            const d = dx + dy;
            const c = lerp(low, high, d) * 255;

            output.data[j + 0] = c;
            output.data[j + 1] = c;
            output.data[j + 2] = c;
            output.data[j + 3] = 255;
        }
    }

    return output;
}

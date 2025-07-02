import { StrokeStabilizer } from "./stroke-stabilizer";
import { createBuffer, createProgram, createTexture, createTextureFramebuffer } from "./utils/gl";
import { loadImage } from "./utils/image";
import DAB_VS from "./shaders/dab.vert?raw";
import DAB_FS from "./shaders/dab.frag?raw";
import BOARD_VS from "./shaders/board.vert?raw";
import BOARD_FS from "./shaders/board.frag?raw";
import type { StrokePoint } from "./stroke-point";
import { SpeedAlpha } from "./speed-alpha";
import { stringToFloatRGB } from "./utils/color";
import { loadSvg, svgToUrl } from "./utils/svg";
import { StrokeSnapSampler } from "./stroke-sampler-snap";
import paper from "paper";
import rough from "roughjs";

paper.setup([1, 1]);
paper.view.autoUpdate = false;
paper.settings.insertItems = false;

const colors = ["#d3b997", "#4f7bd5", "#34cff0", "#f03fa7", "#ffc05f", "#3957b6"];

const resolution = {
    x: 1024,
    y: 1024,
};

function createBristles(ctx: CanvasRenderingContext2D, dotSize: number, dotCount: number) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const maxRadius = Math.min(width, height) * dotSize;

    for (let i = 0; i < dotCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = maxRadius * (0.5 + Math.random() * 0.5);

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const imgData = ctx.getImageData(0, 0, width, height);
    const floatMap = new Float32Array(width * height);

    const data = imgData.data;
    for (let i = 0; i < width * height; i++) {
        floatMap[i] = data[i * 4] / 255; // R 채널만 사용 (grayscale)
    }

    return floatMap;
}

function createSketchSvg(source: SVGSVGElement) {
    const NS = "http://www.w3.org/2000/svg";

    const width = source.getAttribute("width");
    const height = source.getAttribute("height");

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("xmlns", NS);
    svg.setAttribute("version", "1.2");
    svg.setAttribute("width", `${width}`);
    svg.setAttribute("height", `${height}`);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const paths = source.getElementById("0").querySelectorAll("path");

    for (const path of paths) {
        const d = path.getAttribute("d")!;
        const newPath = document.createElementNS(NS, "path");
        svg.appendChild(newPath);
        newPath.setAttribute("d", d);
        newPath.setAttribute("stroke-miterlimit", "2");
        newPath.setAttribute("stroke-dasharray", "5 2");
        newPath.setAttribute("stroke-width", "2");
        newPath.setAttribute("stroke", "#666");
        newPath.setAttribute("fill", "none");
    }

    return svg;
}

function createRoughSketchSvg(source: SVGSVGElement) {
    const NS = "http://www.w3.org/2000/svg";

    const width = source.getAttribute("width");
    const height = source.getAttribute("height");

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("xmlns", NS);
    svg.setAttribute("version", "1.2");
    svg.setAttribute("width", `${width}`);
    svg.setAttribute("height", `${height}`);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const rc = rough.svg(svg);

    const paths = source.querySelectorAll("path");

    for (const path of paths) {
        const d = path.getAttribute("d")!;

        const node = rc.path(d, {
            stroke: `#666`,
            roughness: 0.75,
            bowing: 10,
            fill: `#6666`,
            fillStyle: "hatch", // solid fill
            hachureGap: 5,
        });

        svg.appendChild(node);
    }

    return svg;
}

async function main() {
    const maskSvg = await loadSvg("/artst_mask.svg");

    const svg = await loadSvg("/artst_path.svg");

    document.body.appendChild(svg);

    const paths: { d: string; color: string }[] = [];

    for (const layer of svg.querySelectorAll("g")) {
        const id = parseInt(layer.id);
        if (id > 0) {
            for (const path of layer.querySelectorAll("path")) {
                const computedStyle = getComputedStyle(path);
                paths.push({
                    d: path.getAttribute("d")!,
                    color: computedStyle.stroke!,
                });
            }
        }
    }

    const sketchSvg = createRoughSketchSvg(maskSvg);
    const sketchUrl = svgToUrl(sketchSvg);
    const sketchImage = await loadImage(sketchUrl);
    svg.remove();

    const colorDiv = document.createElement("div");
    document.body.appendChild(colorDiv);

    for (const c of colors) {
        const colorButton = document.createElement("button");

        colorButton.style.width = "30px";
        colorButton.style.height = "30px";
        colorButton.style.border = "0px";
        colorButton.style.backgroundColor = c;
        colorButton.onclick = () => {
            color = stringToFloatRGB(c);
        };

        colorDiv.appendChild(colorButton);
    }

    const bristlesCanvas = document.createElement("canvas");
    bristlesCanvas.width = 128;
    bristlesCanvas.height = 128;

    const bristlesCtx = bristlesCanvas.getContext("2d")!;

    createBristles(bristlesCtx, 0.05, 500);

    const canvas = document.createElement("canvas");
    canvas.width = resolution.x;
    canvas.height = resolution.y;

    document.body.appendChild(canvas);

    const gl = canvas.getContext("webgl2", {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
    })!;

    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const quadBuffer = createBuffer(gl, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const normBuffer = createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

    const shapeImage = await loadImage("/shape.png");
    const shapeTexture = createTexture(gl, {
        image: shapeImage,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    const grainImage = await loadImage("/canvas-1.jpg");
    const grainTexture = createTexture(gl, {
        image: grainImage,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
    });

    const pressImage = await loadImage("/press.png");
    const pressTexture = createTexture(gl, {
        image: pressImage,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
    });

    const bristlesTexture = createTexture(gl, {
        image: bristlesCanvas,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    const sketchTexture = createTexture(gl, {
        image: sketchImage,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    let previous = createTextureFramebuffer(gl, {
        width: resolution.x,
        height: resolution.y,
        internalFormat: gl.RGBA16F,
        format: gl.RGBA,
        type: gl.FLOAT,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    let current = createTextureFramebuffer(gl, {
        width: resolution.x,
        height: resolution.y,
        internalFormat: gl.RGBA16F,
        format: gl.RGBA,
        type: gl.FLOAT,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    const brushSize = 40;
    const brushSpacing = 1;
    const windowCount = 1;

    let pointerId: number | null = null;
    let sampler: StrokeSnapSampler | null = null;
    let stabilizer = new StrokeStabilizer(windowCount);
    let lastPoint: PointerEvent | null = null;

    let speedAlpha = new SpeedAlpha();
    let speedAlphaValue = 1;

    let color = stringToFloatRGB(colors[0]);

    const dabProgram = createProgram(gl, DAB_VS, DAB_FS);
    const dabAttribs = {
        aNorm: gl.getAttribLocation(dabProgram, "aNorm")!,
    };
    const dabUniforms = {
        uResolution: gl.getUniformLocation(dabProgram, "uResolution")!,
        uPosition: gl.getUniformLocation(dabProgram, "uPosition")!,
        uAngle: gl.getUniformLocation(dabProgram, "uAngle")!,
        uSize: gl.getUniformLocation(dabProgram, "uSize")!,
        uColor: gl.getUniformLocation(dabProgram, "uColor")!,
        uPressure: gl.getUniformLocation(dabProgram, "uPressure")!,
        uShape: gl.getUniformLocation(dabProgram, "uShape")!,
        uBristles: gl.getUniformLocation(dabProgram, "uBristles")!,
        uPrevious: gl.getUniformLocation(dabProgram, "uPrevious")!,
        uGrain: gl.getUniformLocation(dabProgram, "uGrain")!,
        uDelta: gl.getUniformLocation(dabProgram, "uDelta")!,
        uPress: gl.getUniformLocation(dabProgram, "uPress")!,
        uFlow: gl.getUniformLocation(dabProgram, "uFlow")!,
    };

    const dabCopyProgram = createProgram(gl, DAB_VS, DAB_FS);
    const dabCopyAttribs = {
        aNorm: gl.getAttribLocation(dabCopyProgram, "aNorm"),
    };
    const dabCopyUniforms = {
        uResolution: gl.getUniformLocation(dabCopyProgram, "uResolution")!,
        uPosition: gl.getUniformLocation(dabCopyProgram, "uPosition")!,
        uAngle: gl.getUniformLocation(dabCopyProgram, "uAngle")!,
        uSize: gl.getUniformLocation(dabCopyProgram, "uSize")!,
        uPrevious: gl.getUniformLocation(dabCopyProgram, "uPrevious")!,
    };

    const boardProgram = createProgram(gl, BOARD_VS, BOARD_FS);
    const boardAttribs = {
        aPosition: gl.getAttribLocation(boardProgram, "aPosition")!,
        aUv: gl.getAttribLocation(boardProgram, "aUv")!,
    };
    const boardUniforms = {
        uResolution: gl.getUniformLocation(boardProgram, "uResolution")!,
        uTexture: gl.getUniformLocation(boardProgram, "uTexture")!,
        uSketch: gl.getUniformLocation(boardProgram, "uSketch"),
    };

    function addDab(sample: StrokePoint) {
        gl.useProgram(dabProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.enableVertexAttribArray(dabAttribs.aNorm);
        gl.vertexAttribPointer(dabAttribs.aNorm, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(dabAttribs.aNorm, 0);

        gl.uniform2f(dabUniforms.uResolution, resolution.x, resolution.y);
        gl.uniform4f(dabUniforms.uColor, color[0], color[1], color[2], 1);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, shapeTexture);
        gl.uniform1i(dabUniforms.uShape, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, previous.texture);
        gl.uniform1i(dabUniforms.uPrevious, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, bristlesTexture);
        gl.uniform1i(dabUniforms.uBristles, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, grainTexture);
        gl.uniform1i(dabUniforms.uGrain, 3);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, pressTexture);
        gl.uniform1i(dabUniforms.uPress, 4);

        gl.uniform2f(dabUniforms.uPosition, sample.x, sample.y);
        gl.uniform1f(dabUniforms.uSize, brushSize);
        gl.uniform1f(dabUniforms.uAngle, sample.angle!);
        gl.uniform1f(dabUniforms.uPressure, sample.pressure);
        gl.uniform1f(dabUniforms.uFlow, 0.5);
        gl.uniform2f(dabUniforms.uDelta, sample.dx!, sample.dy!);

        gl.disable(gl.BLEND);

        gl.bindFramebuffer(gl.FRAMEBUFFER, current.framebuffer);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function swap() {
        let temp = previous;
        previous = current;
        current = temp;
    }

    function findBestPath(point: { x: number; y: number }) {
        let bestDist2 = Infinity;
        let bestPath: paper.Path | null = null;
        let bestColor: string | null = null;
        for (const p of paths) {
            const path = new paper.Path(p.d);
            const loc = path.getNearestLocation(point)!;
            const d2 = loc.point.getDistance(point) ** 2;
            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPath = path;
                bestColor = p.color;
            }
        }
        console.log(bestPath);
        return { path: bestPath!, color: bestColor! };
    }

    function copyDab(sample: StrokePoint) {
        gl.useProgram(dabCopyProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.enableVertexAttribArray(dabCopyAttribs.aNorm);
        gl.vertexAttribPointer(dabCopyAttribs.aNorm, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(dabCopyAttribs.aNorm, 0);

        gl.uniform2f(dabCopyUniforms.uResolution, resolution.x, resolution.y);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, previous.texture);
        gl.uniform1i(dabCopyUniforms.uPrevious, 1);

        gl.uniform2f(dabCopyUniforms.uPosition, sample.x, sample.y);
        gl.uniform1f(dabCopyUniforms.uSize, brushSize);
        gl.uniform1f(dabCopyUniforms.uAngle, sample.angle!);

        gl.disable(gl.BLEND);

        gl.bindFramebuffer(gl.FRAMEBUFFER, current.framebuffer);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function draw(samples: StrokePoint[]) {
        for (const sample of samples) {
            addDab(sample);

            swap();

            // COPY
            copyDab(sample);
        }

        // copyDab(samples[samples.length - 1]);
    }

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
    });

    canvas.addEventListener("pointerdown", (e) => {
        const best = findBestPath({
            x: e.offsetX,
            y: e.offsetY,
        });

        pointerId = e.pointerId;
        sampler = new StrokeSnapSampler(best.path, brushSpacing);
        stabilizer = new StrokeStabilizer(windowCount);
        color = stringToFloatRGB(best.color);

        speedAlpha = new SpeedAlpha();
        speedAlphaValue = 1;
        speedAlpha.down(e.offsetX, e.offsetY, e.timeStamp);

        const pressure = e.pointerType === "pen" ? e.pressure : 0.5;

        const stable = stabilizer.next({
            x: e.offsetX,
            y: e.offsetY,
            pressure: pressure * speedAlphaValue,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            timeStamp: e.timeStamp,
        });
        const samples = sampler.next(stable);
        draw(samples);
    });

    canvas.addEventListener("pointermove", (e) => {
        if (sampler != null && pointerId === e.pointerId && (lastPoint?.x !== e.offsetX || lastPoint?.y !== e.offsetY)) {
            speedAlphaValue = speedAlpha.move(e.offsetX, e.offsetY, e.timeStamp);

            const pressure = e.pointerType === "pen" ? e.pressure : 0.5;

            const stable = stabilizer.next({
                x: e.offsetX,
                y: e.offsetY,
                pressure: pressure * speedAlphaValue,
                tiltX: e.tiltX,
                tiltY: e.tiltY,
                timeStamp: e.timeStamp,
            });
            const samples = sampler.next(stable);
            draw(samples);
            lastPoint = e;
        }
    });

    canvas.addEventListener("pointerup", (e) => {
        if (sampler != null && pointerId === e.pointerId) {
            speedAlphaValue = speedAlpha.move(e.offsetX, e.offsetY, e.timeStamp);

            const pressure = e.pointerType === "pen" ? e.pressure : 0.5;

            const stable = stabilizer.next({
                x: e.offsetX,
                y: e.offsetY,
                pressure: pressure * speedAlphaValue,
                tiltX: e.tiltX,
                tiltY: e.tiltY,
                timeStamp: e.timeStamp,
            });
            const samples: StrokePoint[] = [];
            samples.push(...sampler.next(stable));
            samples.push(...sampler.close());
            draw(samples);
            pointerId = null;
        }
    });

    function tick() {
        gl.disable(gl.BLEND);

        gl.useProgram(boardProgram);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(boardAttribs.aPosition);
        gl.vertexAttribPointer(boardAttribs.aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.enableVertexAttribArray(boardAttribs.aUv);
        gl.vertexAttribPointer(boardAttribs.aUv, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(boardUniforms.uResolution, resolution.x, resolution.y);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, current.texture);
        gl.uniform1i(boardUniforms.uTexture, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, sketchTexture);
        gl.uniform1i(boardUniforms.uSketch, 1);

        gl.viewport(0, 0, resolution.x, resolution.y);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
}

main();

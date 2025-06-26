import { StrokeSampler } from "./stroke-sampler";
import { StrokeStabilizer } from "./stroke-stabilizer";
import { createBuffer, createProgram, createTexture, createTextureFramebuffer } from "./utils/gl";
import { loadImage } from "./utils/image";
import DAB_VS from "./shaders/dab.vert?raw";
import DAB_FS from "./shaders/dab.frag?raw";
import BOARD_VS from "./shaders/board.vert?raw";
import BOARD_FS from "./shaders/board.frag?raw";
import type { StrokePoint } from "./stroke-point";

const resolution = {
    x: 1024,
    y: 1024,
};

async function main() {
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

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
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

    let previous = createTextureFramebuffer(gl, {
        width: resolution.x,
        height: resolution.y,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    let current = createTextureFramebuffer(gl, {
        width: resolution.x,
        height: resolution.y,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    const brushSize = 100;
    const brushSpacing = 1;
    const windowCount = 1;

    let pointerId: number | null = null;
    let sampler = new StrokeSampler(brushSpacing);
    let stabilizer = new StrokeStabilizer(windowCount);
    let lastPoint: PointerEvent | null = null;

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
        uFlow: gl.getUniformLocation(dabProgram, "uFlow")!,
        uShape: gl.getUniformLocation(dabProgram, "uShape")!,
        uPrevious: gl.getUniformLocation(dabProgram, "uPrevious")!,
    };

    const boardProgram = createProgram(gl, BOARD_VS, BOARD_FS);
    const boardAttribs = {
        aPosition: gl.getAttribLocation(boardProgram, "aPosition")!,
        aUv: gl.getAttribLocation(boardProgram, "aUv")!,
    };
    const boardUniforms = {
        uResolution: gl.getUniformLocation(boardProgram, "uResolution")!,
        uTexture: gl.getUniformLocation(boardProgram, "uTexture")!,
    };

    function draw(samples: StrokePoint[]) {
        gl.useProgram(dabProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.enableVertexAttribArray(dabAttribs.aNorm);
        gl.vertexAttribPointer(dabAttribs.aNorm, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(dabAttribs.aNorm, 0);

        gl.uniform2f(dabUniforms.uResolution, resolution.x, resolution.y);
        gl.uniform4f(dabUniforms.uColor, 1, 1, 1, 1);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, shapeTexture);
        gl.uniform1i(dabUniforms.uShape, 0);

        gl.disable(gl.BLEND);

        for (const sample of samples) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, current.framebuffer);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, previous.texture);
            gl.uniform1i(dabUniforms.uPrevious, 1);

            gl.uniform2f(dabUniforms.uPosition, sample.x, sample.y);
            gl.uniform1f(dabUniforms.uSize, sample.pressure * brushSize);
            gl.uniform1f(dabUniforms.uAngle, sample.angle!);
            gl.uniform1f(dabUniforms.uFlow, sample.pressure);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            let temp = previous;
            previous = current;
            current = temp;
        }
    }

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
    });

    canvas.addEventListener("pointerdown", (e) => {
        pointerId = e.pointerId;
        sampler = new StrokeSampler(brushSpacing);
        stabilizer = new StrokeStabilizer(windowCount);
        const stable = stabilizer.next({
            x: e.offsetX,
            y: e.offsetY,
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            timeStamp: e.timeStamp,
        });
        const samples = sampler.next(stable);
        draw(samples);
    });

    canvas.addEventListener("pointermove", (e) => {
        if (pointerId === e.pointerId && (lastPoint?.x !== e.offsetX || lastPoint?.y !== e.offsetY)) {
            const stable = stabilizer.next({
                x: e.offsetX,
                y: e.offsetY,
                pressure: e.pressure,
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
        if (pointerId === e.pointerId) {
            const stable = stabilizer.next({
                x: e.offsetX,
                y: e.offsetY,
                pressure: e.pressure,
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

        gl.viewport(0, 0, resolution.x, resolution.y);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
}

main();

import { isPowerOf2 } from "./math";
import type { Rect } from "./rect";
import type { Vec2 } from "./vec2";

export function createShader(gl: WebGLRenderingContext, source: string, type: GLuint) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Error creating shader.");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getProgramInfoLog(shader);
        throw new Error(`Shader compilation error: ${info}`);
    }
    return shader;
}

export function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    const program = gl.createProgram();
    if (!program) throw new Error("Error creating program.");
    const vertexShader = createShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`Could not initialize shaders! ${info}`);
    }
    return program;
}

export type TextureOptions = {
    width?: number;
    height?: number;
    image?: TexImageSource;
    data?: ArrayBufferView;
    format?: GLenum;
    internalFormat?: GLenum;
    type?: GLenum;
    wrapS?: GLenum;
    wrapT?: GLenum;
    minFilter?: GLenum;
    magFilter?: GLenum;
};

export function setTextureOptions(gl: WebGLRenderingContext, texture: WebGLTexture, options: TextureOptions) {
    const {
        width = 0,
        height = 0,
        image,
        data,
        format = gl.RGBA,
        internalFormat = format,
        type = gl.UNSIGNED_BYTE,
        wrapS = gl.CLAMP_TO_EDGE,
        wrapT = gl.CLAMP_TO_EDGE,
        minFilter = gl.LINEAR,
        magFilter = gl.LINEAR,
    } = options;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

    if (data) {
        if (width === 0 || height === 0) {
            throw new Error("Width and height must be specified when using raw data.");
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
    } else if (image) {
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, image);
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data ?? null);
    }

    if (isPowerOf2(width) && isPowerOf2(height) && minFilter === gl.LINEAR_MIPMAP_LINEAR) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
}

export function createTexture(gl: WebGLRenderingContext, options: TextureOptions) {
    const texture = gl.createTexture();
    if (!texture) throw new Error("Failed to create texture");
    setTextureOptions(gl, texture, options);
    return texture;
}

export function deleteTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
    if (texture && gl.isTexture(texture)) {
        gl.deleteTexture(texture);
    }
}

export type TextureFramebuffer = {
    texture: WebGLTexture;
    framebuffer: WebGLFramebuffer;
};

export function createTextureFramebuffer(gl: WebGLRenderingContext, options: TextureOptions): TextureFramebuffer {
    const texture = createTexture(gl, options);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return { texture, framebuffer };
}

export function deleteTextureFramebuffer(gl: WebGLRenderingContext | WebGL2RenderingContext, fbo: TextureFramebuffer) {
    const { texture, framebuffer } = fbo;

    if (texture && gl.isTexture(texture)) {
        gl.deleteTexture(texture);
    }

    if (framebuffer && gl.isFramebuffer(framebuffer)) {
        gl.deleteFramebuffer(framebuffer);
    }
}

export function setBufferData(gl: WebGLRenderingContext, buffer: WebGLBuffer, data: BufferSource, usage: GLenum = gl.STATIC_DRAW) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
}

export function createBuffer(gl: WebGLRenderingContext, data: BufferSource, usage: GLenum = gl.STATIC_DRAW): WebGLBuffer {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Failed to create buffer");
    setBufferData(gl, buffer, data, usage);
    return buffer;
}

export function setScissor(gl: WebGLRenderingContext, size: Vec2, rect: Rect) {
    const x = Math.round(rect.x);
    const y = Math.round(size.y - rect.y - rect.height);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
}

export function injectDefines(source: string, defines: string[]) {
    return source.replace(/^#version\s+300\s+es/, (match) => `${match}\n${defines.join("\n")}`);
}

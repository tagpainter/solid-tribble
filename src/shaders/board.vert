#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aUv;

out vec2 vUv;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vUv = aUv;
}
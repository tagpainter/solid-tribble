#version 300 es
precision highp float;

in vec2 vGlobalUv;

uniform sampler2D uPrevious;

out vec4 outColor;

void main() {
    outColor = texture(uPrevious, vGlobalUv);
}
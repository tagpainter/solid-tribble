#version 300 es
precision highp float;

in vec2 vUv;

uniform vec2 uResolution;
uniform sampler2D uTexture;

out vec4 outColor;

void main() {
    outColor = texture(uTexture, vUv);
}
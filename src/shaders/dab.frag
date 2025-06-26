#version 300 es
precision highp float;

in vec2 vShapeUv;
in vec2 vBristlesUv;
in vec2 vGlobalUv;

uniform sampler2D uPrevious;
uniform sampler2D uShape;
uniform sampler2D uBristles;

uniform vec4 uColor;
uniform float uFlow;

out vec4 outColor;

vec4 blendSourceOver(vec4 src, vec4 dst) {
    float outA   = src.a + dst.a * (1.0 - src.a);
    vec3  outRGB = src.rgb + dst.rgb * (1.0 - src.a);
    return vec4(outRGB, outA);
}

void main() {
    vec4 shape = texture(uShape, vShapeUv);

    vec4 bristles = texture(uBristles, vBristlesUv);
    
    vec4 previous = texture(uPrevious, vGlobalUv);

    vec4 color = vec4(shape.r * bristles.r * uFlow);

    outColor = blendSourceOver(color, previous);
}
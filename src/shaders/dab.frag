#version 300 es
precision highp float;

in vec2 vShapeUv;
in vec2 vBristlesUv;
in vec2 vGlobalUv;
in vec2 vGrainUv;
in vec2 vDeltaUv;

uniform sampler2D uPrevious;
uniform sampler2D uShape;
uniform sampler2D uBristles;
uniform sampler2D uGrain;
uniform sampler2D uPress;

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

    vec4 press = texture(uPress, vShapeUv);

    vec4 bristles = texture(uBristles, vBristlesUv);

    vec4 grain = texture(uGrain, vGrainUv);
    
    vec4 previous = texture(uPrevious, vGlobalUv);

    vec4 last = texture(uPrevious, vDeltaUv);

    float b = bristles.r;
    b -= 1.0 - uFlow;
    b -= (1.0 - grain.r) * 0.4;
    b = clamp(b, 0.0, 1.0);

    float height = b * shape.r * 2.0 * uFlow;

    vec4 value = previous + height;

    if (previous.a > 0.0 && height > 0.0) {
        float max = 1.0 + (1.0 - press.r) * uFlow;
        float clamped = mix(previous.a, max, uFlow);
        value = vec4(clamped) + height * 2.0;
    }

    value = mix(value, last, height * 0.2);
    value = max(value, 0.0);

    outColor = value;
}
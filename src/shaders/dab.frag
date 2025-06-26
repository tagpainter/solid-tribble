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
uniform float uPressure;
uniform float uFlow;

out vec4 outColor;

float easeOutCirc(float t) {
    return sqrt(1.0 - (t - 1.0) * (t - 1.0));
}

void main() {
    vec4 shape = texture(uShape, vShapeUv);
    vec4 press = texture(uPress, vShapeUv);
    vec4 bristles = texture(uBristles, vBristlesUv);
    vec4 grain = texture(uGrain, vGrainUv);
    vec4 previous = texture(uPrevious, vGlobalUv);
    vec4 last = texture(uPrevious, vDeltaUv);

    float bristle = bristles.r;
    bristle -= 1.0 - uPressure;
    bristle -= (1.0 - grain.r) * 0.4;
    bristle = clamp(bristle, 0.0, 1.0);

    float height = bristle * shape.r * uFlow;

    float a = previous.a + height;

    if (previous.a > 0.0 && height > 0.0) {
        float clamped = mix(previous.a, 1.0, mix(0.5, 1.0, bristle));
        a = clamped + height * 2.0;
        a += (1.0 - press.r) * shape.r * 1.0;
    }

    a = mix(a, last.a, height * 0.2);
    a = max(a, 0.0);

    float rate = (clamp(a, 0.0, 1.0));
    if (previous.a > 1.0) {
        rate = easeOutCirc(height);
    }

    float r = mix(previous.r, uColor.r, rate);
    float g = mix(previous.g, uColor.g, rate);
    float b = mix(previous.b, uColor.b, rate);

    outColor = vec4(r, g, b, a);
}
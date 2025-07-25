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
uniform sampler2D uColor;

uniform float uPressure;
uniform float uFlow;

out vec4 outColor;

const float MAX_HEIGHT = 1.0;
const float ADD_EXTRA_HEIGHT = 2.0;
const float ADD_EDGE_HEIGHT = 1.0; 

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
        float clamped = mix(previous.a, MAX_HEIGHT, mix(0.5, 1.0, bristle));
        a = clamped + height * ADD_EXTRA_HEIGHT;
        a += (1.0 - press.r) * shape.r * ADD_EDGE_HEIGHT;
    }

    a = mix(a, last.a, height * 0.2);
    a = max(a, 0.0);

    float r = previous.r;
    float g = previous.g;
    float b = previous.b;

    vec4 color = texture(uColor, vBristlesUv);

    if (height > 0.0) {
        float rate = easeOutCirc(height);
        if (previous.a <= 1.0) {
            rate = clamp(a, 0.0, 1.0);
        }
        r = mix(r, color.r, rate);
        g = mix(g, color.g, rate);
        b = mix(b, color.b, rate);
    }

    outColor = vec4(r, g, b, a);
}
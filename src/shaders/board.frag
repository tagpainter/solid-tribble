#version 300 es
precision highp float;

in vec2 vUv;

uniform vec2 uResolution;
uniform sampler2D uTexture;

out vec4 outColor;

float easeOutCirc(float x) {
    return sqrt(1.0 - pow(x - 1.0, 2.0));
}

void main() {
    vec2 texel = vec2(1.0 / uResolution);
    
    vec4 center = texture(uTexture, vUv);
    vec4 top = texture(uTexture, vUv + vec2(0.0, texel.y));
    vec4 bottom = texture(uTexture, vUv + vec2(0.0, -texel.y));
    vec4 left = texture(uTexture, vUv + vec2(-texel.x, 0.0));
    vec4 right = texture(uTexture, vUv + vec2(texel.x, 0.0));

    float dx = right.a - left.a;
    float dy = bottom.a - top.a;
    float d = dx + dy;

    vec3 bg = vec3(1.0, 1.0, 1.0);

    float a = clamp(center.a, 0.0, 1.0);

    vec3 rgb = center.rgb;
    if (a > 0.0) {
        rgb /= a;
    }
    rgb += d * 0.1;
    rgb = clamp(rgb, 0.0, 1.0);


    vec3 result = mix(bg, rgb, a);

    outColor = vec4(result, 1.0);
}
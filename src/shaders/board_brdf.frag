#version 300 es
precision highp float;

in vec2 vUv;

uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform sampler2D uSketch;

out vec4 outColor;

const float PI = 3.14159265;
const float diffuseScale = 0.1;
const float specularScale = 1.0;
const float F0 = 0.05;
const float roughness = 0.25; // 0.125;

const vec3 eyeDirection = vec3(0.0, 0.0, 1.0);
const vec3 lightDirection = vec3(-1.0, 2.0, 1.0);

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

float square(float x) {
    return x * x;
}

float easeOutCirc(float x) {
    return sqrt(1.0 - pow(x - 1.0, 2.0));
}

float fresnel(float F0, float lDotH) {
    float f = pow(1.0 - lDotH, 5.0);
    return (1.0 - F0) * f + F0;
}

float GGX(float alpha, float nDotH) {
    float a2 = square(alpha);
    return a2 / (PI * square(square(nDotH) * (a2 - 1.0) + 1.0));
}

float GGGX(float alpha, float nDotL, float nDotV) {
    float a2 = square(alpha);

    float gl = nDotL + sqrt(a2 + (1.0 - a2) * square(nDotL));
    float gv = nDotV + sqrt(a2 + (1.0 - a2) * square(nDotV));

    return 1.0 / (gl * gv);
}

float specularBRDF(vec3 lightDirection, vec3 eyeDirection, vec3 normal, float roughness, float F0) {
    vec3 halfVector = normalize(lightDirection + eyeDirection);

    float nDotH = saturate(dot(normal, halfVector));
    float nDotL = saturate(dot(normal, lightDirection));
    float nDotV = saturate(dot(normal, eyeDirection));
    float lDotH = saturate(dot(lightDirection, halfVector));

    float D = GGX(roughness, nDotH);
    float G = GGGX(roughness, nDotL, nDotV);
    float F = fresnel(F0, lDotH);

    return D * G * F;
}

float getHeight(vec2 uv) {
    vec4 c = texture(uTexture, uv);
    return c.a;
}

vec2 computeGradient(vec2 uv) {
    vec2 delta = 1.0 / uResolution;
  
    float topLeft = getHeight(uv + delta * vec2(-1.0, 1.0));
    float top = getHeight(uv + delta * vec2(0.0, 1.0));
    float topRight = getHeight(uv + delta * vec2(1.0, 1.0));

    float left = getHeight(uv + delta * vec2(-1.0, 0.0));
    float right = getHeight(uv + delta * vec2(1.0, 0.0));

    float bottomLeft = getHeight(uv + delta * vec2(-1.0, -1.0));
    float bottom = getHeight(uv + delta * vec2(0.0, -1.0));
    float bottomRight = getHeight(uv + delta * vec2(1.0, -1.0));

    return vec2(
      1.0 * topLeft - 1.0 * topRight + 2.0 * left - 2.0 * right + 1.0 * bottomLeft - 1.0 * bottomRight,
      -1.0 * topLeft + 1.0 * bottomLeft - 2.0 * top + 2.0 * bottom - 1.0 * topRight + 1.0 * bottomRight
    );
}

void main() {
    vec4 sketch = texture(uSketch, vUv);
    if (sketch.a > 0.0) sketch.rgb /= sketch.a;

    vec2 gradient = computeGradient(vUv);
    vec3 normal = normalize(vec3(gradient.xy, 1.0));

    float diffuse = (dot(lightDirection, vec3(normal.xy, 1.0)));
    diffuse = diffuse * diffuseScale + (1.0 - diffuseScale);

    float specular = specularBRDF(lightDirection, eyeDirection, normal, roughness, F0);
    
    vec4 color = texture(uTexture, vUv);

    float a = clamp(color.a, 0.0, 1.0);

    vec3 rgb = color.rgb;
    if (a > 0.0) {
        rgb /= a;
    }

    vec3 inkColor = rgb * diffuse + specular * specularScale;

    vec3 bg = vec3(1.0, 1.0, 1.0);

    bg = mix(bg, sketch.rgb, sketch.a);
    
    vec3 surfaceColor = mix(bg, inkColor, a);

    outColor = vec4(surfaceColor, 1.0);

    // vec2 texel = vec2(1.0 / uResolution);
    
    // vec4 sketch = texture(uSketch, vUv);
    // if (sketch.a > 0.0) sketch.rgb /= sketch.a;
    
    // vec4 center = texture(uTexture, vUv);
    // vec4 top = texture(uTexture, vUv + vec2(0.0, texel.y));
    // vec4 bottom = texture(uTexture, vUv + vec2(0.0, -texel.y));
    // vec4 left = texture(uTexture, vUv + vec2(-texel.x, 0.0));
    // vec4 right = texture(uTexture, vUv + vec2(texel.x, 0.0));

    // float dx = right.a - left.a;
    // float dy = bottom.a - top.a;
    // float d = dx + dy;

    // vec3 bg = vec3(1.0, 1.0, 1.0);

    // bg = mix(bg, sketch.rgb, sketch.a);

    // float a = clamp(center.a, 0.0, 1.0);

    // vec3 rgb = center.rgb;
    // if (a > 0.0) {
    //     rgb /= a;
    // }
    // rgb += d * 0.1;
    // rgb = clamp(rgb, 0.0, 1.0);


    // vec3 result = mix(bg, rgb, a);

    // outColor = vec4(result, 1.0);
}
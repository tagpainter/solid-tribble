#version 300 es
precision highp float;

in vec2 aNorm;

uniform vec2 uDelta;
uniform vec2 uResolution;
uniform vec2 uPosition;
uniform float uAngle;
uniform float uSize;

out vec2 vShapeUv;
out vec2 vBristlesUv;
out vec2 vGlobalUv;
out vec2 vGrainUv;
out vec2 vDeltaUv;

const float SQRT_2 = sqrt(2.0);

void main() {
    vec2 centered = aNorm - 0.5;
    vec2 scaled = centered * uSize * SQRT_2;
    vec2 worldPos = scaled + uPosition;

    // 투영
    mat3 projection = mat3(
        2.0 / uResolution.x, 0.0, 0.0,
        0.0, -2.0 / uResolution.y, 0.0,
        -1.0, 1.0, 1.0
    );
    vec3 projected = projection * vec3(worldPos, 1.0);
    gl_Position = vec4(projected.xy, 0.0, 1.0);

    // shapeUv만 회전
    float cosA = cos(uAngle);
    float sinA = sin(uAngle);
    mat2 uvRotation = mat2(cosA, -sinA, sinA, cosA);
    vec2 uvCentered = aNorm - 0.5;
    vec2 rotatedUv = uvRotation * uvCentered * SQRT_2 + 0.5;

    vShapeUv = rotatedUv;
    vBristlesUv = aNorm;
    vGrainUv = worldPos / uResolution;
    vGlobalUv = worldPos / uResolution * vec2(1.0, -1.0) + vec2(0.0, 1.0);
    vDeltaUv = (worldPos - uDelta) / uResolution * vec2(1.0, -1.0) + vec2(0.0, 1.0);
}
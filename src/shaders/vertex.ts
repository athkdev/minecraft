export const vertexShader = `
// Vertex Shader (Texture Atlas Support)
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;


void main() {
    // Pass UVs to fragment shader
    vUv = uv;

    // Compute vertex position in world space
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

    // Pass normals for lighting calculations
    vNormal = normalize(normalMatrix * normal);

    // Output final transformed position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
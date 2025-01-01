export const fragmentShader = `
uniform sampler2D textureAtlas; // Your texture atlas
uniform vec2 tileCount;         // Number of tiles along X and Y, e.g., (4, 4) for a 4x4 atlas
uniform float tileIndex;        // The index of the tile (0 to tileCount.x * tileCount.y)

varying vec2 vUv;               // UV coordinates from the vertex shader

void main() {
    // Calculate the size of one tile in the atlas
    vec2 tileUvSize = 1.0 / tileCount;

    // Calculate the tile's position in the atlas based on the tile index
    float tileX = mod(tileIndex, tileCount.x);       // X index in the atlas
    float tileY = floor(tileIndex / tileCount.x);    // Y index in the atlas

    // Adjust the UV coordinates to fit inside the tile
    vec2 tileUv = vUv * tileUvSize; // Scale the UVs down to fit within the tile

    // Offset the UVs to the correct tile in the atlas
    vec2 atlasUv = vec2(tileX, tileY) * tileUvSize + tileUv;

    // Sample the texture atlas using the adjusted UV coordinates
    vec4 color = texture2D(textureAtlas, atlasUv);

    // gl_FragColor = color;
    gl_FragColor = vec4(vUv.xyx, 1);
}
`
import "./style.css";

import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import Stats from "stats.js";
import NOISE from "./perlin";

// import {DayNightCycle} from "./daynightcycle";

// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// import {fragmentShader, vertexShader} from "./shaders";

function getImageUrl(name: string) {
  return `/textures/block/${name}.png`;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  800,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);


scene.background = new THREE.Color(0x08001f);
scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  precision: "highp"
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);


const geometry = new THREE.BoxGeometry(1, 1, 1);
const textureLoader = new THREE.TextureLoader();

const soilTexture = textureLoader.load(getImageUrl("grass_block_side"));
soilTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
// soilTexture.minFilter = THREE.LinearFilter;

const soilTextureNormal = textureLoader.load(getImageUrl("grass_block_side_n"));
soilTextureNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
// soilTextureNormal.minFilter = THREE.LinearFilter;

const grassTop = textureLoader.load(getImageUrl("grass_block_top"));
grassTop.anisotropy = renderer.capabilities.getMaxAnisotropy();
// grassTop.minFilter = THREE.LinearFilter;

const grassTopNormal = textureLoader.load(getImageUrl("grass_block_top_n"));
// grassTopNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
grassTopNormal.minFilter = THREE.LinearFilter;

const grassAtlas = textureLoader.load(getImageUrl("../grass_atlas"));
// grassTopNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
grassAtlas.minFilter = THREE.LinearFilter;

const grassNormal = textureLoader.load(getImageUrl("../grass_n"));
// grassTopNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
grassNormal.minFilter = THREE.LinearFilter;

const sandAtlas = textureLoader.load(getImageUrl("../sand_atlas"));
// grassTopNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
sandAtlas.minFilter = THREE.LinearFilter;

const waterAtlas = textureLoader.load(getImageUrl("../water_t"));
// grassTopNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
waterAtlas.minFilter = THREE.LinearFilter;

// Need a texture loader with that

const n = new NOISE(Math.random());

const group = new THREE.Group();

camera.position.x = 94.52478572761616;
camera.position.y = 37.02590988772987;
camera.position.z = 258.59135821475945;

camera.rotation.x = -0.14021747131515183;
camera.rotation.y = 0.00388714806569381;
camera.rotation.z = 0.0005486449921339769;

// const NOON = 0xeeaf61;
// const DUSK = 0xfb9062;
// const NIGHT = 0x6a0d83;
// const TWILIGHT = 0x093d4e;
const SUNRISE = 0xf4d797;

function setUVs(geometry: any) {
  const uvs = geometry.attributes.uv.array;
  const uvCount = uvs.length / 2;

  const topUV = [
    { x: 0.0, y: 1.0 }, // Top-left corner of the top texture
    { x: 0.5, y: 1.0 }, // Top-right corner of the top texture
    { x: 0.0, y: 0.5 }, // Bottom-left corner of the top texture
    { x: 0.5, y: 0.5 }, // Bottom-right corner of the top texture
  ];

  const bottomUV = [
    { x: 0.5, y: 1.0 }, // Top-left corner of the bottom texture
    { x: 1.0, y: 1.0 }, // Top-right corner of the bottom texture
    { x: 0.5, y: 0.5 }, // Bottom-left corner of the bottom texture
    { x: 1.0, y: 0.5 }, // Bottom-right corner of the bottom texture
  ];

  const sideUV = [
    { x: 0.0, y: 0.5 }, // Top-left corner of the side texture
    { x: 0.5, y: 0.5 }, // Top-right corner of the side texture
    { x: 0.0, y: 0.0 }, // Bottom-left corner of the side texture
    { x: 0.5, y: 0.0 }, // Bottom-right corner of the side texture
  ];

  // Assign UVs for each face
  for (let i = 0; i < uvCount; i++) {
    if (i >= 8 && i <= 11) {
      // Top face
      uvs[i * 2] = topUV[i % 4].x;
      uvs[i * 2 + 1] = topUV[i % 4].y;
    } else if (i >= 12 && i <= 15) {
      // Bottom face
      uvs[i * 2] = bottomUV[i % 4].x;
      uvs[i * 2 + 1] = bottomUV[i % 4].y;
    } else {
      // Side faces
      uvs[i * 2] = sideUV[i % 4].x;
      uvs[i * 2 + 1] = sideUV[i % 4].y;
    }
  }
  geometry.attributes.uv.needsUpdate = true;
}

const CHUNK_SIZE = 200;
const MAX_HEIGHT = 25;
const MAX_DEPTH = 3;
const WATER_LEVEL = MAX_DEPTH - 1;

const geometries: any = [];
const lakeGeometries: any = [];
const waterGeometries: any = [];

for (let x = 0; x < CHUNK_SIZE; ++x) {
  for (let z = 0; z < CHUNK_SIZE; ++z) {

    const baseHeight = n.perlin2(z * (7/ CHUNK_SIZE), x * (7/ CHUNK_SIZE)) * MAX_HEIGHT;

    const featureNoise = n.perlin2(x * (5 / CHUNK_SIZE), z * (5 / CHUNK_SIZE));  // nested perlin noise for generating lakes

    let finalHeight = Math.max(MAX_DEPTH, baseHeight + MAX_DEPTH);

    if (featureNoise < -0.2) {
      finalHeight = Math.min(WATER_LEVEL, finalHeight);
    }

    // place blocks vertically
    
    for (let y = 0; y < finalHeight; ++y) {
      const blockSize = 1;
      const blockGeometry = geometry.clone();

      blockGeometry.translate(x * blockSize, y * blockSize, z * blockSize);

      setUVs(blockGeometry);

      if (featureNoise < -0.2) {
        // Add to lake bed geometries
        
        // If this is the top block of the lake bed, add water blocks above it
        if (y >= finalHeight - 1) {
          // Ad water blocks from the top of the lake bed up to the water level
          for (let waterY = y + 1; waterY <= WATER_LEVEL; waterY++) {
            const waterBlockGeometry = geometry.clone();
            setUVs(waterBlockGeometry);
            waterBlockGeometry.translate(x * blockSize, waterY * blockSize, z * blockSize);
            // waterBlockGeometry.rotateX(-Math.PI / 2);
            waterGeometries.push(waterBlockGeometry);

          }
        }
        else {
          lakeGeometries.push(blockGeometry);

        }
      } else {
        geometries.push(blockGeometry);
      }

    }
  }
}

group.frustumCulled = true;

const regular = BufferGeometryUtils.mergeGeometries(geometries, true);
const lakes = BufferGeometryUtils.mergeGeometries(lakeGeometries, true);
const water = BufferGeometryUtils.mergeGeometries(waterGeometries, true);

const mesh = new THREE.Mesh(
  regular,
  new THREE.MeshStandardMaterial({ map: grassAtlas, normalMap: grassNormal, normalScale: new THREE.Vector2(1/4, -1/4), roughness: 1, metalness: 0 })

);

mesh.castShadow = true;
mesh.receiveShadow = true;

const lakesMesh = new THREE.Mesh(
  lakes,
  new THREE.MeshStandardMaterial({ map: sandAtlas })
);

lakesMesh.receiveShadow = true;

const waterMaterial = new THREE.ShaderMaterial({
  uniforms: {
      time: { value: 0.0 },
      envMap: { value: scene.environment },
      waterTexture: { value: waterAtlas },
      lod: { value: 0.0 }
  },
  vertexShader: `
      uniform float time;
      
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying vec3 vPosition;

      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
          vUv = uv;
          vPosition = position;
          
          // Wave effect
          float wave1 = sin(position.x * 2.0 + time) * 0.1;
          float wave2 = sin(position.z * 1.5 + time * 1.5) * 0.1;
          float wave3 = sin((position.x + position.z) * 1.0 + time * 0.8) * 0.1;
          float noise = random(vec2(position.x * 0.05 + time * 0.05, position.z * 0.05)) * 0.05;
          
          vec3 transformed = position;
          if (abs(position.y - ceil(position.y)) < 0.1) {
              transformed.y += wave1 + wave2 + wave3 + noise;
          }

          vec3 objectNormal = normalize(normal + vec3(
              wave1 * 2.0,
              1.0,
              wave2 * 2.0
          ));
          
          vNormal = normalMatrix * objectNormal;
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          gl_Position = projectionMatrix * mvPosition;
      }
  `,
  fragmentShader: `
      uniform samplerCube envMap;
      uniform sampler2D waterTexture;
      uniform float time;
      uniform float lod;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying vec3 vPosition;

      vec3 inverseTransformDirection(in vec3 dir, in mat4 matrix) {
          return normalize((vec4(dir, 0.0) * matrix).xyz);
      }

      void main() {
          vec3 reflectedDirection = normalize(reflect(vViewPosition, normalize(vNormal)));
          reflectedDirection = inverseTransformDirection(-reflectedDirection, viewMatrix);

          vec4 envColor = textureCube(envMap, reflectedDirection, lod);

          // Animate water texture
          vec2 uv = vUv;
          uv.x += sin(vPosition.x * 0.05 + time * 0.5) * 0.01;
          uv.y += cos(vPosition.z * 0.05 + time * 0.5) * 0.01;
          
          vec4 waterColor = texture2D(waterTexture, uv);

          float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormal), normalize(-vViewPosition))), 4.0);

          vec4 finalColor = mix(waterColor, envColor, fresnel * 0.7);
          finalColor.a = 0.9;

          gl_FragColor = finalColor;
      }
  `,
  transparent: true,
  side: THREE.DoubleSide
});

// Update texture settings
// waterAtlas.wrapS = THREE.RepeatWrapping;
// waterAtlas.wrapT = THREE.RepeatWrapping;
waterAtlas.repeat.set(1, 1);

waterMaterial.uniforms.envMap.value = scene.environment;

const waterMaterial1 = new THREE.MeshStandardMaterial({
  map: waterAtlas,
  transparent: true,
  opacity: 0.7,
  envMap: scene.environment,
  roughness: 0.2,
  metalness: 0.8
});

const waterMesh = new THREE.Mesh(
  water,
waterMaterial1
);

waterMesh.receiveShadow = true;

group.add(mesh, lakesMesh, waterMesh);

const originalPositions = water.attributes.position.array.slice();

// -----------------------------------------------------

// CLOUD GENERATION

// function generateNoiseCloudTexture(size: any) {
//   const canvas = document.createElement('canvas');
//   canvas.width = size;
//   canvas.height = size;
//   const ctx: any = canvas.getContext('2d');

//   // Create sky gradient
//   const skyGradient = ctx.createLinearGradient(0, 0, 0, size);
//   skyGradient.addColorStop(0, '#87CEEB');
//   skyGradient.addColorStop(1, '#E0F6FF');
//   ctx.fillStyle = skyGradient;
//   ctx.fillRect(0, 0, size, size);

//   // Create noise-based clouds
//   const imageData = ctx.getImageData(0, 0, size, size);
//   const data = imageData.data;

//   for (let x = 0; x < size; x++) {
//       for (let y = 0; y < size; y++) {
//           const i = (y * size + x) * 4;

//           // Generate multiple layers of noise
//           const n1 = n.perlin2(x * 0.01, y * 0.01);
//           const n2 = n.perlin2(x * 0.02 + 500, y * 0.02 + 500) * 0.5;
//           const n3 = n.perlin2(x * 0.04 + 1000, y * 0.04 + 1000) * 0.25;

//           let noiseVal = (n1 + n2 + n3);
          
//           // Only show clouds in upper portion and add vertical falloff
//           const verticalFalloff = 1 - (y / size);
//           noiseVal *= verticalFalloff * verticalFalloff;

//           // Add cloud color
//           if (noiseVal > 0.1) {
//               const alpha = Math.min((noiseVal - 0.1) * 2, 0.8);
//               data[i] = 255;     // R
//               data[i + 1] = 255; // G
//               data[i + 2] = 255; // B
//               data[i + 3] = alpha * 255; // A
//           }
//       }
//   }

//   ctx.putImageData(imageData, 0, 0);
//   return canvas;
// }

// const size = 512;
// const faces = Array(6).fill(-1).map(() => generateNoiseCloudTexture(size));
// const cubeTexture = new THREE.CubeTexture(faces);
// cubeTexture.needsUpdate = true;

// scene.environment = cubeTexture;
// scene.background = cubeTexture;  // Optional
// waterMaterial.uniforms.envMap.value = scene.environment

// -----------------------------------------------------

const ambientLight = new THREE.AmbientLight(0x555555, 1);

const directionalLight = new THREE.DirectionalLight( SUNRISE, 0.5 );
directionalLight.position.set(300, 70, 300);
directionalLight.castShadow = true;
directionalLight.intensity = 1;
directionalLight.target = group;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height= 2048;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 2000;

directionalLight.shadow.camera.left = -1 * (Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2));
directionalLight.shadow.camera.right = 1 * (Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2));
directionalLight.shadow.camera.top = 1 * (Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2));
directionalLight.shadow.camera.bottom = -1 * (Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2));

scene.add( directionalLight, ambientLight );

// const dayNightCycle = new DayNightCycle(scene, directionalLight, ambientLight);

let lastTime = performance.now();

// const DAY_COLORS = {
//   DAWN: 0xff9a76,    // Warm orange
//   NOON: 0xffffff,    // Bright white
//   DUSK: 0xff6b6b,    // Warm red
//   NIGHT: 0x1a237e    // Deep blue
// };

// let dayTime = 0;
// const DAY_DURATION = 300; // 5 minutes per cycle

function animate() {

  const currentTime = performance.now();
  // const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  stats.begin();
  controls.update();

  // dayNightCycle.update(deltaTime);

  const positions = waterMesh.geometry.attributes.position.array;
  const time = performance.now() * 0.001; // Current time in seconds
  
  for(let i = 0; i < positions.length; i += 3) {
      // Get the world position of this vertex
      const worldX = positions[i];
      const worldZ = positions[i + 2];
      
      // Create wave motion
      const wave1 = Math.sin(worldX * 0.5 + time * 2.0) * 0.1;
      const wave2 = Math.sin(worldZ * 0.3 + time * 1.5) * 0.1;
      const wave3 = Math.sin((worldX + worldZ) * 0.4 + time) * 0.05;
      
      // Only modify Y position (index + 1)
      positions[i + 1] = originalPositions[i + 1] + wave1 + wave2 + wave3;
  } 

  // Mark geometry for update
  waterMesh.geometry.attributes.position.needsUpdate = true;
  waterMesh.geometry.computeVertexNormals();
  
  // Update water material time uniform if you're still using it
  if (waterMaterial.uniforms && waterMaterial.uniforms.time) {
      waterMaterial.uniforms.time.value = time;
  }

  stats.end();

  waterMaterial.uniforms.time.value += 0.016;
  
  const t = performance.now() * 0.0001;
  const sunX = Math.cos(t) * 300;
  const sunHeight = Math.sin(t) * 230 + 70;  // Oscillate between -230 and +230, offset by 70
  const sunZ = Math.sin(t) * 300;

  directionalLight.position.set(sunX, sunHeight, sunZ);

  // Optional: adjust light intensity based on height
  const heightFactor = (sunHeight - 70) / 230;  // Convert height to -1 to 1 range
  directionalLight.intensity = Math.max(0.2, heightFactor + 0.5);  // Keep minimum lighting at 0.2


  renderer.render(scene, camera);
}

scene.add(group);



const controls = new MapControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.autoRotate = false;
// controls.autoRotateSpeed = 0.08;

controls.screenSpacePanning = false;

controls.minDistance = 1;
controls.maxDistance = 500;

const app = document.getElementById("app");

app?.appendChild(renderer.domElement);

renderer.setAnimationLoop(animate);

const stats = new Stats();
stats.showPanel(1);
app?.appendChild(stats.dom);

import "./style.css";

import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import Stats from "stats.js";
import NOISE from "./perlin";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function getImageUrl(name: string) {
  return `/textures/block/${name}.png`;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  800,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

scene.background = new THREE.Color(0x08001f);
scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  precision: "highp",
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

let sheep: THREE.Object3D;
let sheepMixer: THREE.AnimationMixer;
let walkAction: THREE.AnimationAction;

// Find valid spawn position for sheep
function findValidSpawnPosition(): THREE.Vector3 {
  let x = Math.floor(Math.random() * CHUNK_SIZE);
  let z = Math.floor(Math.random() * CHUNK_SIZE);
  
  // Find highest solid block at this x,z coordinate
  let y = MAX_HEIGHT + MAX_DEPTH - 1;
  while (y >= 0) {
    if (terrainMap[x][y][z] === BLOCK_TYPE.SOLID) {
      return new THREE.Vector3(x, y + 1, z); // Position one block above solid ground
    }
    y--;
  }
  
  // If no valid position found, try again
  return findValidSpawnPosition();
}

// Load sheep model
gltfLoader.load('/models/wolf.glb', (gltf) => {
  sheep = gltf.scene;
  sheep.scale.set(0.5, 0.5, 0.5);
  
  const spawnPos = findValidSpawnPosition();
  sheep.position.copy(spawnPos);
  
  sheep.castShadow = true;
  sheep.receiveShadow = true;
  scene.add(sheep);

  // Setup animations
  sheepMixer = new THREE.AnimationMixer(sheep);
  const walkAnimation = gltf.animations[0];
  walkAction = sheepMixer.clipAction(walkAnimation);
  walkAction.play();

  // Start sheep movement
  moveRandomly();
});

let targetPosition = new THREE.Vector3();
let isMoving = false;

function moveRandomly() {
  if (!sheep) return;

  // Find new valid target position
  const newTarget = findValidSpawnPosition();
  targetPosition.copy(newTarget);

  isMoving = true;

  // Face target direction
  const direction = targetPosition.clone().sub(sheep.position);
  sheep.lookAt(targetPosition);
}

function updateSheep() {
  if (!sheep || !isMoving) return;

  const speed = 0.1;
  const distanceToTarget = sheep.position.distanceTo(targetPosition);

  if (distanceToTarget > speed) {
    // Move towards target
    const direction = targetPosition.clone().sub(sheep.position).normalize();
    sheep.position.add(direction.multiplyScalar(speed));
    sheepMixer.update(0.016);
  } else {
    // Reached target, stop and wait before next movement
    isMoving = false;
    setTimeout(moveRandomly, Math.random() * 3000 + 1000);
  }
}

const soilTexture = textureLoader.load(getImageUrl("grass_block_side"));
soilTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const soilTextureNormal = textureLoader.load(getImageUrl("grass_block_side_n"));
soilTextureNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();

const grassTop = textureLoader.load(getImageUrl("grass_block_top"));
grassTop.anisotropy = renderer.capabilities.getMaxAnisotropy();

const grassTopNormal = textureLoader.load(getImageUrl("grass_block_top_n"));
grassTopNormal.minFilter = THREE.LinearFilter;

const grassAtlas = textureLoader.load(getImageUrl("../grass_atlas"));
grassAtlas.minFilter = THREE.LinearFilter;

const grassNormal = textureLoader.load(getImageUrl("../grass_n"));
grassNormal.minFilter = THREE.LinearFilter;

const sandAtlas = textureLoader.load(getImageUrl("../sand_atlas"));
sandAtlas.minFilter = THREE.LinearFilter;

const waterAtlas = textureLoader.load(getImageUrl("../water_t"));
waterAtlas.minFilter = THREE.LinearFilter;

const n = new NOISE(Math.random());

const group = new THREE.Group();

camera.position.x = 94.52478572761616;
camera.position.y = 37.02590988772987;
camera.position.z = 258.59135821475945;

camera.rotation.x = -0.14021747131515183;
camera.rotation.y = 0.00388714806569381;
camera.rotation.z = 0.0005486449921339769;

const SUNRISE = 0xf4d797;

function setUVs(geometry: any) {
  const uvs = geometry.attributes.uv.array;
  const uvCount = uvs.length / 2;

  const topUV = [
    { x: 0.0, y: 1.0 },
    { x: 0.5, y: 1.0 },
    { x: 0.0, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ];

  const bottomUV = [
    { x: 0.5, y: 1.0 },
    { x: 1.0, y: 1.0 },
    { x: 0.5, y: 0.5 },
    { x: 1.0, y: 0.5 },
  ];

  const sideUV = [
    { x: 0.0, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.0, y: 0.0 },
    { x: 0.5, y: 0.0 },
  ];

  for (let i = 0; i < uvCount; i++) {
    if (i >= 8 && i <= 11) {
      uvs[i * 2] = topUV[i % 4].x;
      uvs[i * 2 + 1] = topUV[i % 4].y;
    } else if (i >= 12 && i <= 15) {
      uvs[i * 2] = bottomUV[i % 4].x;
      uvs[i * 2 + 1] = bottomUV[i % 4].y;
    } else {
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

const terrainMap: number[][][] = Array(CHUNK_SIZE)
  .fill(null)
  .map(() =>
    Array(MAX_HEIGHT + MAX_DEPTH)
      .fill(null)
      .map(() => Array(CHUNK_SIZE).fill(0))
  );

const BLOCK_TYPE = {
  AIR: 0,
  SOLID: 1,
  LAKE_BED: 2,
  WATER: 3,
};

for (let x = 0; x < CHUNK_SIZE; ++x) {
  for (let z = 0; z < CHUNK_SIZE; ++z) {
    const baseHeight =
      n.perlin2(z * (7 / CHUNK_SIZE), x * (7 / CHUNK_SIZE)) * MAX_HEIGHT;

    const featureNoise = n.perlin2(x * (5 / CHUNK_SIZE), z * (5 / CHUNK_SIZE));

    let finalHeight = Math.max(MAX_DEPTH, baseHeight + MAX_DEPTH);

    if (featureNoise < -0.2) {
      finalHeight = Math.min(WATER_LEVEL, finalHeight);
    }

    for (let y = 0; y < finalHeight; ++y) {
      if (featureNoise < -0.2) {
        terrainMap[x][y][z] = BLOCK_TYPE.LAKE_BED;
      } else {
        terrainMap[x][y][z] = BLOCK_TYPE.SOLID;
      }
    }

    if (featureNoise < -0.2) {
      for (let y = finalHeight; y <= WATER_LEVEL; ++y) {
        terrainMap[x][y][z] = BLOCK_TYPE.WATER;
      }
    }
  }
}

function isBlockOccluded(x: number, y: number, z: number): boolean {
  if (
    x === 0 ||
    x === CHUNK_SIZE - 1 ||
    y === 0 ||
    z === 0 ||
    z === CHUNK_SIZE - 1
  ) {
    return false;
  }

  return (
    terrainMap[x + 1][y][z] !== BLOCK_TYPE.AIR &&
    terrainMap[x - 1][y][z] !== BLOCK_TYPE.AIR &&
    terrainMap[x][y + 1][z] !== BLOCK_TYPE.AIR &&
    terrainMap[x][y - 1][z] !== BLOCK_TYPE.AIR &&
    terrainMap[x][y][z + 1] !== BLOCK_TYPE.AIR &&
    terrainMap[x][y][z - 1] !== BLOCK_TYPE.AIR
  );
}

function isFaceVisible(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): boolean {
  if (
    x2 < 0 ||
    x2 >= CHUNK_SIZE ||
    y2 < 0 ||
    y2 >= MAX_HEIGHT + MAX_DEPTH ||
    z2 < 0 ||
    z2 >= CHUNK_SIZE
  ) {
    return true;
  }

  return (
    terrainMap[x2][y2][z2] === BLOCK_TYPE.AIR ||
    (terrainMap[x1][y1][z1] !== BLOCK_TYPE.WATER &&
      terrainMap[x2][y2][z2] === BLOCK_TYPE.WATER)
  );
}

const geometries: any = [];
const lakeGeometries: any = [];
const waterGeometries: any = [];

let totalBlocks = 0;
let visibleBlocks = 0;

for (let x = 0; x < CHUNK_SIZE; ++x) {
  for (let z = 0; z < CHUNK_SIZE; ++z) {
    for (let y = 0; y < terrainMap[x].length; ++y) {
      if (terrainMap[x][y][z] === BLOCK_TYPE.AIR) continue;

      totalBlocks++;

      if (isBlockOccluded(x, y, z)) continue;

      visibleBlocks++;

      const blockSize = 1;

      const visibleFaces = {
        px: isFaceVisible(x, y, z, x + 1, y, z),
        nx: isFaceVisible(x, y, z, x - 1, y, z),
        py: isFaceVisible(x, y, z, x, y + 1, z),
        ny: isFaceVisible(x, y, z, x, y - 1, z),
        pz: isFaceVisible(x, y, z, x, y, z + 1),
        nz: isFaceVisible(x, y, z, x, y, z - 1),
      };

      if (Object.values(visibleFaces).some((visible) => visible)) {
        const blockGeometry = geometry.clone();
        blockGeometry.translate(x * blockSize, y * blockSize, z * blockSize);
        setUVs(blockGeometry);

        if (terrainMap[x][y][z] === BLOCK_TYPE.WATER) {
          waterGeometries.push(blockGeometry);
        } else if (terrainMap[x][y][z] === BLOCK_TYPE.LAKE_BED) {
          lakeGeometries.push(blockGeometry);
        } else {
          geometries.push(blockGeometry);
        }
      }
    }
  }
}

console.log([...geometries, ...lakeGeometries, ...waterGeometries].length);

group.frustumCulled = true;

const regular = BufferGeometryUtils.mergeGeometries(geometries, true);
const lakes = BufferGeometryUtils.mergeGeometries(lakeGeometries, true);
const water = BufferGeometryUtils.mergeGeometries(waterGeometries, true);

const mesh = new THREE.Mesh(
  regular,
  new THREE.MeshStandardMaterial({
    map: grassAtlas,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(1 / 4, -1 / 4),
    roughness: 1,
    metalness: 0,
  })
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
    lod: { value: 0.0 },
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
  side: THREE.DoubleSide,
});

waterAtlas.repeat.set(1, 1);

waterMaterial.uniforms.envMap.value = scene.environment;

const waterMaterial1 = new THREE.MeshStandardMaterial({
  map: waterAtlas,
  transparent: true,
  opacity: 0.7,
  envMap: scene.environment,
  roughness: 0.2,
  metalness: 0.8,
});

const waterMesh = new THREE.Mesh(water, waterMaterial1);

waterMesh.receiveShadow = true;

group.add(mesh, lakesMesh, waterMesh);

const originalPositions = water.attributes.position.array.slice();

const ambientLight = new THREE.AmbientLight(0x555555, 1);

const directionalLight = new THREE.DirectionalLight(SUNRISE, 0.5);
directionalLight.position.set(300, 70, 300);
directionalLight.castShadow = true;
directionalLight.intensity = 1;
directionalLight.target = group;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 2000;

directionalLight.shadow.camera.left =
  -1 * Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2);
directionalLight.shadow.camera.right =
  1 * Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2);
directionalLight.shadow.camera.top =
  1 * Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2);
directionalLight.shadow.camera.bottom =
  -1 * Math.sqrt(CHUNK_SIZE ** 2 + CHUNK_SIZE ** 2);

scene.add(directionalLight, ambientLight);

function updateShadowBias() {
  const cameraHeight = camera.position.y;
  const dynamicBias = -0.001 - cameraHeight * 0.0001;
  directionalLight.shadow.bias = Math.max(-0.01, dynamicBias);
}

const controls = new MapControls(camera, renderer.domElement);

const initialDistance = camera.position.distanceTo(controls.target);
let currentZoom = initialDistance;
let targetZoom = initialDistance;

renderer.domElement.addEventListener("wheel", (e) => {
  e.preventDefault();
  targetZoom += e.deltaY * 0.1;
  targetZoom = Math.max(
    controls.minDistance,
    Math.min(targetZoom, controls.maxDistance)
  );
});

function animate() {
  stats.begin();
  controls.update();

  currentZoom += (targetZoom - currentZoom) * 0.05;

  const direction = camera.position.clone().sub(controls.target).normalize();
  camera.position
    .copy(controls.target)
    .add(direction.multiplyScalar(currentZoom));

  const positions = waterMesh.geometry.attributes.position.array;
  const time = performance.now() * 0.001;

  for (let i = 0; i < positions.length; i += 3) {
    const worldX = positions[i];
    const worldZ = positions[i + 2];

    const wave1 = Math.sin(worldX * 0.5 + time * 2.0) * 0.2;
    const wave2 = Math.sin(worldZ * 0.3 + time * 1.5) * 0.2;
    const wave3 = Math.sin((worldX + worldZ) * 0.4 + time) * 0.05;

    positions[i + 1] = originalPositions[i + 1] + wave1 + wave2 + wave3;
  }

  waterMesh.geometry.attributes.position.needsUpdate = true;

  stats.end();

  waterMaterial.uniforms.time.value += 0.016;

  const t = performance.now() * 0.0001;
  const sunX = Math.cos(t) * 300;
  const sunHeight = Math.sin(t) * 230 + 70;
  const sunZ = Math.sin(t) * 300;

  directionalLight.position.set(sunX, sunHeight, sunZ);

  const heightFactor = (sunHeight - 70) / 230;
  directionalLight.intensity = Math.max(0.2, heightFactor + 0.5);

  updateShadowBias();

  // Update sheep movement and animation
  updateSheep();

  renderer.render(scene, camera);
}

scene.add(group);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.enableZoom = false;

controls.autoRotate = false;

controls.screenSpacePanning = false;

controls.minDistance = 1;
controls.maxDistance = 500;

const app = document.getElementById("app");

app?.appendChild(renderer.domElement);

renderer.setAnimationLoop(animate);

const stats = new Stats();
stats.showPanel(1);
app?.appendChild(stats.dom);

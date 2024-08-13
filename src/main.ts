import "./style.css";

import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";

import NOISE from "./perlin"

const { log } = console;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

scene.background = new THREE.Color(0xa6a4a4);
scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const textureLoader = new THREE.TextureLoader();
const soilTexture = textureLoader.load(
    "../public/textures/block/grass_block_side.png"
);
soilTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
// soilTexture.minFilter = THREE.LinearFilter;

const soilTextureNormal = textureLoader.load(
    "../public/textures/block/grass_block_side_n.png"
);
soilTextureNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
// soilTextureNormal.minFilter = THREE.LinearFilter;

const grassTop = textureLoader.load(
    "../public/textures/block/grass_block_top.png"
);
grassTop.anisotropy = renderer.capabilities.getMaxAnisotropy();
// grassTop.minFilter = THREE.LinearFilter;

const grassTopNormal = textureLoader.load(
    "../public/textures/block/grass_block_top_n.png"
);
// grassTopNormal.anisotropy = renderer.capabilities.getMaxAnisotropy();
grassTopNormal.minFilter = THREE.LinearFilter;

// Need a texture loader with that

const n = new NOISE(Math.random());

log(n.perlin2(3.4, 5.6))


const group = new THREE.Group();

camera.position.x = 50;
camera.position.y = 15;
camera.position.z = 50;

const NOON = 0xeeaf61;
const DUSK = 0xfb9062;
const NIGHT = 0x6a0d83;

const light = new THREE.DirectionalLight(NOON, 1);
light.castShadow = true;
light.position.set(0, 1, 1);
light.target = group;

// setup shadow properties of the light
light.shadow.mapSize.width = 2048; // default
light.shadow.mapSize.height = 2048; // default
light.shadow.camera.near = 0.5; // default
light.shadow.camera.far = 500; // default

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(10, 20, 10);
spotLight.castShadow = true;
spotLight.angle = Math.PI / 6; // Control spotlight angle
spotLight.penumbra = 0.1; // Softness of the shadow edge
spotLight.decay = 2; // How quickly the light fades
spotLight.distance = 100; // Distance where light intensity falls off

// Configure spotlight shadow properties
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.camera.near = 0.5;
spotLight.shadow.camera.far = 50;
spotLight.shadow.camera.fov = 30; // Field of view for shadow camera

//scene.add(spotLight);

const CHUNK_SIZE = 36;;
let MAX_HEIGHT = 10;

for (let x = 0; x < 50; ++x) {
    for (let z = 0; z < CHUNK_SIZE; ++z) {
        const height = Math.floor(Math.random() * MAX_HEIGHT);


        const h = n.perlin2(z * (5/CHUNK_SIZE), x * (5/CHUNK_SIZE)) * MAX_HEIGHT;
        
        let lastBlock = null;

        const sideMaterial = new THREE.MeshStandardMaterial({
            map: soilTexture,
            normalMap: soilTextureNormal
        })
        const topMaterial = new THREE.MeshStandardMaterial({
            map: grassTop,
            color: new THREE.Color(0x7cbd6b),
            normalMap: grassTopNormal
            
        })

        const materialMap = [
            sideMaterial,
            sideMaterial,
            topMaterial,
            sideMaterial,
            sideMaterial,
            sideMaterial,
        ];


        // place blocks vertically
        for (let y = 0; y < Math.max(1, h); ++y) {
            const block = new THREE.Mesh(
                geometry,
                materialMap
            );
            const blockSize = 1;

            block.position.set(x * blockSize, y * blockSize, z * blockSize);
            block.castShadow = true;
            block.receiveShadow = false;

            scene.add(block);

            block.frustumCulled = true;

            lastBlock = block;
        }
    }
}

const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
dirLight1.position.set(1, 1, 1);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(-10, 10, 10);
//scene.add(pointLight);
//

group.frustumCulled = true;

function animate() {
    controls.update();

    renderer.render(scene, camera);
}

//const hemisphere_light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
const hemisphere_light = new THREE.HemisphereLight(0xfb9062, 0x080820, 1);

scene.add(group);
scene.add(light);
scene.add(hemisphere_light);

const ambientLight = new THREE.AmbientLight(0x555555);
scene.add(ambientLight);

const controls = new MapControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.screenSpacePanning = false;

controls.minDistance = 1;
controls.maxDistance = 500;

document.body.appendChild(renderer.domElement);

renderer.setAnimationLoop(animate);

import * as THREE from "three";

export type TBlock = {
  id: string;
  height?: number;
  width?: number;
  type?: string;
  geometry: THREE.BoxGeometry;
  material: THREE.Material;
};

import * as THREE from "three";

export class BlockBuilder {
  type: string;
  geometry: THREE.BoxGeometry;
  material: any;

  constructor() {
    this.type = "TBlock";
    this.geometry = new THREE.BoxGeometry();
    this.material = new THREE.MeshStandardMaterial();
  }

  toString() {
    return JSON.stringify(this);
  }

  withGeometry(g: THREE.BoxGeometry) {
    this.geometry = g;
    return this;
  }

  withMaterial(m: any) {
    this.material = m;
    return this;
  }

  package(): THREE.Mesh {
    // do any sanity checks for required attributes here
    return new THREE.Mesh(this.geometry, this.material);
  }
}

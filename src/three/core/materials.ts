import * as THREE from 'three';

/* Two materials carry almost every island prop: flat-shaded, vertex-coloured
   "lit" geometry, and unlit "glow" geometry (tone mapping off, so HDR vertex colours
   reach the bloom pass). They are module singletons: tiny, shared by every mesh. */
let lit: THREE.MeshStandardMaterial | null = null;
let glow: THREE.MeshBasicMaterial | null = null;
let glass: THREE.MeshStandardMaterial | null = null;

export function litMaterial() {
  if (!lit) {
    lit = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.82,
      metalness: 0.04,
    });
  }
  return lit;
}

export function glowMaterial() {
  if (!glow) glow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  return glow;
}

/** Translucent panels (hologram slices, queue towers). */
export function glassMaterial() {
  if (!glass) {
    glass = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }
  return glass;
}

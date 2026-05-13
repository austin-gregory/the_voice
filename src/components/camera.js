/**
 * Camera Component
 * FPS camera with YXZ rotation order to prevent gimbal lock.
 */

import { PerspectiveCamera } from 'three';

function createCamera() {
  const camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.rotation.order = 'YXZ';
  camera.position.set(0, 1.6, 2);

  return { camera };
}

export { createCamera };

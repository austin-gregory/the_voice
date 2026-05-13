/**
 * Flashlight Component
 * Loads the flashlight.glb model and attaches it to the camera with a SpotLight.
 * This is the ONLY player light source.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function createFlashlight(camera) {
  // SpotLight - warm white flashlight beam
  const spotLight = new THREE.SpotLight(
    0xfff5e0,  // slightly warm white
    8,         // intensity
    18,        // distance
    0.3,       // angle (radians, tight beam)
    0.4,       // penumbra (soft edge)
    1          // decay
  );

  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 0.1;
  spotLight.shadow.camera.far = 18;
  spotLight.shadow.bias = -0.0005;

  // Position slightly in front of the player's eye
  spotLight.position.set(0, 0, -0.1);

  // Target must be child of camera so it moves with it
  const target = new THREE.Object3D();
  target.position.set(0, 0, -5);
  camera.add(target);
  spotLight.target = target;

  camera.add(spotLight);

  // Load the flashlight GLB model and attach to camera
  const loader = new GLTFLoader();
  loader.load(
    '/assets/flashlight.glb',
    (gltf) => {
      const model = gltf.scene;
      // Position the model in the lower-right of the view like an FPS weapon
      model.scale.setScalar(0.15);
      model.position.set(0.25, -0.2, -0.4);
      model.rotation.set(0, Math.PI, 0);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      camera.add(model);
    },
    undefined,
    (error) => {
      console.warn('Flashlight model not loaded, using light only:', error);
    }
  );

  return spotLight;
}

export { createFlashlight };

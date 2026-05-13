/**
 * Controls System
 * WASD + mouse look with pointer lock.
 * E key for interaction. No shooting.
 * Quake-style movement feel with proper acceleration.
 */

import * as THREE from 'three';

const keyStates = {};

function setupControls(camera, playerVelocity, playerDirection, onInteract) {
  document.addEventListener('keydown', (event) => {
    keyStates[event.code] = true;

    if (event.code === 'KeyE' && onInteract) {
      onInteract();
    }
  });

  document.addEventListener('keyup', (event) => {
    keyStates[event.code] = false;
  });

  document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
  });

  // Mouse look
  document.body.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
      camera.rotation.y -= event.movementX * 0.0022;
      camera.rotation.x -= event.movementY * 0.0022;
      // Pitch clamp
      camera.rotation.x = Math.max(-1.45, Math.min(1.45, camera.rotation.x));
    }
  });

  function applyControls(deltaTime, playerOnFloor, camera) {
    // Quake-style ground/air acceleration
    const walkSpeed = 6.8;
    const groundAccel = 45;
    const airAccel = 12;
    const groundFriction = 10;
    const airFriction = 0.35;
    const jumpVel = 6.9;

    camera.updateMatrixWorld();

    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();

    if (camera.matrixWorld) {
      forward.setFromMatrixColumn(camera.matrixWorld, 0);
      forward.crossVectors(camera.up, forward).normalize();
      side.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    }

    // Build wish direction
    const wishDir = new THREE.Vector3();
    if (keyStates['KeyW']) wishDir.add(forward);
    if (keyStates['KeyS']) wishDir.sub(forward);
    if (keyStates['KeyA']) wishDir.sub(side);
    if (keyStates['KeyD']) wishDir.add(side);

    if (wishDir.lengthSq() > 0) {
      wishDir.normalize();

      const maxSpeed = walkSpeed;
      const accel = playerOnFloor ? groundAccel : airAccel;

      const curSpeed = playerVelocity.dot(wishDir);
      const addSpeed = Math.max(0, maxSpeed - curSpeed);
      const accelAmt = Math.min(addSpeed, accel * maxSpeed * deltaTime);
      playerVelocity.addScaledVector(wishDir, accelAmt);
    }

    // Jump
    if (playerOnFloor && keyStates['Space']) {
      playerVelocity.y = jumpVel;
    }
  }

  return applyControls;
}

export { setupControls, keyStates };

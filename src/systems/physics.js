/**
 * Physics System
 * Gravity, player capsule collider, Octree collision.
 * No shooting, no spheres - horror exploration only.
 */

import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/Addons.js';
import { Octree } from 'three/examples/jsm/Addons.js';

const GRAVITY = 22;
const STEPS_PER_FRAME = 5;

function createPhysics(scene) {
  const worldOctree = new Octree();

  const playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1.75, 0),
    0.36
  );

  const playerVelocity = new THREE.Vector3();
  const playerDirection = new THREE.Vector3();
  const floorState = { onFloor: false };

  function updatePlayer(deltaTime, worldOctree, camera) {
    if (!playerCollider || !playerCollider.end) return;

    let damping = Math.exp(-10 * deltaTime) - 1;

    if (!floorState.onFloor) {
      playerVelocity.y -= GRAVITY * deltaTime;
      damping *= 0.1;
    }

    playerVelocity.addScaledVector(playerVelocity, damping);
    playerCollider.translate(playerVelocity.clone().multiplyScalar(deltaTime));

    const result = worldOctree.capsuleIntersect(playerCollider);
    floorState.onFloor = result ? result.normal.y > 0 : false;

    if (result) {
      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(playerVelocity)
      );
      playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }

    if (playerCollider && playerCollider.end) {
      camera.position.copy(playerCollider.end);
    }
  }

  function teleportPlayer(position) {
    const offset = new THREE.Vector3(0, 0.35, 0);
    playerCollider.start.copy(position).add(offset);
    playerCollider.end.copy(position).add(new THREE.Vector3(0, 1.75, 0));
    playerVelocity.set(0, 0, 0);
  }

  return {
    playerCollider,
    playerVelocity,
    playerDirection,
    updatePlayer,
    teleportPlayer,
    worldOctree,
    floorState,
  };
}

export { createPhysics, STEPS_PER_FRAME };

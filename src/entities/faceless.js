/**
 * The Faceless - Monster Entity
 * Procedural humanoid mesh (pale blue translucent).
 * Appears 3m in front of player on trigger, tilts head, triggers QTE.
 */

import * as THREE from 'three';
import { audioSystem } from '../systems/audio.js';

class Faceless {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.isVisible = false;
    this.headTiltElapsed = 0;
    this.headTiltDuration = 1.0;
    this.isTilting = false;
    this.dissolveElapsed = 0;
    this.isDisssolving = false;
    this.dissolveDuration = 0.5;

    this._createMesh();
  }

  _createMesh() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xc8d8ff,
      transparent: true,
      opacity: 0.7,
      emissive: 0x8090ff,
      emissiveIntensity: 0.3,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Body - tall thin capsule
    const bodyGeom = new THREE.CapsuleGeometry(0.2, 1.4, 8, 16);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.9;
    group.add(body);

    // Head - featureless sphere
    const headGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xc8d8ff,
      transparent: true,
      opacity: 0.7,
      emissive: 0x8090ff,
      emissiveIntensity: 0.3,
      roughness: 0.9,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.8;
    group.add(head);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.08, 0.9, 0.08);
    const armMat = bodyMat.clone();

    const leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-0.3, 1.0, 0);
    leftArm.rotation.z = 0.1;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, armMat);
    rightArm.position.set(0.3, 1.0, 0);
    rightArm.rotation.z = -0.1;
    group.add(rightArm);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const legMat = bodyMat.clone();

    const leftLeg = new THREE.Mesh(legGeom, legMat);
    leftLeg.position.set(-0.12, 0, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, legMat);
    rightLeg.position.set(0.12, 0, 0);
    group.add(rightLeg);

    group.visible = false;
    this.scene.add(group);
    this.mesh = group;
    this.headMesh = head;
  }

  spawn(camera) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const spawnPos = new THREE.Vector3();
    spawnPos.copy(camera.position);
    spawnPos.addScaledVector(direction, 3);
    spawnPos.y = camera.position.y - 1.0;

    this.mesh.position.copy(spawnPos);
    this.mesh.lookAt(camera.position.x, spawnPos.y, camera.position.z);

    this.mesh.visible = true;
    this.isVisible = true;
    this.headTiltElapsed = 0;
    this.isTilting = true;
    this.isDisssolving = false;
    this.dissolveElapsed = 0;

    this.mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = 0.7;
      }
    });

    audioSystem.playMonsterVoice();
  }

  update(deltaTime) {
    if (!this.isVisible) return null;

    // Head tilt animation
    if (this.isTilting) {
      this.headTiltElapsed += deltaTime;
      const t = Math.min(this.headTiltElapsed / this.headTiltDuration, 1);
      this.headMesh.rotation.z = (Math.PI / 4) * t;

      if (t >= 1) {
        this.isTilting = false;
        return 'tilt_complete';
      }
    }

    // Dissolve animation
    if (this.isDisssolving) {
      this.dissolveElapsed += deltaTime;
      const t = Math.min(this.dissolveElapsed / this.dissolveDuration, 1);
      const opacity = 0.7 * (1 - t);

      this.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = opacity;
        }
      });

      if (t >= 1) {
        this.mesh.visible = false;
        this.isVisible = false;
        this.isDisssolving = false;
        return 'dissolved';
      }
    }

    return null;
  }

  dissolve() {
    this.isDisssolving = true;
    this.dissolveElapsed = 0;
    audioSystem.playEscapeSound();
  }

  hide() {
    this.mesh.visible = false;
    this.isVisible = false;
    this.isTilting = false;
    this.isDisssolving = false;
  }

  dispose() {
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    this.scene.remove(this.mesh);
  }
}

export { Faceless };

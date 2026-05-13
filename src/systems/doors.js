/**
 * Door & Key System
 * Manages locked doors, key collection, fake doors, and door animations.
 */

import * as THREE from 'three';
import { gameState, STATES } from './gameState.js';
import { audioSystem } from './audio.js';

class DoorSystem {
  constructor(levelMeta) {
    this.levelMeta = levelMeta;
    this.collectedKeys = new Set();
    this.openedDoors = new Set();
    this.triggeredFakeDoors = new Set();

    // Mesh references populated by registerMeshes
    this.doorMeshes = {};
    this.keyMeshes = {};
    this.fakeDoorMeshes = {};

    // Interaction state
    this.nearbyDoor = null;
    this.nearbyKey = null;
    this.nearbyFakeDoor = null;

    // Door animation state
    this.animatingDoors = [];

    // Callbacks (wired in main.js)
    this.onKeyCollected = null;
    this.onDoorOpened = null;
    this.onFakeDoorOpened = null;
    this.onPromptChange = null;
  }

  registerMeshes(gltfScene) {
    gltfScene.traverse((child) => {
      if (!child.name) return;

      if (this.levelMeta.doors.includes(child.name)) {
        this.doorMeshes[child.name] = child;
        child.userData.originalRotY = child.rotation.y;
      }

      if (this.levelMeta.fakeDoors.includes(child.name)) {
        this.fakeDoorMeshes[child.name] = child;
        child.userData.originalRotY = child.rotation.y;
      }

      if (this.levelMeta.keys.includes(child.name)) {
        this.keyMeshes[child.name] = child;
      }
    });
  }

  _getMeshWorldPos(mesh) {
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);
    return pos;
  }

  update(deltaTime, playerPos) {
    if (!gameState.is(STATES.PLAYING)) return;

    const interactRange = 2.0;
    const keyPickupRange = 1.5;

    this.nearbyDoor = null;
    this.nearbyKey = null;
    this.nearbyFakeDoor = null;

    // Auto-pickup keys
    for (const [keyName, mesh] of Object.entries(this.keyMeshes)) {
      if (this.collectedKeys.has(keyName)) continue;
      if (!mesh.visible) continue;

      const dist = playerPos.distanceTo(this._getMeshWorldPos(mesh));
      if (dist < keyPickupRange) {
        this._collectKey(keyName, mesh);
      }
    }

    // Check real door proximity
    for (const [doorName, mesh] of Object.entries(this.doorMeshes)) {
      if (this.openedDoors.has(doorName)) continue;

      const dist = playerPos.distanceTo(this._getMeshWorldPos(mesh));
      if (dist < interactRange) {
        this.nearbyDoor = doorName;
        break;
      }
    }

    // Check fake door proximity
    for (const [doorName, mesh] of Object.entries(this.fakeDoorMeshes)) {
      if (this.triggeredFakeDoors.has(doorName)) continue;

      const dist = playerPos.distanceTo(this._getMeshWorldPos(mesh));
      if (dist < interactRange) {
        this.nearbyFakeDoor = doorName;
        break;
      }
    }

    this._updateAnimations(deltaTime);
    this._updatePrompt();
  }

  _collectKey(keyName, mesh) {
    this.collectedKeys.add(keyName);
    mesh.visible = false;
    audioSystem.playKeyPickup();
    if (this.onKeyCollected) this.onKeyCollected(keyName);
  }

  interact() {
    if (this.nearbyFakeDoor) {
      this._openFakeDoor(this.nearbyFakeDoor);
      return true;
    }

    if (this.nearbyDoor) {
      return this._tryOpenDoor(this.nearbyDoor);
    }

    return false;
  }

  _tryOpenDoor(doorName) {
    const keyToDoor = this.levelMeta.keyToDoor;
    let requiredKey = null;

    for (const [key, door] of Object.entries(keyToDoor)) {
      if (door === doorName) {
        requiredKey = key;
        break;
      }
    }

    if (requiredKey && this.collectedKeys.has(requiredKey)) {
      this._openDoor(doorName);
      return true;
    } else {
      if (this.onPromptChange) {
        this.onPromptChange('LOCKED - need key');
      }
      return false;
    }
  }

  _openDoor(doorName) {
    const mesh = this.doorMeshes[doorName];
    if (!mesh) return;

    this.openedDoors.add(doorName);
    audioSystem.playDoorCreak();

    // Animate: rotate 90 degrees over 1.5 seconds, ease-out
    this.animatingDoors.push({
      mesh,
      startRot: mesh.rotation.y,
      endRot: mesh.rotation.y + Math.PI / 2,
      elapsed: 0,
      duration: 1.5,
    });

    if (this.onDoorOpened) this.onDoorOpened(doorName);
  }

  _openFakeDoor(doorName) {
    this.triggeredFakeDoors.add(doorName);
    audioSystem.playDoorCreak();
    if (this.onFakeDoorOpened) this.onFakeDoorOpened(doorName);
  }

  _updateAnimations(deltaTime) {
    for (let i = this.animatingDoors.length - 1; i >= 0; i--) {
      const anim = this.animatingDoors[i];
      anim.elapsed += deltaTime;
      const t = Math.min(anim.elapsed / anim.duration, 1);

      // Ease out quad
      const eased = 1 - (1 - t) * (1 - t);
      anim.mesh.rotation.y = anim.startRot + (anim.endRot - anim.startRot) * eased;

      if (t >= 1) {
        this.animatingDoors.splice(i, 1);
      }
    }
  }

  _updatePrompt() {
    let prompt = null;

    if (this.nearbyFakeDoor) {
      prompt = '[E] Open door';
    } else if (this.nearbyDoor) {
      const keyToDoor = this.levelMeta.keyToDoor;
      let hasKey = false;
      for (const [key, door] of Object.entries(keyToDoor)) {
        if (door === this.nearbyDoor && this.collectedKeys.has(key)) {
          hasKey = true;
          break;
        }
      }
      prompt = hasKey ? '[E] Open door' : 'LOCKED - need key';
    }

    if (this.onPromptChange) this.onPromptChange(prompt);
  }

  hasKey(keyName) {
    return this.collectedKeys.has(keyName);
  }
}

export { DoorSystem };

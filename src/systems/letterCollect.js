/**
 * Letter Collection System
 * Tracks collection of hidden NATHAN letters throughout the house.
 */

import * as THREE from 'three';
import { gameState, STATES } from './gameState.js';
import { audioSystem } from './audio.js';

class LetterCollectSystem {
  constructor(levelMeta) {
    this.levelMeta = levelMeta;
    this.collectedLetters = [];
    this.collectedTriggers = new Set();
    this.letterMeshes = {};
    this.targetName = levelMeta.targetName;

    // Callbacks
    this.onLetterCollected = null;
    this.onAllLettersCollected = null;
  }

  registerMeshes(gltfScene) {
    gltfScene.traverse((child) => {
      if (!child.name) return;
      if (this.levelMeta.letters.includes(child.name)) {
        this.letterMeshes[child.name] = child;
      }
    });
  }

  update(deltaTime, playerPos) {
    if (!gameState.is(STATES.PLAYING)) return;

    const pickupRange = 1.5;

    for (const [triggerName, mesh] of Object.entries(this.letterMeshes)) {
      if (this.collectedTriggers.has(triggerName)) continue;
      if (!mesh.visible) continue;

      const meshPos = new THREE.Vector3();
      mesh.getWorldPosition(meshPos);

      const dist = playerPos.distanceTo(meshPos);
      if (dist < pickupRange) {
        this._collectLetter(triggerName, mesh);
      }
    }
  }

  _collectLetter(triggerName, mesh) {
    const letterChar = this.levelMeta.letterValues[triggerName];
    if (!letterChar) return;

    this.collectedTriggers.add(triggerName);
    this.collectedLetters.push(letterChar);
    mesh.visible = false;

    audioSystem.playLetterFound();

    if (this.onLetterCollected) {
      this.onLetterCollected(letterChar, this.collectedLetters.length);
    }

    if (this.collectedLetters.length >= this.targetName.length) {
      if (this.onAllLettersCollected) {
        this.onAllLettersCollected(this.collectedLetters);
      }
    }
  }

  getDisplaySlots() {
    const slots = [];
    for (let i = 0; i < this.targetName.length; i++) {
      if (i < this.collectedLetters.length) {
        slots.push(this.collectedLetters[i]);
      } else {
        slots.push('_');
      }
    }
    return slots;
  }

  get allCollected() {
    return this.collectedLetters.length >= this.targetName.length;
  }
}

export { LetterCollectSystem };

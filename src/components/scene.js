/**
 * Scene Component
 * Pitch black background with dense oppressive fog for horror atmosphere.
 */

import { Scene, Color, FogExp2 } from 'three';

function createScene() {
  const scene = new Scene();
  scene.background = new Color(0x000000);
  scene.fog = new FogExp2(0x000000, 0.08);
  return scene;
}

export { createScene };

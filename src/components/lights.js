/**
 * Lights Component
 * Extremely dim ambient only - actual illumination comes from the flashlight.
 */

import { AmbientLight } from 'three';

function createLights() {
  const ambientLight = new AmbientLight(0x111111, 0.05);
  return { ambientLight };
}

export { createLights };

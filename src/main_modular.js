/**
 * THE VOICE - Main Entry Point
 * Wires together all game systems: flashlight, doors, letters, monster, QTE, UI.
 */

import * as THREE from 'three';

// Components
import { createScene } from './components/scene.js';
import { createCamera } from './components/camera.js';
import { createLights } from './components/lights.js';
import { createFlashlight } from './components/flashlight.js';
import { loadWorld } from './components/world.js';

// Systems
import { createRenderer } from './systems/renderer.js';
import { createStats } from './systems/stats.js';
import { Resizer } from './systems/resizer.js';
import { createPhysics, STEPS_PER_FRAME } from './systems/physics.js';
import { setupControls } from './systems/controls.js';
import { gameState, STATES } from './systems/gameState.js';
import { audioSystem } from './systems/audio.js';
import { DoorSystem } from './systems/doors.js';
import { LetterCollectSystem } from './systems/letterCollect.js';
import { QTESystem } from './systems/qte.js';

// Entities
import { Faceless } from './entities/faceless.js';

// UI
import { HUD } from './ui/hud.js';
import { GameScreens } from './ui/screens.js';
import { LetterPuzzle } from './ui/letterPuzzle.js';

// Level data
import levelMeta from './levels/level_01_meta.json';

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();
const scene = createScene();
const { camera } = createCamera();
scene.add(camera);
const { ambientLight } = createLights();
scene.add(ambientLight);

// Flashlight - the ONLY player light source
const flashlight = createFlashlight(camera);

// Renderer
const container = document.getElementById('container');
const renderer = createRenderer();
container.appendChild(renderer.domElement);
const stats = createStats();
container.appendChild(stats.domElement);

renderer.shadowMap.enabled = true;

// Physics
const {
  playerCollider,
  playerVelocity,
  playerDirection,
  updatePlayer,
  teleportPlayer,
  worldOctree,
  floorState,
} = createPhysics(scene);

// Reusable vector for player position queries
const playerWorldPos = new THREE.Vector3();

// Game systems (initialized after world loads)
let doorSystem = null;
let letterSystem = null;
let qteSystem = null;
let faceless = null;

// UI
const hud = new HUD();
const screens = new GameScreens();
const letterPuzzle = new LetterPuzzle();

// Track final room trigger
let finalRoomMesh = null;
let finalRoomTriggered = false;

// Monster encounter state
let monsterEncounterActive = false;
let monsterTiltDone = false;

// Room 5 scripted monster tracking
let room5MonsterTriggered = false;
let room5KeyCollected = false;

// Win sequence
let winSequenceActive = false;
let winSequenceElapsed = 0;
const winGlitchOverlay = document.createElement('div');
Object.assign(winGlitchOverlay.style, {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0)',
  zIndex: '1800',
  display: 'none',
  pointerEvents: 'none',
});
document.body.appendChild(winGlitchOverlay);

// ---------------------------------------------------------------------------
// Controls setup (E key interaction)
// ---------------------------------------------------------------------------

function handleInteraction() {
  if (!gameState.is(STATES.PLAYING)) return;

  // Try door interaction
  if (doorSystem) {
    doorSystem.interact();
  }

  // Check final room trigger
  if (finalRoomMesh && !finalRoomTriggered && letterSystem && letterSystem.allCollected) {
    const meshPos = new THREE.Vector3();
    finalRoomMesh.getWorldPosition(meshPos);
    playerWorldPos.copy(playerCollider.end);
    if (playerWorldPos.distanceTo(meshPos) < 2.0) {
      finalRoomTriggered = true;
      letterPuzzle.show(letterSystem.collectedLetters);
    }
  }
}

const applyControls = setupControls(
  camera,
  playerVelocity,
  playerDirection,
  handleInteraction
);

// ---------------------------------------------------------------------------
// Load world and wire up systems
// ---------------------------------------------------------------------------

gameState.setState(STATES.LOADING);
screens.showStart();

loadWorld(scene, worldOctree, levelMeta).then((gltfScene) => {
  // -- Door System --
  doorSystem = new DoorSystem(levelMeta);
  doorSystem.registerMeshes(gltfScene);

  doorSystem.onKeyCollected = (keyName) => {
    hud.showNotification('KEY FOUND', 2000);

    if (keyName === 'trigger_key_room5') {
      room5KeyCollected = true;
    }
  };

  doorSystem.onDoorOpened = (doorName) => {
    hud.showNotification('Door opened', 1500);
  };

  doorSystem.onFakeDoorOpened = (doorName) => {
    triggerMonsterEncounter();
  };

  doorSystem.onPromptChange = (text) => {
    hud.setPrompt(text);
  };

  // -- Letter Collection System --
  letterSystem = new LetterCollectSystem(levelMeta);
  letterSystem.registerMeshes(gltfScene);

  letterSystem.onLetterCollected = (letter, count) => {
    hud.showNotification(`You found something written on the wall... "${letter}"`, 3000);
    hud.updateLetters(letterSystem.getDisplaySlots());
  };

  // -- QTE System --
  qteSystem = new QTESystem();

  qteSystem.onSuccess = () => {
    if (faceless) faceless.dissolve();
    monsterEncounterActive = false;
    monsterTiltDone = false;
    gameState.setState(STATES.PLAYING);
  };

  qteSystem.onFail = () => {
    monsterEncounterActive = false;
    monsterTiltDone = false;
    gameState.setState(STATES.LOSE);
  };

  // -- Faceless Monster --
  faceless = new Faceless(scene);

  // -- Final room trigger mesh --
  gltfScene.traverse((child) => {
    if (child.name === levelMeta.finalTrigger) {
      finalRoomMesh = child;
    }
  });

  // -- Find player spawn and teleport --
  let spawnFound = false;
  gltfScene.traverse((child) => {
    if (child.name === levelMeta.playerSpawn && !spawnFound) {
      const spawnPos = new THREE.Vector3();
      child.getWorldPosition(spawnPos);
      teleportPlayer(spawnPos);
      spawnFound = true;
    }
  });

  // -- Letter Puzzle completion --
  letterPuzzle.onCorrect = () => {
    startWinSequence();
  };

  // Initialize HUD letters display
  hud.updateLetters(letterSystem.getDisplaySlots());

  // Done loading
  gameState.setState(STATES.MENU);
});

// ---------------------------------------------------------------------------
// Game state transitions
// ---------------------------------------------------------------------------

screens.onStartClick = () => {
  if (!gameState.is(STATES.MENU)) return;

  screens.hideStart();
  hud.show();
  gameState.setState(STATES.PLAYING);

  audioSystem.playAmbient();

  document.body.requestPointerLock();
};

gameState.on('enter:LOSE', () => {
  hud.hide();
  if (faceless) faceless.hide();
  screens.showLose();
});

gameState.on('enter:WIN', () => {
  hud.hide();
});

// ---------------------------------------------------------------------------
// Monster encounter
// ---------------------------------------------------------------------------

function triggerMonsterEncounter() {
  if (!faceless || !gameState.is(STATES.PLAYING)) return;

  monsterEncounterActive = true;
  monsterTiltDone = false;
  faceless.spawn(camera);
  gameState.setState(STATES.MONSTER_ENCOUNTER);
}

// ---------------------------------------------------------------------------
// Win sequence
// ---------------------------------------------------------------------------

function startWinSequence() {
  winSequenceActive = true;
  winSequenceElapsed = 0;
  gameState.setState(STATES.WIN);
  hud.hide();

  // Phase 1: Glitch distortion overlay
  winGlitchOverlay.style.display = 'block';
  winGlitchOverlay.style.animation = 'glitch 0.15s infinite';
  winGlitchOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';

  // Create blurry letter text
  const letterText = document.createElement('div');
  Object.assign(letterText.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'rgba(210, 190, 160, 0.4)',
    fontSize: '14px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: '2',
    filter: 'blur(2px)',
    maxWidth: '400px',
    zIndex: '1850',
    userSelect: 'none',
  });
  letterText.textContent =
    'The weight of it was always there, in the spaces between your thoughts. ' +
    'You carried it like breath, invisible and constant. ' +
    'This was never about finding your way out. ' +
    'It was about remembering why you came in.';
  document.body.appendChild(letterText);

  // Phase 2: After 3 seconds, cut to black with final message
  setTimeout(() => {
    winGlitchOverlay.style.animation = '';
    winGlitchOverlay.style.backgroundColor = '#000000';
    winGlitchOverlay.style.transition = 'background-color 0.1s';

    if (letterText.parentNode) letterText.parentNode.removeChild(letterText);

    screens.showWin();
  }, 3000);
}

// ---------------------------------------------------------------------------
// Animation Loop
// ---------------------------------------------------------------------------

function animate() {
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

  // Only run physics and controls during PLAYING state
  if (gameState.is(STATES.PLAYING)) {
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      applyControls(deltaTime, floorState.onFloor, camera);
      updatePlayer(deltaTime, worldOctree, camera);
    }

    // Get player position for proximity checks
    if (playerCollider.end) {
      playerWorldPos.copy(playerCollider.end);
    }

    // Update door system
    if (doorSystem) {
      doorSystem.update(deltaTime * STEPS_PER_FRAME, playerWorldPos);
    }

    // Update letter collection
    if (letterSystem) {
      letterSystem.update(deltaTime * STEPS_PER_FRAME, playerWorldPos);
    }

    // Check final room proximity (show prompt if all letters collected)
    if (finalRoomMesh && !finalRoomTriggered && letterSystem && letterSystem.allCollected) {
      const meshPos = new THREE.Vector3();
      finalRoomMesh.getWorldPosition(meshPos);
      if (playerWorldPos.distanceTo(meshPos) < 2.0) {
        hud.setPrompt('[E] Read the letter');
      }
    }

    // Room 5 scripted monster: triggers after grabbing key and opening door_05
    if (room5KeyCollected && !room5MonsterTriggered && doorSystem) {
      if (doorSystem.openedDoors.has('door_05')) {
        room5MonsterTriggered = true;
        setTimeout(() => {
          if (gameState.is(STATES.PLAYING)) {
            triggerMonsterEncounter();
          }
        }, 2000);
      }
    }
  }

  // Monster encounter state
  if (gameState.is(STATES.MONSTER_ENCOUNTER)) {
    if (faceless) {
      const result = faceless.update(deltaTime * STEPS_PER_FRAME);
      if (result === 'tilt_complete' && !monsterTiltDone) {
        monsterTiltDone = true;
        if (qteSystem) qteSystem.start();
      }
    }

    // Update QTE
    if (qteSystem) {
      qteSystem.update(deltaTime * STEPS_PER_FRAME);
    }
  }

  // Update faceless dissolve animation even outside monster encounter
  if (faceless && faceless.isDisssolving) {
    faceless.update(deltaTime * STEPS_PER_FRAME);
  }

  renderer.render(scene, camera);
  stats.update();
}

// Set animation loop
renderer.setAnimationLoop(animate);

// Resizer
Resizer(camera, renderer);

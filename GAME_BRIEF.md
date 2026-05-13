# Game Brief: THE VOICE — FPS Horror Game

## Concept
First-person horror set in an abandoned haunted house. The player wakes up inside with no memory of how they got there. A note on the floor reads:
*"Find the letter. It will tell you why you're here."*
Tone: slow dread, psychological horror, oppressive atmosphere. Inspired by Resident Evil + SOMA.

## Core Gameplay Loop
1. Player wakes up in a dark room — only a flashlight (first-person flashlight model)
2. Navigate interconnected locked rooms in a Resident Evil-style key maze
3. In each room: find the key to the next door, survive monster encounters, collect hidden letters
4. Reach the final room — a letter addressed to a blank name
5. Use the letters collected throughout to fill in the name and complete the game

## The Secret: Solving the Letter
The final room has a letter addressed to **"___ ___ ___ ___ ___ ___"** (6 blank spaces).
The name is **NATHAN**.
The 6 letters — N, A, T, H, A, N — are hidden individually throughout the rooms.
At the end, the collected letters appear scrambled. The player arranges them to spell the name.
Filling in the name triggers the win sequence.

---

## Technical Stack
- Renderer: Three.js r0.173 with Vite
- Physics: Octree + capsule collider (`src/systems/physics.js`)
- Controls: WASD + mouse look with Pointer Lock (`src/systems/controls.js`)
- Lighting: Flashlight model (`assets/flashlight.glb`) attached to camera — NO other player light source
- Audio: Web Audio API for SFX + ambient tracks
- NO shooting / NO weapon model

---

## Map: The Haunted House

### Source Asset
The base map is `assets/haunted_house.glb`. The map designer should:
1. Import it into Blender via MCP
2. Inspect the existing geometry and identify usable rooms
3. Add all required named trigger objects/empties (listed below) positioned correctly in the scene
4. Optionally expand rooms, add props, or improve atmosphere using Poly Haven assets
5. Export the final scene to `public/models/collision-world.glb`

The `scene.gltf` in `assets/` is a companion file — import either, whichever loads correctly in Blender.

### Room Design Philosophy
- All rooms are pitch black — no baked lighting
- The ONLY meaningful light is the player's flashlight
- Rooms should feel like real haunted house spaces: foyer, parlour, kitchen, cellar, study, attic
- Every room must have: at least one hidden NATHAN letter, one key or door mechanism, environmental storytelling

### Rooms (map the existing geometry to these, expand if needed)

**Room 1 — Foyer** (spawn room)
- Entry hall of the house — where the player wakes up
- One door out (locked — key visible nearby, tutorial room)
- Hidden letter: **N** — scratched into the baseboard near the front door
- No monster. Safe start.
- Trigger: `spawn_player`

**Room 2 — Parlour**
- Main sitting room — dusty furniture, fireplace, broken mirror
- Key to Room 3 hidden under a chair or on the mantle
- One FAKE DOOR — `door_fake_01` — a closet door that triggers monster
- Hidden letter: **A** — written in dust on the mirror

**Room 3 — Kitchen**
- Kitchen / pantry area — rotting food, overturned table
- Key to Room 4 hidden in a cabinet or drawer
- Two FAKE DOORS — `door_fake_02`, `door_fake_03`
- Hidden letter: **T** — scratched on the underside of the table

**Room 4 — Cellar**
- Dark basement — exposed pipes, stone walls, dripping water
- Key to Room 5 on a hook on the far wall
- One FAKE DOOR — `door_fake_04` — a coal chute or storage door
- Hidden letter: **H** — chalked onto the stone wall, faint

**Room 5 — Study**
- Dark wood-panelled study — bookshelves, desk, wall safe (open and empty)
- Key to Final Room inside a desk drawer (trigger zone)
- NO fake doors — but monster appears after player grabs key
- Hidden letter: **A** — handwritten on a page of an open book on the desk

**Room 6 — Attic** (final room)
- Bare attic — single table, dust everywhere, slanted ceiling
- On the table: **THE LETTER** — addressed to `"Dear ___ ___ ___ ___ ___ ___ ,"`
- Hidden letter: **N** — scratched above the door frame
- No keys. No monsters. Resolution space.
- Trigger: `trigger_final_room` at the letter on the table

### Connecting Doors
```
Room 1 → [door_01] → Room 2 → [door_02] → Room 3 → [door_03] →
Room 4 → [door_04] → Room 5 → [door_05] → Room 6
```

### All Named Trigger Meshes / Empties
```
spawn_player          — player start position (Room 1)
door_01 – door_05     — lockable doors between rooms
door_fake_01 – 04     — fake doors (monster jumpscare)
trigger_key_room1     — key pickup (Room 1)
trigger_key_room2     — key pickup (Room 2)
trigger_key_room3     — key pickup (Room 3)
trigger_key_room4     — key pickup (Room 4)
trigger_key_room5     — key pickup (Room 5)
trigger_letter_N1     — hidden letter N (Room 1)
trigger_letter_A1     — hidden letter A (Room 2)
trigger_letter_T      — hidden letter T (Room 3)
trigger_letter_H      — hidden letter H (Room 4)
trigger_letter_A2     — hidden letter A (Room 5)
trigger_letter_N2     — hidden letter N (Room 6)
trigger_final_room    — the letter on the table (Room 6)
```

### Atmosphere Requirements
- Heavy exponential fog in every room — black, oppressive
- Emergency flicker lights (barely 5% intensity, red/amber) as the only ambient fill
- Use Poly Haven textures where available: aged wood, cracked plaster, stone, rotting fabric
- Export scale: 1 Blender unit = 1 meter
- Collision-ready geometry, all watertight

---

## Game Logic (game coder)

### Project Setup
This is a new project. Set up from scratch:
- `npm init` with Vite + Three.js (mirror the ThreeJS_FPS_2.0 package.json structure)
- Create `index.html`, `src/main_modular.js`, and all subdirectories
- Reference `ThreeJS_FPS_2.0` as the architectural template — use the same folder structure and patterns

### Flashlight Model
Use `assets/flashlight.glb` as the first-person view model attached to the camera (replaces the weapon rig from LIMINAL). Load it with GLTFLoader and attach to camera at the correct offset so it looks natural in first-person view.

### Systems to Build

#### 1. Flashlight (`src/components/flashlight.js`)
- Load `assets/flashlight.glb` and attach to camera
- `THREE.SpotLight` parented to the model: angle 0.3, penumbra 0.4, distance 18, intensity 8, color `#fff5e0`
- Always on — no toggle

#### 2. Game State Manager (`src/systems/gameState.js`)
```
States: LOADING → MENU → PLAYING → MONSTER_ENCOUNTER → LETTER_PUZZLE → WIN → LOSE
```

#### 3. Door & Key System (`src/systems/doors.js`)
- Proximity-based (2m) key collection and door interaction
- Fake doors always openable → trigger Monster Encounter
- Real doors require matching key → animate open (rotate 90° Y over 1.5s, ease-out)

#### 4. Letter Collection System (`src/systems/letterCollect.js`)
- Proximity-based (1.5m) letter pickup
- HUD displays collected letters bottom-left
- Subtle notification on collect

#### 5. Monster: The Faceless (`src/entities/faceless.js`)
- Procedural humanoid mesh (CapsuleGeometry body, SphereGeometry head) — pale blue translucent
- Appears 3m in front of player on trigger
- Slowly tilts head 45° over 1 second
- Triggers QTE system

#### 6. QTE System (`src/systems/qte.js`)
- 4 random keys, 1.5s window each
- All correct → monster dissolves, return to PLAYING
- Any miss or timeout → LOSE

#### 7. Letter Puzzle UI (`src/ui/letterPuzzle.js`)
- Full screen overlay — dark aged paper aesthetic
- 6 blank slots + scrambled collected letters
- Click to place, submit to check
- Correct → WIN sequence. Wrong → shake animation, try again.

#### 8. WIN Sequence
- Letter text fades in blurry
- CSS pixel/glitch distortion animation
- After 3s: hard cut to black — *"You know now. You always knew."*

#### 9. HUD (`src/ui/hud.js`)
- Crosshair: small white dot
- Letter tracker bottom-left: `N · A · _ · _ · _ · _`
- Interaction prompt bottom-center: `[E] Open door`
- Notification top-center: fade in/out

#### 10. Start + End Screens (`src/ui/screens.js`)
- Start: **THE VOICE** title + subtitle + click to begin
- Win / Lose screens

#### 11. Audio (`src/systems/audio.js`)
- Web Audio API for procedural SFX (door creak, key chime, monster tone, QTE tick/fail)
- Ambient: low house hum
- Heartbeat during MONSTER_ENCOUNTER

### Movement & Physics
Use the battle-tested Quake-style movement defaults from the threejs-game-dev agent:
- Gravity: 22, jump: 6.9, walk speed: 6.8, ground accel: 45
- Octree + Capsule collider from Three.js addons
- `three-mesh-bvh` for BVH acceleration

---

## Level Metadata Contract (`src/levels/level_01_meta.json`)
Map designer creates this after building. Game coder consumes it:
```json
{
  "name": "The Haunted House",
  "gltf": "/models/collision-world.glb",
  "rooms": ["foyer","parlour","kitchen","cellar","study","attic"],
  "doors": ["door_01","door_02","door_03","door_04","door_05"],
  "fakeDoors": ["door_fake_01","door_fake_02","door_fake_03","door_fake_04"],
  "keys": ["trigger_key_room1","trigger_key_room2","trigger_key_room3","trigger_key_room4","trigger_key_room5"],
  "letters": ["trigger_letter_N1","trigger_letter_A1","trigger_letter_T","trigger_letter_H","trigger_letter_A2","trigger_letter_N2"],
  "finalTrigger": "trigger_final_room",
  "playerSpawn": "spawn_player",
  "targetName": "NATHAN"
}
```

## File Ownership
| File | Owner |
|------|-------|
| `public/models/collision-world.glb` | Map Designer |
| `src/levels/level_01_meta.json` | Map Designer |
| `package.json`, `index.html`, `vite.config.js` | Game Coder |
| `src/main_modular.js` | Game Coder |
| `src/components/scene.js` | Game Coder |
| `src/components/camera.js` | Game Coder |
| `src/components/flashlight.js` | Game Coder |
| `src/components/renderer.js` | Game Coder |
| `src/systems/gameState.js` | Game Coder |
| `src/systems/physics.js` | Game Coder |
| `src/systems/controls.js` | Game Coder |
| `src/systems/doors.js` | Game Coder |
| `src/systems/letterCollect.js` | Game Coder |
| `src/systems/qte.js` | Game Coder |
| `src/systems/audio.js` | Game Coder |
| `src/entities/faceless.js` | Game Coder |
| `src/ui/hud.js` | Game Coder |
| `src/ui/screens.js` | Game Coder |
| `src/ui/letterPuzzle.js` | Game Coder |

---

## Done When
- Player wakes in dark foyer, flashlight model visible in first person
- 6 haunted house rooms connected by lockable doors
- Fake doors trigger Faceless monster encounters with QTE
- All 6 NATHAN letters collectible throughout
- Final room: letter puzzle UI — player fills in NATHAN
- Correct → pixel/glitch win sequence
- Wrong → try again
- 60fps in Chrome with `npm run dev`

#!/bin/bash

# THE VOICE — Game Dev Team Launcher
# Fires both agents in parallel. Walk away and check results later.
# Usage: ./run.sh
# NOTE: Blender must be open with the MCP addon active before running.

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   THE VOICE — Agent Team Launching   ║"
echo "╠══════════════════════════════════════╣"
echo "║  Map Designer  → logs/map_designer   ║"
echo "║  Game Coder    → logs/game_coder     ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── AGENT 1: FPS Horror Map Designer ──────────────────────────────────────────
claude --dangerously-skip-permissions \
  --print "Use the fps-horror-map-designer agent. Read GAME_BRIEF.md in $PROJECT_DIR. Your job: import the existing haunted house map from $PROJECT_DIR/assets/haunted_house.glb into Blender via MCP. Inspect the geometry and identify the rooms. Add all required named trigger empties/meshes listed in the brief (spawn_player, door_01-05, door_fake_01-04, trigger_key_room1-5, trigger_letter_*, trigger_final_room) positioned appropriately within the existing geometry. Optionally enhance the atmosphere with Poly Haven textures and props. Export the final scene to $PROJECT_DIR/public/models/collision-world.glb. Also create $PROJECT_DIR/src/levels/level_01_meta.json with the correct mesh names and positions. Work autonomously until all map designer deliverables in the brief are complete. Do not ask questions." \
  > "$LOG_DIR/map_designer.log" 2>&1 &

MAP_PID=$!
echo "▶ Map Designer started (PID $MAP_PID)"

# ── AGENT 2: Three.js Game Developer ──────────────────────────────────────────
claude --dangerously-skip-permissions \
  --print "Use the threejs-game-dev agent. Read GAME_BRIEF.md in $PROJECT_DIR. Your job: build the complete game from scratch in $PROJECT_DIR. Set up Vite + Three.js (mirror the structure of /home/austin/ThreeJS_FPS_2.0 as your template). Implement all systems listed under 'Game Logic' in the brief. Use the flashlight model at $PROJECT_DIR/assets/flashlight.glb for the first-person view. Apply the battle-tested movement constants and patterns from your training (Quake-style movement, Octree collision, DOM-based UI). Wire everything together in src/main_modular.js. The map file will be at public/models/collision-world.glb and the metadata at src/levels/level_01_meta.json — write your loader to consume those paths. Work autonomously until all game coder deliverables in the brief are complete. Do not ask questions." \
  > "$LOG_DIR/game_coder.log" 2>&1 &

CODER_PID=$!
echo "▶ Game Coder started (PID $CODER_PID)"

echo ""
echo "Both agents running. Watch logs:"
echo "  tail -f $LOG_DIR/map_designer.log"
echo "  tail -f $LOG_DIR/game_coder.log"
echo ""
echo "Waiting for both to finish..."

wait $MAP_PID
MAP_EXIT=$?

wait $CODER_PID
CODER_EXIT=$?

echo ""
echo "══════════════════════════════════════"
echo "Map Designer  exit code: $MAP_EXIT"
echo "Game Coder    exit code: $CODER_EXIT"
echo ""

if [ $MAP_EXIT -eq 0 ] && [ $CODER_EXIT -eq 0 ]; then
  echo "✓ Both agents finished. Run: cd $PROJECT_DIR && npm run dev"
else
  echo "✗ One or both agents had errors. Check logs/ for details."
fi

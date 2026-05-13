/**
 * World Component
 * Loads collision-world.glb, builds the Octree, enables shadows on all meshes.
 * Falls back to a procedural placeholder room if the GLB is missing.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Build a placeholder collision world: a large flat room with walls.
 * This lets the game run immediately before the map designer delivers the real GLB.
 */
function buildPlaceholderWorld(scene, worldOctree, levelMeta) {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a0a,
    roughness: 0.95,
    metalness: 0.0,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a120a,
    roughness: 0.97,
    metalness: 0.0,
  });

  // --- Room layout ---
  // 6 rooms in a row, each 8m x 8m, connected by 2m wide doorways
  // Total length: 6 * 8 = 48m along Z axis
  const roomWidth = 8;
  const roomDepth = 8;
  const roomHeight = 3.5;
  const wallThickness = 0.3;
  const doorWidth = 1.6;
  const doorHeight = 2.4;
  const numRooms = 6;

  // Floor (one big slab)
  const totalLength = numRooms * roomDepth;
  const floorGeom = new THREE.BoxGeometry(roomWidth, wallThickness, totalLength);
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.position.set(0, -wallThickness / 2, totalLength / 2);
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(floorGeom, wallMat);
  ceiling.position.set(0, roomHeight, totalLength / 2);
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // Left wall (continuous)
  const leftWallGeom = new THREE.BoxGeometry(wallThickness, roomHeight, totalLength);
  const leftWall = new THREE.Mesh(leftWallGeom, wallMat);
  leftWall.position.set(-roomWidth / 2, roomHeight / 2, totalLength / 2);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Right wall (continuous)
  const rightWall = new THREE.Mesh(leftWallGeom, wallMat);
  rightWall.position.set(roomWidth / 2, roomHeight / 2, totalLength / 2);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Back wall (behind room 1)
  const backWallGeom = new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness);
  const backWall = new THREE.Mesh(backWallGeom, wallMat);
  backWall.position.set(0, roomHeight / 2, 0);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Front wall (after room 6)
  const frontWall = new THREE.Mesh(backWallGeom, wallMat);
  frontWall.position.set(0, roomHeight / 2, totalLength);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  group.add(frontWall);

  // Dividing walls between rooms (with doorways)
  for (let i = 1; i < numRooms; i++) {
    const z = i * roomDepth;

    // Left section of dividing wall (left of doorway)
    const leftSectionWidth = (roomWidth - doorWidth) / 2;
    const leftSectionGeom = new THREE.BoxGeometry(leftSectionWidth, roomHeight, wallThickness);
    const leftSection = new THREE.Mesh(leftSectionGeom, wallMat);
    leftSection.position.set(
      -roomWidth / 2 + leftSectionWidth / 2,
      roomHeight / 2,
      z
    );
    leftSection.castShadow = true;
    leftSection.receiveShadow = true;
    group.add(leftSection);

    // Right section of dividing wall
    const rightSection = new THREE.Mesh(leftSectionGeom, wallMat);
    rightSection.position.set(
      roomWidth / 2 - leftSectionWidth / 2,
      roomHeight / 2,
      z
    );
    rightSection.castShadow = true;
    rightSection.receiveShadow = true;
    group.add(rightSection);

    // Header above doorway
    const headerHeight = roomHeight - doorHeight;
    if (headerHeight > 0) {
      const headerGeom = new THREE.BoxGeometry(doorWidth, headerHeight, wallThickness);
      const header = new THREE.Mesh(headerGeom, wallMat);
      header.position.set(0, doorHeight + headerHeight / 2, z);
      header.castShadow = true;
      header.receiveShadow = true;
      group.add(header);
    }

    // Door panel (the actual door mesh, named for the door system)
    const doorGeom = new THREE.BoxGeometry(doorWidth, doorHeight, 0.08);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const doorMesh = new THREE.Mesh(doorGeom, doorMat);
    // Origin at hinge edge (left side of door)
    doorMesh.geometry.translate(doorWidth / 2, 0, 0);
    doorMesh.position.set(-doorWidth / 2, doorHeight / 2, z);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorMesh.name = levelMeta.doors[i - 1]; // door_01 through door_05
    group.add(doorMesh);
  }

  // Fake doors on side walls
  const fakeDoorPositions = [
    { x: roomWidth / 2 - 0.04, y: doorHeight / 2, z: roomDepth * 1 + roomDepth / 2, rotY: -Math.PI / 2 },
    { x: roomWidth / 2 - 0.04, y: doorHeight / 2, z: roomDepth * 2 + roomDepth * 0.3, rotY: -Math.PI / 2 },
    { x: -roomWidth / 2 + 0.04, y: doorHeight / 2, z: roomDepth * 2 + roomDepth * 0.7, rotY: Math.PI / 2 },
    { x: roomWidth / 2 - 0.04, y: doorHeight / 2, z: roomDepth * 3 + roomDepth / 2, rotY: -Math.PI / 2 },
  ];

  fakeDoorPositions.forEach((pos, idx) => {
    const fdGeom = new THREE.BoxGeometry(doorWidth, doorHeight, 0.08);
    const fdMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const fdMesh = new THREE.Mesh(fdGeom, fdMat);
    fdMesh.position.set(pos.x, pos.y, pos.z);
    fdMesh.rotation.y = pos.rotY;
    fdMesh.castShadow = true;
    fdMesh.receiveShadow = true;
    fdMesh.name = levelMeta.fakeDoors[idx];
    group.add(fdMesh);
  });

  // Player spawn empty
  const spawnEmpty = new THREE.Object3D();
  spawnEmpty.name = 'spawn_player';
  spawnEmpty.position.set(0, 0, 2);
  group.add(spawnEmpty);

  // Key trigger empties (small glowing cubes for visibility)
  const keyPositions = [
    { x: 2, y: 0.5, z: roomDepth * 0 + 5 },   // Room 1 key
    { x: -2, y: 0.5, z: roomDepth * 1 + 4 },   // Room 2 key
    { x: 2, y: 0.5, z: roomDepth * 2 + 5 },    // Room 3 key
    { x: -2, y: 0.5, z: roomDepth * 3 + 4 },   // Room 4 key
    { x: 2, y: 0.8, z: roomDepth * 4 + 3 },    // Room 5 key
  ];

  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0xffcc00,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.8,
  });

  keyPositions.forEach((pos, idx) => {
    const keyGeom = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const keyMesh = new THREE.Mesh(keyGeom, keyMat.clone());
    keyMesh.position.set(pos.x, pos.y, pos.z);
    keyMesh.name = levelMeta.keys[idx];
    keyMesh.castShadow = true;
    group.add(keyMesh);
  });

  // Letter trigger empties (small glowing marks)
  const letterPositions = [
    { x: -3, y: 0.3, z: roomDepth * 0 + 1 },   // N in Room 1
    { x: 3, y: 1.2, z: roomDepth * 1 + 3 },     // A in Room 2
    { x: -1, y: 0.3, z: roomDepth * 2 + 6 },    // T in Room 3
    { x: 2, y: 2.3, z: roomDepth * 3 + 5 },     // H in Room 4
    { x: -2, y: 0.9, z: roomDepth * 4 + 5 },    // A in Room 5
    { x: 1, y: 2.2, z: roomDepth * 5 + 2 },     // N in Room 6
  ];

  const letterChars = ['N', 'A', 'T', 'H', 'A', 'N'];
  const letterMat = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0xff2222,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8,
    roughness: 0.5,
  });

  letterPositions.forEach((pos, idx) => {
    const letterGeom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const letterMesh = new THREE.Mesh(letterGeom, letterMat.clone());
    letterMesh.position.set(pos.x, pos.y, pos.z);
    letterMesh.name = levelMeta.letters[idx];
    letterMesh.castShadow = true;
    group.add(letterMesh);
  });

  // Final room trigger
  const finalTrigger = new THREE.Object3D();
  finalTrigger.name = 'trigger_final_room';
  finalTrigger.position.set(0, 1.0, roomDepth * 5 + roomDepth / 2);
  group.add(finalTrigger);

  // Add some furniture-like boxes for atmosphere
  const furnitureMat = new THREE.MeshStandardMaterial({
    color: 0x2d1f0f,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Tables and crates in various rooms
  const furnitureData = [
    { x: -2, y: 0.4, z: 4, sx: 1.2, sy: 0.8, sz: 0.6 },
    { x: 2, y: 0.3, z: 12, sx: 0.6, sy: 0.6, sz: 0.6 },
    { x: -1, y: 0.5, z: 20, sx: 1.5, sy: 1.0, sz: 0.8 },
    { x: 1.5, y: 0.25, z: 28, sx: 0.5, sy: 0.5, sz: 0.5 },
    { x: -2, y: 0.6, z: 36, sx: 1.0, sy: 1.2, sz: 0.5 },
    { x: 0, y: 0.4, z: 44, sx: 1.5, sy: 0.8, sz: 1.0 },
  ];

  furnitureData.forEach((f) => {
    const geom = new THREE.BoxGeometry(f.sx, f.sy, f.sz);
    const mesh = new THREE.Mesh(geom, furnitureMat);
    mesh.position.set(f.x, f.y, f.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  scene.add(group);
  worldOctree.fromGraphNode(group);

  return group;
}

function loadWorld(scene, worldOctree, levelMeta) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader().setPath('./models/');
    loader.load(
      'collision-world.glb',
      (gltf) => {
        scene.add(gltf.scene);
        worldOctree.fromGraphNode(gltf.scene);

        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material.map) child.material.map.anisotropy = 4;
          }
        });

        resolve(gltf.scene);
      },
      undefined,
      (error) => {
        console.warn('GLB not found, building placeholder world:', error);
        const placeholder = buildPlaceholderWorld(scene, worldOctree, levelMeta);
        resolve(placeholder);
      }
    );
  });
}

export { loadWorld };

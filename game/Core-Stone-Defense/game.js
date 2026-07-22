// Core Stone 3D FPS Engine using Three.js WebGL
const container = document.getElementById('webgl-container');
const canvas = document.getElementById('gameCanvas');

// Konfigurasi Mode Game
const GAME_CONFIG = {
  TESTING_MODE: false, // Set false agar progress yang didapat dari mengalahkan musuh tersimpan di localStorage
  CLOUD_SAVE_READY: false // Siap untuk integrasi Akun Guest / Tautan Google Login saat publish
};

if (GAME_CONFIG.TESTING_MODE || !localStorage.getItem('outpost_init_v7_reset_economy')) {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('outpost_') || key.startsWith('corestone_')) {
      localStorage.removeItem(key);
    }
  });
  localStorage.setItem('outpost_init_v7_reset_economy', 'true');
}

// Game Persistent State & Story Lore (Material awal untuk pertama kali login: 500 Gold, 10 Kayu, 10 Batu, dll)
let gold = parseInt(localStorage.getItem('outpost_gold') || '500');
let gems = parseInt(localStorage.getItem('outpost_gems') || '10');
let currentPhase = parseInt(localStorage.getItem('corestone_phase') || '1');
let isLockedOut = localStorage.getItem('corestone_locked') === 'true';

let woodCount = parseInt(localStorage.getItem('outpost_wood') || '10');
let stoneCount = parseInt(localStorage.getItem('outpost_stone_res') || '10');
let ironCount = parseInt(localStorage.getItem('outpost_iron') || '10');
let soilCount = parseInt(localStorage.getItem('outpost_soil') || '10');
let rubberCount = parseInt(localStorage.getItem('outpost_rubber') || '10');

if (!localStorage.getItem('outpost_initial_resources_v7_saved')) {
  localStorage.setItem('outpost_initial_resources_v7_saved', 'true');
  localStorage.setItem('outpost_gold', gold);
  localStorage.setItem('outpost_gems', gems);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_iron', ironCount);
  localStorage.setItem('outpost_soil', soilCount);
  localStorage.setItem('outpost_rubber', rubberCount);
}


let techLabBuilt = localStorage.getItem('outpost_tech_lab') === 'true';
let techLabLvl = parseInt(localStorage.getItem('outpost_tech_lvl') || (techLabBuilt ? '1' : '0'));
let builderBarracksLvl = parseInt(localStorage.getItem('outpost_builder_barracks_lvl') || '0');
let weaponCrateLvl = parseInt(localStorage.getItem('outpost_weapon_crate_lvl') || '0');
let turretBuilt = localStorage.getItem('outpost_turret_built') === 'true';
let turretSavedLvl = parseInt(localStorage.getItem('outpost_turret_lvl') || (turretBuilt ? '1' : '0'));
let techLabMesh = null;
let builderBarracksMesh = null;
let weaponCrateMesh = null;
let weaponCrateHoloGun = null;
let builderMesh = null;
let isBuilderActive = localStorage.getItem('outpost_builder_active') === 'true';
let lumberjackBarracksLvl = parseInt(localStorage.getItem('outpost_lumberjack_lvl') || '0');
let minerBarracksLvl = parseInt(localStorage.getItem('outpost_miner_lvl') || '0');
let lumberjackBarracksMesh = null;
let lumberjackMesh = null;
let isLumberjackActive = localStorage.getItem('outpost_lumberjack_active') === 'true';
let minerBarracksMesh = null;
let minerMesh = null;
let lumberjackTimer = 0;
let minerTimer = 0;
let clearedGridCount = parseInt(localStorage.getItem('outpost_cleared_grids') || '0');
let choppedTrees = JSON.parse(localStorage.getItem('outpost_chopped_trees') || '[]');
let woodItems = [];
let activeWeaponSlot = 1; // 1 = Ranged, 2 = Melee
let equippedRanged = localStorage.getItem('outpost_eq_ranged') || 'pistol'; // pistol, sniper, shotgun, rudal
let equippedMelee = localStorage.getItem('outpost_eq_melee') || 'knife'; // knife, sword, axe, scythe
let techLabRadarRing = null;
let isJumping = false;
let jumpVy = 0;
let playerY = 3.2;

// Infinite Upgrade Levels
let knifeLvl = parseInt(localStorage.getItem('outpost_knife_lvl') || '1');
let pistolLvl = parseInt(localStorage.getItem('outpost_pistol_lvl') || '1');
let wallLvl = parseInt(localStorage.getItem('outpost_wall_lvl') || '1');
let stoneLvl = parseInt(localStorage.getItem('outpost_stone_lvl') || '1');
let survivorLvl = parseInt(localStorage.getItem('outpost_survivor_lvl') || '1');

// Separated Health Pools
let fenceMaxHp = Math.floor(100 * Math.pow(1.25, wallLvl - 1));
let fenceHp = fenceMaxHp;
let stoneMaxHp = 1000; // Core stone punya hp dasar 1000 dan tidak bisa di upgrade
let stoneHp = stoneMaxHp;
let playerMaxHp = 20; // Player punya hp 20
let playerHp = playerMaxHp;

const WEAPON_STATS = {
  pistol: { name: 'Pistol FPS', type: 'ranged', ammoMax: 12, dmg: 10, speed: '0.5s (2/dtk)', reload: 0.2, range: 13.6, desc: 'Pistol taktis standar. Kapasitas 12 peluru, reload kilat 0,2 detik.' },
  shotgun: { name: 'Shotgun Plasma', type: 'ranged', ammoMax: 2, dmg: 24, speed: '0.6s burst', reload: 0.6, range: 10.2, desc: 'Menembakkan 3 peluru menyebar sekaligus. Kapasitas 2 peluru, reload 0,6 detik.' },
  sniper: { name: 'Sniper Rifle', type: 'ranged', ammoMax: 1, dmg: 45, speed: '1.0s (1/dtk)', reload: 1.0, range: 25.5, desc: 'Senapan jarak jauh berpresisi tinggi. Kapasitas 1 peluru, reload 1 detik.' },
  ak47: { name: 'AK-47 Assault', type: 'ranged', ammoMax: 30, dmg: 14, speed: '0.2s (5/dtk)', reload: 1.2, range: 20.4, desc: 'Senapan serbu otomatis dengan kapasitas magazin 30 peluru.' },
  bow: { name: 'Compound Bow', type: 'ranged', ammoMax: 1, dmg: 35, speed: '0.8s', reload: 0.5, range: 17.0, desc: 'Busur karbon senyap penetrasi tinggi. Kapasitas 1 panah.' },
  rudal: { name: 'Rudal RPG-7', type: 'ranged', ammoMax: 1, dmg: 30, speed: '1.5s', reload: 1.5, range: 20.4, desc: 'Peluncur roket anti-tank. Menembakkan roket ledakan area 3x3 grid (9 tile). Kapasitas 1 roket.' },
  knife: { name: 'Pisau Komando', type: 'melee', ammoMax: Infinity, dmg: 15, speed: '0.25s (4/dtk)', reload: 0, range: 2.0, desc: 'Pisau komando taktis jarak dekat 1 tile tanpa amunisi.' },
  axe: { name: 'Kapak Titanium', type: 'melee', ammoMax: Infinity, dmg: 40, speed: '0.55s', reload: 0, range: 3.0, desc: 'Kapak perang titanium bertembakan berat.' },
  blade: { name: 'Katana Plasma', type: 'melee', ammoMax: Infinity, dmg: 30, speed: '0.4s', reload: 0, range: 4.0, desc: 'Pedang panjang tebas armor musuh jarak 2 tile tanpa amunisi.' },
  hammer: { name: 'Palu Besi Gada', type: 'melee', ammoMax: Infinity, dmg: 50, speed: '0.7s', reload: 0, range: 4.0, desc: 'Palu godam penghancur kerangka musuh jarak 2 tile secara brutal.' },
  scythe: { name: 'Sabit Plasma Malaikat', type: 'melee', ammoMax: Infinity, dmg: 65, speed: '0.6s', reload: 0, range: 4.0, desc: 'Sabit laser mematikan penebas massal jarak 2 tile. Tanpa amunisi.' }
};

const weaponsOrder = ['pistol', 'shotgun', 'sniper', 'ak47', 'rudal', 'bow', 'knife', 'axe', 'blade', 'hammer', 'scythe'];
let selectedPreviewWeaponIdx = 0;
let currentAmmo = 12;
let maxAmmo = 12;
let isReloading = false;
let reloadTimer = 0;

let gameRunning = false;
let isSimulating1900 = false;

// 3D Grid Parameters (18 Columns x 68 Rows)
// Cell Size = 2.0 meters.
const GRID_COLS = 18;
const GRID_ROWS = 68;
const FENCE_ROW = 16;
const CELL_SIZE = 2.0;
let grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));

function colToX(col) { return (col - 8.5) * CELL_SIZE; }
function rowToZ(row) { return -row * CELL_SIZE; }
function xToCol(x) { return Math.round(x / CELL_SIZE + 8.5); }
function zToRow(z) { return Math.round(-z / CELL_SIZE); }

let BUILDING_POSITIONS = JSON.parse(localStorage.getItem('outpost_building_positions') || '{}');

function formatDuration(totalSeconds) {
  totalSeconds = Math.round(totalSeconds);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

function findEmptyDefensePosition(buildingType, assignedSpots = []) {
  const occupied = [
    { x: colToX(8.5), z: rowToZ(2), r: 3.5 }, // Core Stone
    { x: colToX(8.5), z: rowToZ(FENCE_ROW), r: 3.0 } // Pagar
  ];
  if (BUILDING_POSITIONS['tech'] && techLabLvl > 0) occupied.push({ x: BUILDING_POSITIONS['tech'].x, z: BUILDING_POSITIONS['tech'].z, r: 3.5 });
  if (BUILDING_POSITIONS['builder_barrack'] && builderBarracksLvl > 0) occupied.push({ x: BUILDING_POSITIONS['builder_barrack'].x, z: BUILDING_POSITIONS['builder_barrack'].z, r: 3.5 });
  if (BUILDING_POSITIONS['lumberjack'] && lumberjackBarracksLvl > 0) occupied.push({ x: BUILDING_POSITIONS['lumberjack'].x, z: BUILDING_POSITIONS['lumberjack'].z, r: 3.5 });
  if (BUILDING_POSITIONS['miner'] && minerBarracksLvl > 0) occupied.push({ x: BUILDING_POSITIONS['miner'].x, z: BUILDING_POSITIONS['miner'].z, r: 3.5 });
  if (BUILDING_POSITIONS['turret'] && towers.length > 0) occupied.push({ x: BUILDING_POSITIONS['turret'].x, z: BUILDING_POSITIONS['turret'].z, r: 3.5 });
  if (BUILDING_POSITIONS['weapon_crate'] && weaponCrateLvl > 0) occupied.push({ x: BUILDING_POSITIONS['weapon_crate'].x, z: BUILDING_POSITIONS['weapon_crate'].z, r: 3.5 });
  towers.forEach(t => {
    if (t.mesh) occupied.push({ x: t.mesh.position.x, z: t.mesh.position.z, r: 3.5 });
  });
  assignedSpots.forEach(pos => {
    occupied.push({ x: pos.x, z: pos.z, r: 3.5 });
  });

  let refX = colToX(8.5);
  let refZ = rowToZ(8);
  if (towers.length > 0 && towers[0].mesh) {
    refX = towers[0].mesh.position.x;
    refZ = towers[0].mesh.position.z;
  } else if (BUILDING_POSITIONS['turret']) {
    refX = BUILDING_POSITIONS['turret'].x;
    refZ = BUILDING_POSITIONS['turret'].z;
  }

  const candidates = [];
  // Cari posisi di area pertahanan (baris 4 s/d 14, kolom 3 s/d 14)
  for (let r = 4; r <= 14; r += 2) {
    for (let c = 3; c <= 14; c += 2) {
      const candX = colToX(c);
      const candZ = rowToZ(r);
      let isSafe = true;
      for (let occ of occupied) {
        const dist = Math.hypot(candX - occ.x, candZ - occ.z);
        if (dist < occ.r) { isSafe = false; break; }
      }
      if (isSafe) {
        const distToRef = Math.hypot(candX - refX, candZ - refZ);
        candidates.push({ x: candX, z: candZ, col: c, row: r, dist: distToRef });
      }
    }
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0];
  }
  return { x: colToX(8), z: rowToZ(8), col: 8, row: 8 };
}

function isBuildingBuilt(bType) {
  if (bType === 'stone' || bType === 'wall') return true;
  if (bType === 'turret') return towers.length > 0 || turretBuilt || turretSavedLvl > 0;
  if (bType === 'tech') return techLabLvl > 0;
  if (bType === 'builder_barrack') return builderBarracksLvl > 0;
  if (bType === 'lumberjack') return lumberjackBarracksLvl > 0;
  if (bType === 'miner') return minerBarracksLvl > 0;
  if (bType === 'weapon_crate') return weaponCrateLvl > 0;
  return false;
}

function getBuildingPos(bType) {
  if (isBuildingBuilt(bType) && BUILDING_POSITIONS[bType]) return BUILDING_POSITIONS[bType];
  const pos = findEmptyDefensePosition(bType);
  if (isBuildingBuilt(bType)) {
    BUILDING_POSITIONS[bType] = { x: pos.x, z: pos.z };
    localStorage.setItem('outpost_building_positions', JSON.stringify(BUILDING_POSITIONS));
  } else if (BUILDING_POSITIONS[bType]) {
    delete BUILDING_POSITIONS[bType];
    localStorage.setItem('outpost_building_positions', JSON.stringify(BUILDING_POSITIONS));
  }
  return pos;
}

let isRelocatingBuilding = false;
let relocatingTargetMesh = null;
let relocatingTowerObj = null;

function startBuildingRelocation(bType, targetMesh, towerObj = null) {
  if (isRelocatingBuilding || placingBuildingType) return;
  isRelocatingBuilding = true;
  relocatingTargetMesh = targetMesh;
  relocatingTowerObj = towerObj;
  if (targetMesh) targetMesh.visible = false;
  startBuildingPlacement(bType);
  if (typeof createFloatingText === 'function' && targetMesh) {
    createFloatingText("🏗️ Memindahkan Bangunan! Klik Kanan (atau Kiri) untuk meletakkan.", targetMesh.position.x, 3.5, targetMesh.position.z, '#38bdf8');
  }
}

function finishBuildingRelocation(success) {
  if (!isRelocatingBuilding) return;
  const bType = placingBuildingType;
  if (success && placingHologramMesh && placingHologramMesh.isValidPlacement) {
    BUILDING_POSITIONS[bType] = { x: placingHologramMesh.position.x, z: placingHologramMesh.position.z };
    localStorage.setItem('outpost_building_positions', JSON.stringify(BUILDING_POSITIONS));

    if (bType === 'turret') {
      turretBuilt = true;
      localStorage.setItem('outpost_turret_built', 'true');
      if (towers.length > 0) {
        const targetTower = relocatingTowerObj || towers[0];
        if (targetTower.row !== undefined && targetTower.col !== undefined && grid[targetTower.row]) {
          grid[targetTower.row][targetTower.col] = 0;
        }
        const newCol = Math.round(xToCol(BUILDING_POSITIONS['turret'].x));
        const newRow = Math.round(zToRow(BUILDING_POSITIONS['turret'].z));
        targetTower.col = newCol; targetTower.row = newRow;
        if (grid[newRow]) grid[newRow][newCol] = targetTower;
        if (targetTower.mesh) targetTower.mesh.position.set(BUILDING_POSITIONS['turret'].x, 0, BUILDING_POSITIONS['turret'].z);
        localStorage.setItem('outpost_turret_lvl', targetTower.lvl);
      } else {
        const newCol = Math.round(xToCol(BUILDING_POSITIONS['turret'].x));
        const newRow = Math.round(zToRow(BUILDING_POSITIONS['turret'].z));
        const tObj = buildSciFiTurretTower();
        tObj.group.position.set(BUILDING_POSITIONS['turret'].x, 0, BUILDING_POSITIONS['turret'].z);
        scene.add(tObj.group);
        const lvl = turretSavedLvl > 0 ? turretSavedLvl : 1;
        const newTower = { col: newCol, row: newRow, lvl: lvl, hp: 50 * lvl, mesh: tObj.group, head: tObj.head };
        towers.push(newTower);
        if (grid[newRow]) grid[newRow][newCol] = newTower;
        turretSavedLvl = lvl;
        localStorage.setItem('outpost_turret_lvl', lvl);
      }
    } else if (relocatingTargetMesh) {
      relocatingTargetMesh.position.set(BUILDING_POSITIONS[bType].x, 0, BUILDING_POSITIONS[bType].z);
    }
    if (typeof createFloatingText === 'function') {
      createFloatingText("✅ Bangunan berhasil dipindahkan!", BUILDING_POSITIONS[bType].x, 3.5, BUILDING_POSITIONS[bType].z, '#22c55e');
    }
  }
  if (relocatingTargetMesh) relocatingTargetMesh.visible = true;
  isRelocatingBuilding = false;
  relocatingTargetMesh = null;
  relocatingTowerObj = null;
  cancelBuildingPlacement();
}

let placingBuildingType = null;
let placingHologramMesh = null;

// Continuous Floating-Point Player Position
let playerX = colToX(8.5);
let playerZ = rowToZ(5);
const CAMERA_HEIGHT = 3.2; // Raised higher so view is never blocked by fence!

// Smooth WASD Key State
const keysPressed = {};

// Three.js Core Variables
let scene, camera, renderer;
let fenceMeshes = [];
let fences = [];
let stoneMesh, coreLight;
let knifeGroup, pistolGroup, muzzleFlashMesh;
let towers = [];
let enemies = [];
let bullets = [];

let cameraYaw = 0;
let cameraPitch = -0.15; // Slightly tilted downward to overview the battlefield
let knifeStabAnim = 0;
let pistolRecoilAnim = 0;

let attackerSpawnTimer = 0;
let patrolSpawnTimer = 0;

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let bobTime = 0;
let builderSpeed = 1.0;
let gameTick = 0;
let floatingProgressEl = null;
let playerCharacterModel = null;
let playerBones = {};
let playerInitialRot = {};
let isFirstPerson = true;
let isAttackingMelee = false;

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.FogExp2(0x020617, 0.022);

  camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(playerX, CAMERA_HEIGHT, playerZ);
  camera.rotation.set(cameraPitch, cameraYaw, 0, 'YXZ');
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Lights
  const ambient = new THREE.AmbientLight(0x334155, 1.2);
  scene.add(ambient);

  const moonLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
  moonLight.position.set(20, 40, 10);
  moonLight.castShadow = true;
  scene.add(moonLight);

  // Ground Plane (diperluas dari baris -10 di belakang hingga GRID_ROWS di depan)
  const totalRows = GRID_ROWS + 10;
  const groundGeo = new THREE.PlaneGeometry(GRID_COLS * CELL_SIZE, totalRows * CELL_SIZE);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  const minZ = rowToZ(GRID_ROWS - 1) - CELL_SIZE / 2;
  const maxZ = rowToZ(-10) + CELL_SIZE / 2;
  ground.position.set(0, 0, (minZ + maxZ) / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid Lines (Square tiles: CELL_SIZE x CELL_SIZE)
  const gridPts = [];
  const minX = colToX(0) - CELL_SIZE / 2;
  const maxX = colToX(GRID_COLS - 1) + CELL_SIZE / 2;

  for (let c = 0; c <= GRID_COLS; c++) {
    const x = minX + c * CELL_SIZE;
    gridPts.push(new THREE.Vector3(x, 0.02, minZ), new THREE.Vector3(x, 0.02, maxZ));
  }
  for (let r = -10; r <= GRID_ROWS; r++) {
    const z = rowToZ(r) + CELL_SIZE / 2;
    gridPts.push(new THREE.Vector3(minX, 0.02, z), new THREE.Vector3(maxX, 0.02, z));
  }
  const gridLineGeo = new THREE.BufferGeometry().setFromPoints(gridPts);
  const gridLineMat = new THREE.LineBasicMaterial({ color: 0x1e293b });
  const gridLines = new THREE.LineSegments(gridLineGeo, gridLineMat);
  scene.add(gridLines);

  buildDenseForest();

  // Core Stone Monolith (Row 2, Center Col 8.5)
  const stoneGeo = new THREE.CylinderGeometry(0.9, 1.1, 2.8, 8);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
  stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
  stoneMesh.position.set(colToX(8.5), 1.4, rowToZ(2));
  add4GridBlackFoundation(stoneMesh);
  scene.add(stoneMesh);

  const crystalGeo = new THREE.OctahedronGeometry(0.65);
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.set(0, 0.4, 0);
  stoneMesh.add(crystal);

  coreLight = new THREE.PointLight(0x38bdf8, 3, 18);
  coreLight.position.set(colToX(8.5), 2.2, rowToZ(2));
  scene.add(coreLight);

  if (grid[2]) { grid[2][8] = { type: 'stone', name: 'Core Stone' }; grid[2][9] = { type: 'stone', name: 'Core Stone' }; }
  if (grid[3]) { grid[3][8] = { type: 'stone', name: 'Core Stone' }; grid[3][9] = { type: 'stone', name: 'Core Stone' }; }

  buildBarricadeWall();
  buildTechLabMesh();
  buildBuilderBarracksMesh();
  buildLumberjackBarracksMesh();
  buildMinerBarracksMesh();
  restoreSavedTurretTower();
  buildFPSArms();
  loadPlayerCharacterModel();
}

function restoreSavedTurretTower() {
  if (turretBuilt || turretSavedLvl > 0) {
    let pos = BUILDING_POSITIONS['turret'];
    if (!pos) {
      pos = getBuildingPos('turret');
      BUILDING_POSITIONS['turret'] = pos;
      localStorage.setItem('outpost_building_positions', JSON.stringify(BUILDING_POSITIONS));
    }
    const col = Math.round(xToCol(pos.x));
    const row = Math.round(zToRow(pos.z));
    const tObj = buildSciFiTurretTower();
    tObj.group.position.set(pos.x, 0, pos.z);
    scene.add(tObj.group);
    
    const lvl = turretSavedLvl > 0 ? turretSavedLvl : 1;
    const newTower = { col: col, row: row, lvl: lvl, hp: 50 * lvl, mesh: tObj.group, head: tObj.head };
    towers.push(newTower);
    if (grid[row]) grid[row][col] = newTower;
    turretBuilt = true;
    turretSavedLvl = lvl;
  }
}

function buildTripoProceduralFallback() {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });

  const spine = new THREE.Group(); spine.position.y = 1.0; g.add(spine);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.32), vestMat);
  chest.position.y = 0.32; spine.add(chest);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.34), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
  belt.position.y = 0.04; spine.add(belt);

  const headGroup = new THREE.Group(); headGroup.position.set(0, 0.68, 0); spine.add(headGroup);
  headGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.36), skinMat));
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.38), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
  hair.position.y = 0.18; headGroup.add(hair);

  const lArmGroup = new THREE.Group(); lArmGroup.position.set(-0.35, 0.6, 0); spine.add(lArmGroup);
  lArmGroup.name = 'L_Upperarm';
  const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.16), skinMat); lArmMesh.position.y = -0.3; lArmGroup.add(lArmMesh);

  const rArmGroup = new THREE.Group(); rArmGroup.position.set(0.35, 0.6, 0); spine.add(rArmGroup);
  rArmGroup.name = 'R_Upperarm';
  const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.16), skinMat); rArmMesh.position.y = -0.3; rArmGroup.add(rArmMesh);

  const lThigh = new THREE.Group(); lThigh.position.set(-0.16, 1.0, 0); g.add(lThigh);
  lThigh.name = 'L_Thigh';
  const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.18), pantsMat); lLegMesh.position.y = -0.45; lThigh.add(lLegMesh);

  const rThigh = new THREE.Group(); rThigh.position.set(0.16, 1.0, 0); g.add(rThigh);
  rThigh.name = 'R_Thigh';
  const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.18), pantsMat); rLegMesh.position.y = -0.45; rThigh.add(rLegMesh);

  g.name = 'TripoFallback';
  spine.name = 'Spine01';
  headGroup.name = 'Head';

  return g;
}

function loadPlayerCharacterModel() {
  // 1. natif pasang model Tripo semi-realistis procedural terlebih dahulu
  playerCharacterModel = buildTripoProceduralFallback();
  playerCharacterModel.position.set(playerX, 0, playerZ);
  scene.add(playerCharacterModel);

  const bNamesFallback = ['L_Thigh', 'R_Thigh', 'L_Upperarm', 'R_Upperarm', 'Spine01', 'Head'];
  bNamesFallback.forEach((name) => {
    const bone = playerCharacterModel.getObjectByName(name);
    if (bone) {
      playerBones[name] = bone;
      playerInitialRot[name] = bone.rotation.clone();
    }
  });
  updateCharacterVisibility();

  // 2. muat file GLB Tripo jika tersedia di browser / folder local
  if (typeof THREE.GLTFLoader === 'undefined') return;
  const loader = new THREE.GLTFLoader();
  if (typeof MeshoptDecoder !== 'undefined' && loader.setMeshoptDecoder) {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  loader.load('assets/models/player_tripo.glb', (gltf) => {
    if (playerCharacterModel) scene.remove(playerCharacterModel);
    playerCharacterModel = gltf.scene;
    playerCharacterModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(playerCharacterModel);
    const height = box.max.y - box.min.y;
    if (height > 0.001) {
      const targetScale = 1.78 / height;
      playerCharacterModel.scale.set(targetScale, targetScale, targetScale);
    }
    const boxAfter = new THREE.Box3().setFromObject(playerCharacterModel);
    playerCharacterModel.userData.baseOffsetY = -boxAfter.min.y;

    const boneNames = [
      'L_Thigh', 'R_Thigh', 'L_Calf', 'R_Calf', 'L_Foot', 'R_Foot',
      'L_Upperarm', 'R_Upperarm', 'L_Forearm', 'R_Forearm', 'L_Hand', 'R_Hand',
      'Spine01', 'Spine02', 'Waist', 'Pelvis', 'NeckTwist01', 'Head'
    ];
    boneNames.forEach((name) => {
      const bone = playerCharacterModel.getObjectByName(name);
      if (bone) {
        playerBones[name] = bone;
        playerInitialRot[name] = bone.rotation.clone();
      }
    });

    playerCharacterModel.position.set(playerX, playerCharacterModel.userData.baseOffsetY || 0, playerZ);
    scene.add(playerCharacterModel);
    updateCharacterVisibility();
  }, undefined, (err) => {
    console.log('Menggunakan model Tripo semi-realistis prosedural:', err);
  });
}

function toggleCameraView() {
  isFirstPerson = !isFirstPerson;
  updateCharacterVisibility();
  const camBtn = document.getElementById('camera-view-btn');
  if (camBtn) {
    camBtn.innerHTML = isFirstPerson ? '<i class="fa-solid fa-camera"></i> [V] KAMERA: 1ST PERSON' : '<i class="fa-solid fa-user"></i> [V] KAMERA: 3RD PERSON';
    camBtn.style.background = isFirstPerson ? '#8b5cf6' : '#ec4899';
  }
}

function updateCharacterVisibility() {
  if (!playerCharacterModel) return;
  const head = playerBones['Head'];
  if (isFirstPerson) {
    playerCharacterModel.visible = false;
    if (pistolGroup) pistolGroup.visible = (activeWeaponSlot === 1 && !isSniperScoped);
    if (knifeGroup) knifeGroup.visible = (activeWeaponSlot === 2);
  } else {
    if (head) head.visible = true;
    playerCharacterModel.visible = true;
    if (pistolGroup) pistolGroup.visible = false;
    if (knifeGroup) knifeGroup.visible = false;
  }
}


let forestTrees = [];
let builderTarget = null;
let builderIdleTimer = 0;
let lumberjackTarget = null;

function add4GridBlackFoundation(group) {
  // Semua bangunan selain pagar (termasuk tower & pohon) mengkonsumsi 4 grid (2x2 tile = CELL_SIZE*2 x CELL_SIZE*2) berwarna hitam
  const patchGeo = new THREE.PlaneGeometry(CELL_SIZE * 2, CELL_SIZE * 2);
  const patchMat = new THREE.MeshBasicMaterial({ color: 0x070709 });
  const patch = new THREE.Mesh(patchGeo, patchMat);
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(0, 0.03, 0);
  group.add(patch);
  const borderGeo = new THREE.EdgesGeometry(patchGeo);
  const borderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
  const border = new THREE.LineSegments(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.set(0, 0.04, 0);
  group.add(border);
}

function buildDenseForest() {
  if (forestTrees && forestTrees.length > 0) {
    forestTrees.forEach(t => { if (t.group) scene.remove(t.group); });
  }
  forestTrees = [];
  const treeGeo = new THREE.ConeGeometry(1.6, 4.8, 6);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8 });
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });

  const addTree = (x, z, r, c, isSideTree = false) => {
    const treeId = `${r}_${c}`;
    if (!isSideTree && choppedTrees.includes(treeId)) return;
    const group = new THREE.Group();
    add4GridBlackFoundation(group);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.8;
    group.add(trunk);
    const leaves = new THREE.Mesh(treeGeo, treeMat);
    leaves.position.y = 3.2;
    group.add(leaves);
    group.position.set(x, 0, z);
    scene.add(group);
    forestTrees.push({ group: group, x: x, z: z, row: r, col: c, chopped: false, isSideTree: isSideTree, id: treeId });
  };

  // Sisi Kiri & Kanan (Side Forests - 1 baris pohon 2x2 tile di tiap sisi = 4 grid)
  for (let r = -8; r < GRID_ROWS; r += 2) {
    for (let c of [0, 16]) {
      addTree(colToX(c + 0.5), rowToZ(r + 0.5), r, c, true);
    }
  }

  // Pohon di belakang area pertahanan (row <= 0), maksimal 5 baris ke belakang = tepat 35 pohon (7 pohon x 5 baris)
  for (let r = 0; r >= -8; r -= 2) {
    for (let c = 2; c <= 14; c += 2) {
      addTree(colToX(c + 0.5), rowToZ(r - 0.5), r, c, false);
    }
  }
}

function buildBarricadeWall() {
  fenceMeshes.forEach(m => scene.remove(m));
  fenceMeshes = [];

  const logGeo = new THREE.CylinderGeometry(0.2, 0.24, 2.0, 6);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const spikeGeo = new THREE.ConeGeometry(0.18, 0.45, 6);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

  if (fences.length !== 7) {
    fences = [];
    for (let i = 0; i < 7; i++) {
      fences.push({ id: i, col: 2 + i * 2, row: FENCE_ROW, hp: fenceMaxHp, maxHp: fenceMaxHp, mesh: null });
    }
  } else {
    fences.forEach(f => { f.maxHp = fenceMaxHp; if (f.hp > 0) f.hp = fenceMaxHp; });
  }

  fences.forEach(f => {
    if (f.mesh) scene.remove(f.mesh);
    f.mesh = null;
    if (f.hp <= 0) return; // Runtuh, celah jalan terbuka

    const grp = new THREE.Group();
    const centerX = colToX(f.col + 0.5);
    const centerZ = rowToZ(FENCE_ROW);
    grp.position.set(centerX, 0, centerZ);

    for (let dx = -1.5; dx <= 1.5; dx += 0.5) {
      const log = new THREE.Mesh(logGeo, logMat);
      log.position.set(dx, 1.0, 0);
      log.castShadow = true;
      grp.add(log);

      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(dx, 2.15, 0);
      grp.add(spike);
    }
    scene.add(grp);
    f.mesh = grp;
    fenceMeshes.push(grp);
  });
}

function buildTechLabMesh() {
  if (techLabMesh) scene.remove(techLabMesh);
  if (!techLabBuilt && techLabLvl === 0) return;

  techLabMesh = new THREE.Group();
  const pos = getBuildingPos('tech');
  techLabMesh.position.set(pos.x, 0, pos.z);
  add4GridBlackFoundation(techLabMesh);

  // 1. Hexagonal Armored Base Pedestal
  const baseGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.8, 6);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.4;
  techLabMesh.add(base);

  // 2. Quantum Glass Geodesic Dome
  const domeGeo = new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.3, roughness: 0.1, transparent: true, opacity: 0.55 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 0.8;
  techLabMesh.add(dome);

  // 3. Inner Quantum Core Sphere
  const coreGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 1.4;
  techLabMesh.add(core);

  // 4. Rotating Holographic Radar Ring
  const ringGeo = new THREE.TorusGeometry(1.45, 0.06, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  techLabRadarRing = new THREE.Mesh(ringGeo, ringMat);
  techLabRadarRing.position.y = 1.2;
  techLabRadarRing.rotation.x = Math.PI / 2;
  techLabMesh.add(techLabRadarRing);

  // 5. External Energy Supports
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
    const supGeo = new THREE.BoxGeometry(0.15, 1.4, 0.15);
    const supMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const sup = new THREE.Mesh(supGeo, supMat);
    sup.position.set(Math.cos(angle) * 1.3, 0.9, Math.sin(angle) * 1.3);
    sup.rotation.y = -angle;
    techLabMesh.add(sup);
  }

  techLabMesh.scale.set(0.8, 0.8, 0.8);
  scene.add(techLabMesh);
  const r = zToRow(pos.z), c = xToCol(pos.x);
  if (grid[r] && grid[r][c] !== undefined) grid[r][c] = { type: 'tech_lab', built: true };
}

let builderHammerGroup = null;
function buildBuilderBarracksMesh() {
  if (builderBarracksMesh) scene.remove(builderBarracksMesh);
  if (builderBarracksLvl === 0) return;

  builderBarracksMesh = new THREE.Group();
  const pos = getBuildingPos('builder_barrack');
  builderBarracksMesh.position.set(pos.x, 0, pos.z);
  add4GridBlackFoundation(builderBarracksMesh);

  // 1. Foundation Workshop Base
  const baseGeo = new THREE.BoxGeometry(2.2, 1.4, 2.0);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.7; builderBarracksMesh.add(base);

  // 2. Yellow Workshop Roof
  const roofGeo = new THREE.ConeGeometry(1.7, 0.8, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 1.8; roof.rotation.y = Math.PI / 4; builderBarracksMesh.add(roof);

  // 3. Workshop Anvil Table
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
  anvil.position.set(-0.7, 0.2, 1.2); builderBarracksMesh.add(anvil);

  builderBarracksMesh.scale.set(0.8, 0.8, 0.8);
  scene.add(builderBarracksMesh);
  const r = zToRow(pos.z), c = xToCol(pos.x);
  if (grid[r] && grid[r][c] !== undefined) grid[r][c] = { type: 'builder_barrack', lvl: builderBarracksLvl };
  buildBuilderNPC();
}

function buildBuilderNPC() {
  if (builderMesh) scene.remove(builderMesh);
  if (builderBarracksLvl === 0) return;

  builderMesh = new THREE.Group();
  const pos = getBuildingPos('builder_barrack');
  builderMesh.position.set(pos.x - 0.6, 0, pos.z + 1.2);

  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); lBoot.position.set(-0.15, 0.1, 0.05); builderMesh.add(lBoot);
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); rBoot.position.set(0.15, 0.1, 0.05); builderMesh.add(rBoot);

  const pantMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); lLeg.position.set(-0.15, 0.45, 0); builderMesh.add(lLeg);
  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); rLeg.position.set(0.15, 0.45, 0); builderMesh.add(rLeg);

  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), shirtMat); torso.position.set(0, 0.95, 0); builderMesh.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfecca1 })); head.position.set(0, 1.4, 0); builderMesh.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x3b82f6 })); cap.position.set(0, 1.55, 0); builderMesh.add(cap);

  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); lArm.position.set(-0.32, 0.95, 0); builderMesh.add(lArm);

  builderHammerGroup = new THREE.Group();
  builderHammerGroup.position.set(0.32, 1.1, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); rArm.position.set(0, -0.2, 0); builderHammerGroup.add(rArm);
  const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55), new THREE.MeshStandardMaterial({ color: 0xa16207 })); hammerHandle.position.set(0, -0.3, 0.2); hammerHandle.rotation.x = Math.PI / 3; builderHammerGroup.add(hammerHandle);
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })); hammerHead.position.set(0, -0.15, 0.45); builderHammerGroup.add(hammerHead);

  builderMesh.add(builderHammerGroup);
  scene.add(builderMesh);
}

// === BARAK PENEBANG + NPC PENEBANG (Kapak) ===
function buildLumberjackBarracksMesh() {
  if (lumberjackBarracksMesh) scene.remove(lumberjackBarracksMesh);
  if (lumberjackBarracksLvl === 0) return;

  lumberjackBarracksMesh = new THREE.Group();
  const pos = getBuildingPos('lumberjack');
  lumberjackBarracksMesh.position.set(pos.x, 0, pos.z);
  add4GridBlackFoundation(lumberjackBarracksMesh);

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 })); base.position.y = 0.6; lumberjackBarracksMesh.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0x15803d })); roof.position.y = 1.55; roof.rotation.y = Math.PI / 4; lumberjackBarracksMesh.add(roof);
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x92400e })); stump.position.set(-0.8, 0.2, 1.1); lumberjackBarracksMesh.add(stump);

  lumberjackBarracksMesh.scale.set(0.8, 0.8, 0.8);
  scene.add(lumberjackBarracksMesh);
  const r = zToRow(pos.z), c = xToCol(pos.x);
  if (grid[r] && grid[r][c] !== undefined) grid[r][c] = { type: 'lumberjack_barrack', lvl: lumberjackBarracksLvl };
  buildLumberjackNPC();
}

function buildLumberjackNPC() {
  if (lumberjackMesh) scene.remove(lumberjackMesh);
  if (lumberjackBarracksLvl === 0) return;

  lumberjackMesh = new THREE.Group();
  const pos = getBuildingPos('lumberjack');
  lumberjackMesh.position.set(pos.x - 0.6, 0, pos.z + 1.2);

  const bootMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
  const lB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); lB.position.set(-0.15, 0.1, 0); lumberjackMesh.add(lB);
  const rB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); rB.position.set(0.15, 0.1, 0); lumberjackMesh.add(rB);
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x713f12 });
  const lL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); lL.position.set(-0.15, 0.45, 0); lumberjackMesh.add(lL);
  const rL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); rL.position.set(0.15, 0.45, 0); lumberjackMesh.add(rL);
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), shirtMat); torso.position.set(0, 0.95, 0); lumberjackMesh.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfecca1 })); head.position.set(0, 1.4, 0); lumberjackMesh.add(head);
  const bandana = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 })); bandana.position.set(0, 1.52, 0); lumberjackMesh.add(bandana);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); lArm.position.set(-0.32, 0.95, 0); lumberjackMesh.add(lArm);

  const axeGrp = new THREE.Group(); axeGrp.position.set(0.32, 1.1, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); rArm.position.set(0, -0.2, 0); axeGrp.add(rArm);
  const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55), new THREE.MeshStandardMaterial({ color: 0xa16207 })); axeHandle.position.set(0, -0.3, 0.2); axeHandle.rotation.x = Math.PI / 3; axeGrp.add(axeHandle);
  const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.3), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })); axeHead.position.set(0, -0.15, 0.45); axeGrp.add(axeHead);
  lumberjackMesh.add(axeGrp);
  scene.add(lumberjackMesh);
}

// === BARAK PENAMBANG + NPC PENAMBANG (Beliung) ===
function buildMinerBarracksMesh() {
  if (minerBarracksMesh) scene.remove(minerBarracksMesh);
  if (minerBarracksLvl === 0) return;

  minerBarracksMesh = new THREE.Group();
  const pos = getBuildingPos('miner');
  minerBarracksMesh.position.set(pos.x, 0, pos.z);
  add4GridBlackFoundation(minerBarracksMesh);

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.9 })); base.position.y = 0.6; minerBarracksMesh.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0x78716c })); roof.position.y = 1.55; roof.rotation.y = Math.PI / 4; minerBarracksMesh.add(roof);

  minerBarracksMesh.scale.set(0.8, 0.8, 0.8);
  scene.add(minerBarracksMesh);
  const r = zToRow(pos.z), c = xToCol(pos.x);
  if (grid[r] && grid[r][c] !== undefined) grid[r][c] = { type: 'miner_barrack', lvl: minerBarracksLvl };
  buildMinerNPC();
}

function buildMinerNPC() {
  if (minerMesh) scene.remove(minerMesh);
  if (minerBarracksLvl === 0) return;

  minerMesh = new THREE.Group();
  const pos = getBuildingPos('miner');
  minerMesh.position.set(pos.x - 0.6, 0, pos.z + 1.2);

  const bootMat = new THREE.MeshStandardMaterial({ color: 0x292524 });
  const lB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); lB.position.set(-0.15, 0.1, 0); minerMesh.add(lB);
  const rB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); rB.position.set(0.15, 0.1, 0); minerMesh.add(rB);
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x57534e });
  const lL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); lL.position.set(-0.15, 0.45, 0); minerMesh.add(lL);
  const rL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); rL.position.set(0.15, 0.45, 0); minerMesh.add(rL);
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), shirtMat); torso.position.set(0, 0.95, 0); minerMesh.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfecca1 })); head.position.set(0, 1.4, 0); minerMesh.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xeab308 })); helmet.position.set(0, 1.52, 0); minerMesh.add(helmet);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); lArm.position.set(-0.32, 0.95, 0); minerMesh.add(lArm);

  const pickGrp = new THREE.Group(); pickGrp.position.set(0.32, 1.1, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); rArm.position.set(0, -0.2, 0); pickGrp.add(rArm);
  const pickHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55), new THREE.MeshStandardMaterial({ color: 0x78350f })); pickHandle.position.set(0, -0.3, 0.2); pickHandle.rotation.x = Math.PI / 3; pickGrp.add(pickHandle);
  const pickHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.9 })); pickHead.position.set(0, -0.12, 0.48); pickGrp.add(pickHead);
  minerMesh.add(pickGrp);
  scene.add(minerMesh);
}

function buildWeaponCrateMesh() {
  if (weaponCrateMesh) scene.remove(weaponCrateMesh);
  if (weaponCrateLvl === 0) return;

  weaponCrateMesh = new THREE.Group();
  const pos = getBuildingPos('weapon_crate');
  weaponCrateMesh.position.set(pos.x, 0, pos.z);
  add4GridBlackFoundation(weaponCrateMesh);

  // 1. Armored Military Base Pedestal
  const baseGeo = new THREE.BoxGeometry(2.4, 0.4, 2.4);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8, metalness: 0.5 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.2;
  weaponCrateMesh.add(base);

  // 2. Main Military Olive Green Steel Crate
  const crateGeo = new THREE.BoxGeometry(2.0, 1.2, 1.6);
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.4, metalness: 0.6 });
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.y = 0.8;
  weaponCrateMesh.add(crate);

  // 3. Gold Metallic Reinforcement Bands & Lock
  const bandGeo = new THREE.BoxGeometry(2.04, 0.25, 1.64);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
  const band1 = new THREE.Mesh(bandGeo, goldMat);
  band1.position.y = 0.8;
  weaponCrateMesh.add(band1);

  // 4. Rotating Holographic Gun Emblem Top
  const gunGeo = new THREE.BoxGeometry(0.8, 0.3, 0.15);
  const holoMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
  weaponCrateHoloGun = new THREE.Mesh(gunGeo, holoMat);
  weaponCrateHoloGun.position.set(0, 1.8, 0);
  weaponCrateMesh.add(weaponCrateHoloGun);

  scene.add(weaponCrateMesh);
  const r = zToRow(pos.z), c = xToCol(pos.x);
  if (grid[r] && grid[r][c] !== undefined) grid[r][c] = { type: 'weapon_crate', lvl: weaponCrateLvl };
}

let cameraArmLight = null;

function buildFPSArms() {
  if (knifeGroup) camera.remove(knifeGroup);
  if (pistolGroup) camera.remove(pistolGroup);
  if (!cameraArmLight) {
    cameraArmLight = new THREE.PointLight(0xffffff, 1.2, 5);
    cameraArmLight.position.set(0.2, 0.2, 0);
    camera.add(cameraArmLight);
  }

  const armMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }); // Tangan karakter

  // Melee Group (Diposisikan jelas di kanan bawah kamera saat aktif)
  knifeGroup = new THREE.Group();
  const meleeArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), armMat);
  meleeArm.position.set(0.06, -0.15, 0.15); knifeGroup.add(meleeArm);

  if (equippedMelee === 'blade' || equippedMelee === 'sword') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 0.06), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    blade.position.set(0, 0.4, -0.1); knifeGroup.add(blade);
  } else if (equippedMelee === 'axe') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    handle.position.set(0, 0.3, -0.1); knifeGroup.add(handle);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.35), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 }));
    head.position.set(0, 0.55, -0.05); knifeGroup.add(head);
  } else if (equippedMelee === 'hammer') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    handle.position.set(0, 0.35, -0.1); knifeGroup.add(handle);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.35), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
    head.position.set(0, 0.65, -0.1); knifeGroup.add(head);
  } else if (equippedMelee === 'scythe') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    handle.position.set(0, 0.4, -0.1); knifeGroup.add(handle);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 0.15), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    blade.position.set(0, 0.75, -0.25); blade.rotation.x = -Math.PI / 3; knifeGroup.add(blade);
  } else {
    // Pisau Komando
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.04), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
    blade.position.set(0, 0.25, -0.1); knifeGroup.add(blade);
  }
  knifeGroup.position.set(0.22, -0.18, -0.45);
  knifeGroup.rotation.set(0.2, -0.1, 0.05);
  camera.add(knifeGroup);

  // Ranged Group (Diposisikan jelas di kanan bawah kamera saat aktif)
  pistolGroup = new THREE.Group();
  const rangedArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), armMat);
  rangedArm.position.set(0.06, -0.15, 0.15); pistolGroup.add(rangedArm);

  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.3 });
  if (equippedRanged === 'sniper') {
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.95), gunMat);
    pistolGroup.add(barrel);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.13, -0.05); pistolGroup.add(scope);
  } else if (equippedRanged === 'shotgun') {
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.58), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    pistolGroup.add(barrel);
  } else if (equippedRanged === 'ak47') {
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.68), new THREE.MeshStandardMaterial({ color: 0x4b5563 }));
    pistolGroup.add(barrel);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.12), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    mag.position.set(0, -0.16, -0.05); mag.rotation.x = -0.3; pistolGroup.add(mag);
  } else if (equippedRanged === 'bow') {
    const bowBody = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    bowBody.rotation.z = Math.PI / 2; pistolGroup.add(bowBody);
  } else if (equippedRanged === 'rudal') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.95, 12), new THREE.MeshStandardMaterial({ color: 0x3f6212 }));
    tube.rotation.x = Math.PI / 2; pistolGroup.add(tube);
    const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    warhead.rotation.x = -Math.PI / 2; warhead.position.set(0, 0, -0.55); pistolGroup.add(warhead);
  } else {
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.45), gunMat);
    pistolGroup.add(barrel);
  }
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.1), gunMat);
  grip.position.set(0, -0.12, 0.1); grip.rotation.x = 0.3; pistolGroup.add(grip);
  pistolGroup.position.set(0.22, -0.18, -0.45);
  camera.add(pistolGroup);

  const flashGeo = new THREE.SphereGeometry(0.14);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlashMesh.position.set(0, 0, -0.45);
  muzzleFlashMesh.visible = false;
  pistolGroup.add(muzzleFlashMesh);

  pistolGroup.visible = (activeWeaponSlot === 1);
  knifeGroup.visible = (activeWeaponSlot === 2);
}

let isSniperScoped = false;
function updateSniperScopeUI() {
  if (isAnyModalActive() || isReloading || activeWeaponSlot !== 1 || equippedRanged !== 'sniper') {
    isSniperScoped = false;
  }
  const scopeEl = document.getElementById('sniper-scope-overlay');
  const crosshairEl = document.querySelector('.fps-crosshair');
  const shouldScope = isSniperScoped && activeWeaponSlot === 1 && equippedRanged === 'sniper' && !isReloading && !isAnyModalActive();
  
  if (scopeEl) scopeEl.style.display = shouldScope ? 'block' : 'none';
  if (crosshairEl) crosshairEl.style.display = shouldScope ? 'none' : 'block';
  if (pistolGroup) pistolGroup.visible = (activeWeaponSlot === 1 && !shouldScope);
}

init3D();
setInterval(updateClock, 1000);
updateClock();
updateHUD();
requestAnimationFrame(loop);

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
  const clockEl = document.getElementById('clock-display');
  if (clockEl) clockEl.innerText = `🕒 WIB ${timeStr}`;
}

function updateHUD() {
  if (typeof updateSniperScopeUI === 'function') updateSniperScopeUI();
  const gEl = document.getElementById('gold-display');
  if (gEl) gEl.innerText = Math.floor(gold).toLocaleString('id-ID');
  const gemEl = document.getElementById('gem-display');
  if (gemEl) gemEl.innerText = gems.toLocaleString('id-ID');

  const pHpEl = document.getElementById('player-hp-display');
  if (pHpEl) {
    pHpEl.innerText = `${Math.ceil(Math.max(0, playerHp))} / ${playerMaxHp}`;
    pHpEl.style.color = playerHp > 5 ? '#f43f5e' : '#ef4444';
  }

  const ammoEl = document.getElementById('ammo-display');
  if (ammoEl) {
    if (activeWeaponSlot === 2) {
      ammoEl.innerText = '🗡️ MELEE';
      ammoEl.style.color = '#10b981';
    } else if (isReloading) {
      ammoEl.innerText = `🔄 RELOAD (${(reloadTimer / 60).toFixed(1)}s)`;
      ammoEl.style.color = '#f97316';
    } else {
      ammoEl.innerText = `${currentAmmo} / ${maxAmmo}`;
      ammoEl.style.color = '#fde047';
    }
  }

  const fHpEl = document.getElementById('fence-hp-display');
  if (fHpEl) {
    const standing = fences.filter(f => f.hp > 0).length;
    const totalF = fences.length || 7;
    if (standing === 0) {
      fHpEl.innerText = `💥 0/${totalF} RUNTUH!`;
      fHpEl.style.color = '#ef4444';
    } else {
      const avgHp = Math.floor(fences.reduce((acc, f) => acc + Math.max(0, f.hp), 0) / standing);
      fHpEl.innerText = `${standing}/${totalF} Berdiri (${avgHp} HP)`;
      fHpEl.style.color = standing < totalF ? '#f97316' : '#fbbf24';
    }
  }

  const sHpEl = document.getElementById('stone-hp-display');
  if (sHpEl) sHpEl.innerText = `${Math.max(0, Math.floor(stoneHp))} / ${stoneMaxHp}`;

  // Populate Grid Inventory Cells [I]
  const invWood = document.getElementById('inv-grid-wood');
  if (invWood) invWood.innerText = woodCount.toLocaleString('id-ID');
  const invStone = document.getElementById('inv-grid-stone');
  if (invStone) invStone.innerText = stoneCount.toLocaleString('id-ID');
  const invIron = document.getElementById('inv-grid-iron');
  if (invIron) invIron.innerText = ironCount.toLocaleString('id-ID');
  const invRubber = document.getElementById('inv-grid-rubber');
  if (invRubber) invRubber.innerText = rubberCount.toLocaleString('id-ID');
  const invGear = document.getElementById('inv-grid-gear');
  if (invGear) invGear.innerText = gearCount.toLocaleString('id-ID');

  const modalWood = document.getElementById('modal-wood');
  if (modalWood) modalWood.innerText = woodCount.toLocaleString('id-ID');
  const modalStone = document.getElementById('modal-stone');
  if (modalStone) modalStone.innerText = stoneCount.toLocaleString('id-ID');
  const modalIron = document.getElementById('modal-iron');
  if (modalIron) modalIron.innerText = ironCount.toLocaleString('id-ID');
  const modalRubber = document.getElementById('modal-rubber');
  if (modalRubber) modalRubber.innerText = rubberCount.toLocaleString('id-ID');
  const modalGear = document.getElementById('modal-gear');
  if (modalGear) modalGear.innerText = gearCount.toLocaleString('id-ID');

  // Sync Upgrade Button Prices
  const btnWall = document.getElementById('btn-up-wall');
  if (btnWall) {
    const cost = Math.floor(250 * Math.pow(1.5, wallLvl - 1));
    btnWall.innerText = `Upgrade (Lv ${wallLvl} -> ${wallLvl + 1}): ${cost.toLocaleString('id-ID')} G`;
  }
  const btnStone = document.getElementById('btn-up-stone');
  if (btnStone) {
    const cost = Math.floor(500 * Math.pow(1.5, stoneLvl - 1));
    btnStone.innerText = `Upgrade (Lv ${stoneLvl} -> ${stoneLvl + 1}): ${cost.toLocaleString('id-ID')} G`;
  }
}

function startGame() {
  localStorage.setItem('corestone_locked', 'false');
  document.getElementById('start-screen').classList.add('hidden');
  const lockoutEl = document.getElementById('lockout-screen');
  if (lockoutEl) lockoutEl.classList.add('hidden');

  fenceMaxHp = Math.floor(100 * Math.pow(1.25, wallLvl - 1)); fenceHp = fenceMaxHp;
  stoneMaxHp = 200 + (stoneLvl - 1) * 100; stoneHp = stoneMaxHp;
  enemies.forEach(e => scene.remove(e.mesh)); enemies = [];
  bullets.forEach(b => scene.remove(b.mesh)); bullets = [];
  towers.forEach(t => scene.remove(t.mesh)); towers = [];
  woodItems.forEach(w => scene.remove(w.mesh)); woodItems = [];
  grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
  if (grid[2]) { grid[2][8] = { type: 'stone', name: 'Core Stone' }; grid[2][9] = { type: 'stone', name: 'Core Stone' }; }
  if (grid[3]) { grid[3][8] = { type: 'stone', name: 'Core Stone' }; grid[3][9] = { type: 'stone', name: 'Core Stone' }; }
  buildBarricadeWall();
  buildTechLabMesh();
  buildBuilderBarracksMesh();
  buildLumberjackBarracksMesh();
  buildMinerBarracksMesh();
  buildDenseForest();
  playerX = colToX(8.5); playerZ = rowToZ(5);
  camera.position.set(playerX, CAMERA_HEIGHT, playerZ);
  gameRunning = true;
  spawnEnemy(false);
  spawnEnemy(true);
  updateHUD();

  if (canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
}

function showCoreStoneDestroyedLockout() {
  gameRunning = false;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  localStorage.setItem('corestone_locked', 'true');
}

function payRansom() {
  const cost = (currentPhase === 1 ? 100 : (currentPhase === 2 ? 300 : 500));
  if (gems < cost) { alert('⚠️ Permata tidak cukup!'); return; }
  gems -= cost; isLockedOut = false; localStorage.setItem('corestone_locked', 'false');
  updateHUD(); startGame();
}

// FPS 360-Degree Look Around & Pointer Lock Tracking
let isMouseDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;

function isAnyModalActive() {
  const modals = ['inventory-modal', 'equipment-modal', 'building-modal', 'topup-modal'];
  return modals.some(id => {
    const el = document.getElementById(id);
    return el && el.classList.contains('active');
  });
}

function startBuildingPlacement(bType) {
  placingBuildingType = bType;
  if (!placingHologramMesh) {
    const geo = new THREE.BoxGeometry(4.8, 3.5, 4.8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.85 });
    placingHologramMesh = new THREE.Mesh(geo, mat);
    scene.add(placingHologramMesh);
  }
  placingHologramMesh.visible = true;
  const banner = document.getElementById('placement-banner');
  if (banner) banner.style.display = 'block';
}

function cancelBuildingPlacement() {
  if (isRelocatingBuilding && relocatingTargetMesh) {
    relocatingTargetMesh.visible = true;
  }
  isRelocatingBuilding = false;
  relocatingTargetMesh = null;
  relocatingTowerObj = null;
  placingBuildingType = null;
  if (placingHologramMesh) placingHologramMesh.visible = false;
  const banner = document.getElementById('placement-banner');
  if (banner) banner.style.display = 'none';
}

canvas.addEventListener('mousedown', e => {
  if (!gameRunning || isAnyModalActive()) return;
  if (placingBuildingType && placingHologramMesh && placingHologramMesh.visible) {
    if (isRelocatingBuilding) {
      if (e.button === 2 || e.button === 0) { // Klik Kanan (atau Kiri) untuk meletakkan bangunan yang sedang dipindahkan
        if (!placingHologramMesh.isValidPlacement) {
          alert("⚠️ Area ini bertumpuk dengan bangunan/objek lain atau di luar batas pertahanan! Pilih area kosong 4 grid (2x2).");
          return;
        }
        finishBuildingRelocation(true);
      }
      return;
    }
    if (e.button === 0) { // Left Click
      if (!placingHologramMesh.isValidPlacement) {
        alert("⚠️ Area ini bertumpuk dengan bangunan/objek lain atau di luar batas pertahanan! Pilih area kosong 4 grid (2x2).");
        return;
      }
      const bType = placingBuildingType;
      BUILDING_POSITIONS[bType] = { x: placingHologramMesh.position.x, z: placingHologramMesh.position.z };
      localStorage.setItem('outpost_building_positions', JSON.stringify(BUILDING_POSITIONS));
      cancelBuildingPlacement();

      if (bType === 'turret') tryBuildTowerAt(BUILDING_POSITIONS[bType].x, BUILDING_POSITIONS[bType].z);
      else if (bType === 'tech') tryBuildTechLab();
      else if (bType === 'builder_barrack') tryBuildBuilderBarracks();
      else if (bType === 'lumberjack') tryBuildLumberjackBarracks();
      else if (bType === 'miner') tryBuildMinerBarracks();
      else if (bType === 'mine') tryBuildMine();
      else if (bType === 'farm') tryBuildFarm();
      else if (bType === 'oilpump') tryBuildOilPump();
      return;
    } else if (e.button === 2) { // Right Click
      cancelBuildingPlacement();
      return;
    }
  }
  if (e.button === 2) { // Right Click
    if (activeWeaponSlot === 1 && equippedRanged === 'sniper') {
      isSniperScoped = !isSniperScoped;
      if (typeof updateSniperScopeUI === 'function') updateSniperScopeUI();
    }
    return; // Klik kanan tidak menembak
  }
  isMouseDragging = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
  if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
  if (e.button === 0) { // Left Click
    fireFPSPistol();
  }
});

window.addEventListener('mouseup', () => { isMouseDragging = false; });

window.addEventListener('mousemove', e => {
  if (!gameRunning || isAnyModalActive()) return;
  let moveX = 0;
  let moveY = 0;

  if (document.pointerLockElement === canvas) {
    moveX = e.movementX || 0;
    moveY = e.movementY || 0;
  } else if (isMouseDragging) {
    moveX = e.clientX - prevMouseX;
    moveY = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  } else {
    return; // Abaikan pergerakan tanpa pointer lock jika tidak ditarik (drag)
  }

  if (moveX !== 0 || moveY !== 0) {
    cameraYaw -= moveX * 0.0035;
    cameraPitch -= moveY * 0.0035;
    cameraPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, cameraPitch));
    camera.rotation.set(cameraPitch, cameraYaw, 0, 'YXZ');
  }
});

let playerFireCooldown = 0;

function showFloatingLootText(text, objX, objY, objZ, colorHex = '#fde047') {
  if (!camera) return;
  const vec = new THREE.Vector3(objX, objY, objZ);
  vec.project(camera);
  if (vec.z > 1.0) return;
  const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;

  const el = document.createElement('div');
  el.className = 'floating-loot-popup';
  el.innerHTML = text;
  el.style.position = 'fixed';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.color = colorHex;
  el.style.fontWeight = '800';
  el.style.fontSize = '15px';
  el.style.textShadow = '0 2px 8px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.8)';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '99999';
  el.style.transition = 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
  el.style.opacity = '1';

  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.top = (y - 70) + 'px';
    el.style.opacity = '0';
  });
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1450);
}

function rewardEnemyKill(e) {
  const earnedGold = 15 + Math.floor(Math.random() * 11);
  gold += earnedGold;

  localStorage.setItem('outpost_gold', Math.floor(gold));

  if (e && e.mesh) {
    showFloatingLootText(`+${earnedGold} Gold 🪙`, e.mesh.position.x, 2.2, e.mesh.position.z, '#fbbf24');
  }
  updateHUD();
}

function fireFPSPistol() {
  if (playerFireCooldown > 0) return;

  if (activeWeaponSlot === 2) {
    // Melee Attack
    const st = WEAPON_STATS[equippedMelee] || WEAPON_STATS.knife;
    let dmg = st.dmg || 15;
    let cd = Math.floor((parseFloat(st.speed) || 0.25) * 60);
    let reach = st.range || 2.8;

    playerFireCooldown = cd;
    isAttackingMelee = true;
    setTimeout(() => { isAttackingMelee = false; }, 250);
    if (knifeGroup) knifeGroup.rotation.z = -0.55;
    setTimeout(() => { if (knifeGroup) knifeGroup.rotation.z = 0.2; }, 120);

    for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      if (camera.position.distanceTo(e.mesh.position) < reach) {
        e.hp -= dmg;
        if (e.hp <= 0) {
          rewardEnemyKill(e);
          scene.remove(e.mesh); enemies.splice(i, 1);
        }
        break;
      }
    }
    return;
  }

  // Ranged Attack
  if (isReloading) return;
  if (currentAmmo <= 0) {
    startReload();
    return;
  }

  const st = WEAPON_STATS[equippedRanged] || WEAPON_STATS.pistol;
  let dmg = st.dmg || 10;
  let cd = Math.floor((parseFloat(st.speed) || 0.5) * 60);
  let spdMult = equippedRanged === 'sniper' ? 3.2 : 1.5;

  currentAmmo--;
  updateHUD();
  if (currentAmmo === 0) {
    startReload();
  }

  playerFireCooldown = cd;
  pistolRecoilAnim = 12;
  if (muzzleFlashMesh) muzzleFlashMesh.visible = true;
  setTimeout(() => { if (muzzleFlashMesh) muzzleFlashMesh.visible = false; }, 60);

  const bulletGeo = new THREE.SphereGeometry(equippedRanged === 'sniper' ? 0.25 : 0.16);
  const bulletMat = new THREE.MeshBasicMaterial({ color: equippedRanged === 'sniper' ? 0x38bdf8 : 0xfbbf24 });

  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

  const maxDistUnits = (st.range || 8) * CELL_SIZE;
  if (equippedRanged === 'shotgun') {
    for (let s = -0.1; s <= 0.1; s += 0.1) {
      const bM = new THREE.Mesh(bulletGeo, bulletMat);
      const pelletDir = dir.clone().add(new THREE.Vector3(s + (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, 0)).normalize();
      bM.position.copy(camera.position).addScaledVector(pelletDir, 0.8);
      scene.add(bM);
      bullets.push({ mesh: bM, dir: pelletDir.multiplyScalar(spdMult), dmg: dmg / 3, startPos: camera.position.clone(), maxDist: maxDistUnits, isPlayerBullet: true });
    }
  } else {
    const bMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bMesh.position.copy(camera.position).addScaledVector(dir, 0.8);
    scene.add(bMesh);
    bullets.push({ mesh: bMesh, dir: dir.clone().multiplyScalar(spdMult), dmg: dmg, startPos: camera.position.clone(), maxDist: maxDistUnits, isRudal: equippedRanged === 'rudal', isPlayerBullet: true });
  }
}

function startReload() {
  if (isReloading || activeWeaponSlot !== 1) return;
  const st = WEAPON_STATS[equippedRanged] || WEAPON_STATS.pistol;
  isReloading = true;
  isSniperScoped = false;
  if (typeof updateSniperScopeUI === 'function') updateSniperScopeUI();
  reloadTimer = Math.floor((st.reload || 0.5) * 60);
  updateHUD();
}

function triggerAoEExplosion(pos, radius, dmg, colorHex = 0xff4500) {
  const expGeo = new THREE.SphereGeometry(radius, 16, 16);
  const expMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8 });
  const expMesh = new THREE.Mesh(expGeo, expMat);
  expMesh.position.copy(pos);
  scene.add(expMesh);

  let animSec = 0;
  const expInterval = setInterval(() => {
    animSec++;
    expMesh.scale.multiplyScalar(1.15);
    expMat.opacity -= 0.15;
    if (animSec >= 6) {
      clearInterval(expInterval);
      scene.remove(expMesh);
    }
  }, 30);

  for (let j = enemies.length - 1; j >= 0; j--) {
    let e = enemies[j];
    let dist = Math.hypot(pos.x - e.mesh.position.x, pos.z - e.mesh.position.z);
    if (dist <= radius) {
      e.hp -= dmg;
      if (e.hp <= 0) {
        rewardEnemyKill(e);
        scene.remove(e.mesh);
        enemies.splice(j, 1);
      }
    }
  }
}

let lastGrenadeTime = 0;
function throwGrenade() {
  if (!gameRunning || isAnyModalActive()) return;
  const now = Date.now();
  if (now - lastGrenadeTime < 400) return;
  lastGrenadeTime = now;

  const maxDistUnits = 8 * CELL_SIZE; // 8 tile = 16 unit
  let targetPos = null;
  let nearestDist = Infinity;

  enemies.forEach(e => {
    const dist = camera.position.distanceTo(e.mesh.position);
    if (dist <= maxDistUnits && dist < nearestDist) {
      nearestDist = dist;
      targetPos = e.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
    }
  });

  let dir;
  if (targetPos) {
    dir = new THREE.Vector3().subVectors(targetPos, camera.position).normalize();
  } else {
    dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  }

  const grenadeGeo = new THREE.SphereGeometry(0.22, 12, 12);
  const grenadeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 });
  const gMesh = new THREE.Mesh(grenadeGeo, grenadeMat);
  gMesh.position.copy(camera.position).addScaledVector(dir, 0.6);
  scene.add(gMesh);

  bullets.push({
    mesh: gMesh,
    dir: dir.multiplyScalar(1.2),
    dmg: 40,
    startPos: camera.position.clone(),
    maxDist: maxDistUnits,
    isGrenade: true
  });
}

function toggleBuilderActiveState(forceState = null, silent = false) {
  if (builderBarracksLvl <= 0) return;
  if (forceState !== null) isBuilderActive = forceState;
  else isBuilderActive = !isBuilderActive;
  localStorage.setItem('outpost_builder_active', isBuilderActive ? 'true' : 'false');
  if (isBuilderActive) {
    if (!silent) alert("🛠️ NPC TUKANG DIAKTIFKAN!\n\nTukang mulai memeriksa Rencana Kerja [B] dan mendatangi lokasi pembangunan/peningkatan.");
    builderIdleTimer = 0;
  } else {
    if (!silent) alert("🛑 NPC TUKANG DINONAKTIFKAN!\n\nTukang langsung berhenti bekerja, seluruh progress konstruksi saat ini DIRESET menjadi 0, dan Tukang kembali ke Barak Tukang.");
    if (builderTarget) {
      if (typeof hideFloatingBuildProgress === 'function') hideFloatingBuildProgress();
      builderTarget = null;
    }
  }
}

function toggleLumberjackActiveState() {
  if (lumberjackBarracksLvl <= 0) return;
  isLumberjackActive = !isLumberjackActive;
  localStorage.setItem('outpost_lumberjack_active', isLumberjackActive ? 'true' : 'false');
  if (isLumberjackActive) {
    alert("🪓 NPC PENEBANG DIAKTIFKAN!\n\nPenebang mulai menuju hutan untuk menebang pohon.");
  } else {
    alert("🛑 NPC PENEBANG DINONAKTIFKAN!\n\nPenebang langsung berhenti bekerja, progress penebangan saat ini DIRESET menjadi 0, dan Penebang kembali ke Barak Penebang.");
    if (lumberjackTarget) {
      lumberjackTarget = null;
    }
  }
}

window.addEventListener('keydown', e => {
  keysPressed[e.key.toUpperCase()] = true;
  if (e.key === ' ' || e.code === 'Space') keysPressed['SPACE'] = true;

  const eqM = document.getElementById('equipment-modal');
  if (eqM && eqM.classList.contains('active')) {
    if (e.key === 'ArrowLeft') { navigateWeapon(-1); e.preventDefault(); return; }
    if (e.key === 'ArrowRight') { navigateWeapon(1); e.preventDefault(); return; }
    if (e.key === 'Enter') { equipCurrentPreview(); e.preventDefault(); return; }
    if (e.key.toUpperCase() === 'Q') {
      const wTab = document.getElementById('tab-weapon-content');
      switchETab(wTab && wTab.style.display !== 'none' ? 'equip' : 'weapon');
      e.preventDefault(); return;
    }
    if (e.key === 'Escape') { closeEquipment(); return; }
  }

  if (!gameRunning) return;
  if (e.key === ' ' || e.code === 'Space') {
    if (!isJumping) {
      isJumping = true;
      jumpVy = 0.28;
    }
  }

  const k = e.key.toUpperCase();
  if (k === 'Q' || k === '1' || k === '2') {
    if (k === 'Q') {
      let handledRelocation = false;
      if (camera && !isRelocatingBuilding) {
        const rc = new THREE.Raycaster();
        rc.setFromCamera({ x: 0, y: 0 }, camera);
        const candidateBuildings = [
          { type: 'builder_barrack', mesh: builderBarracksMesh, lvl: builderBarracksLvl },
          { type: 'lumberjack', mesh: lumberjackBarracksMesh, lvl: lumberjackBarracksLvl },
          { type: 'miner', mesh: minerBarracksMesh, lvl: minerBarracksLvl },
          { type: 'tech', mesh: techLabMesh, lvl: techLabLvl },
          { type: 'weapon_crate', mesh: weaponCrateMesh, lvl: weaponCrateLvl },
          { type: 'stone', mesh: stoneMesh, lvl: stoneLvl }
        ];
        for (let t of towers) {
          if (t.mesh) candidateBuildings.push({ type: 'turret', mesh: t.mesh, lvl: t.lvl, towerObj: t });
        }
        for (let cand of candidateBuildings) {
          if (cand.mesh && cand.lvl > 0 && cand.mesh.visible) {
            const hits = rc.intersectObject(cand.mesh, true);
            const dist = Math.hypot(playerX - cand.mesh.position.x, playerZ - cand.mesh.position.z);
            if (hits.length > 0 && dist <= 5.0) {
              startBuildingRelocation(cand.type, cand.mesh, cand.towerObj);
              handledRelocation = true;
              break;
            }
          }
        }
      }
      if (handledRelocation) return;
    }

    if (k === '1') activeWeaponSlot = 1;
    else if (k === '2') activeWeaponSlot = 2;
    else activeWeaponSlot = activeWeaponSlot === 1 ? 2 : 1;

    if (pistolGroup) pistolGroup.visible = (activeWeaponSlot === 1);
    if (knifeGroup) knifeGroup.visible = (activeWeaponSlot === 2);
    if (activeWeaponSlot === 1 && !isReloading) {
      const st = WEAPON_STATS[equippedRanged] || WEAPON_STATS.pistol;
      if (currentAmmo <= 0) currentAmmo = st.ammoMax;
    }
    isSniperScoped = false;
    if (typeof updateSniperScopeUI === 'function') updateSniperScopeUI();
    updateHUD();
  }
  if (k === 'E') openEquipment();
  if (k === 'X') throwGrenade();
  if (k === 'B') {
    let pointingAtBuilder = false;
    if (builderBarracksMesh && camera) {
      const rc = new THREE.Raycaster();
      rc.setFromCamera({ x: 0, y: 0 }, camera);
      const hits = rc.intersectObject(builderBarracksMesh, true);
      const distToBuilder = Math.hypot(playerX - builderBarracksMesh.position.x, playerZ - builderBarracksMesh.position.z);
      if (hits.length > 0 && distToBuilder <= 4.5) pointingAtBuilder = true;
    }
    if (pointingAtBuilder) openBuilderPlanModal();
    else openBuildingMenu();
  }
  if (k === 'T') tryBuildTower();
  if (k === 'U') tryProximityUpgrade();
  if (k === 'I') {
    let handledNPC = false;
    if (builderBarracksMesh && camera) {
      const rc = new THREE.Raycaster();
      rc.setFromCamera({ x: 0, y: 0 }, camera);
      const hits = rc.intersectObject(builderBarracksMesh, true);
      const distToBuilder = Math.hypot(playerX - builderBarracksMesh.position.x, playerZ - builderBarracksMesh.position.z);
      if (hits.length > 0 && distToBuilder <= 4.5) {
        toggleBuilderActiveState();
        handledNPC = true;
      }
    }
    if (!handledNPC && lumberjackBarracksMesh && camera) {
      const rc = new THREE.Raycaster();
      rc.setFromCamera({ x: 0, y: 0 }, camera);
      const hits = rc.intersectObject(lumberjackBarracksMesh, true);
      const distToLumberjack = Math.hypot(playerX - lumberjackBarracksMesh.position.x, playerZ - lumberjackBarracksMesh.position.z);
      if (hits.length > 0 && distToLumberjack <= 4.5) {
        toggleLumberjackActiveState();
        handledNPC = true;
      }
    }
    if (!handledNPC) toggleInventory();
  }
  if (e.key === 'Escape') {
    if (isRelocatingBuilding) finishBuildingRelocation(false);
    else cancelBuildingPlacement();
    closeInventory(); closeEquipment(); closeBuildingMenu();
  }
});

window.addEventListener('keyup', e => {
  keysPressed[e.key.toUpperCase()] = false;
  if (e.key === ' ' || e.code === 'Space') keysPressed['SPACE'] = false;
});

function handleSmoothPlayerMovement() {
  if (isJumping) {
    playerY += jumpVy;
    jumpVy -= 0.016;
    if (playerY <= CAMERA_HEIGHT) {
      playerY = CAMERA_HEIGHT;
      isJumping = false;
    }
  } else {
    playerY = CAMERA_HEIGHT;
  }

  if (keysPressed['ARROWLEFT']) {
    cameraYaw += 0.04;
    camera.rotation.set(cameraPitch, cameraYaw, 0, 'YXZ');
  }
  if (keysPressed['ARROWRIGHT']) {
    cameraYaw -= 0.04;
    camera.rotation.set(cameraPitch, cameraYaw, 0, 'YXZ');
  }

  const moveSpeed = 0.12;
  let fwd = 0;
  let side = 0;

  if (keysPressed['W'] || keysPressed['ARROWUP']) fwd += moveSpeed;
  if (keysPressed['S'] || keysPressed['ARROWDOWN']) fwd -= moveSpeed;
  if (keysPressed['A']) side -= moveSpeed;
  if (keysPressed['D']) side += moveSpeed;

  if (fwd !== 0 || side !== 0) {
    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);

    let dx = -fwd * sinY + side * cosY;
    let dz = -fwd * cosY - side * sinY;

    let nextX = playerX + dx;
    let nextZ = playerZ + dz;

    // Akses kolom 2 hingga 15.9 (di luar area pohon sisi kiri & kanan)
    nextX = Math.max(colToX(2), Math.min(colToX(GRID_COLS - 2.1), nextX));

    if (nextZ > rowToZ(1)) {
      // Area hutan belakang (Z > -2.5): bisa dimasuki jika berada di area pohon belakang yang sudah ditebang
      let allowedInForest = false;
      if (choppedTrees.length > 0) {
        for (let t of forestTrees) {
          if (t.chopped && Math.abs(nextX - t.x) <= 2.5 && Math.abs(nextZ - t.z) <= 2.5) {
            allowedInForest = true; break;
          }
        }
      }
      if (!allowedInForest && nextZ > rowToZ(0)) nextZ = rowToZ(0);
    } else {
      // Batas utara arena permainan
      nextZ = Math.max(rowToZ(GRID_ROWS - 2), nextZ);
    }

    // Pagar dapat dilewati jika runtuh atau melompat dengan shortcut SPACE
    const fenceZ = rowToZ(FENCE_ROW);
    const isCrossingFence = (playerZ > fenceZ && nextZ <= fenceZ) || (playerZ < fenceZ && nextZ >= fenceZ);
    const jumpingOver = isJumping || keysPressed[' '] || keysPressed['SPACE'];
    if (isCrossingFence && !jumpingOver) {
      let blockedByFence = false;
      fences.forEach(f => {
        if (f.hp > 0 && Math.abs(nextX - colToX(f.col + 0.5)) < 2.5) blockedByFence = true;
      });
      if (blockedByFence) nextZ = playerZ; // Segmen pagar ini berdiri kokoh, gunakan Space untuk melompati!
    }

    if (nextZ > rowToZ(0)) {
      // Di area hutan belakang yang sudah ditebang, player bebas bergerak
      playerX = nextX;
      playerZ = nextZ;
    } else {
      let targetCol = Math.max(0, Math.min(GRID_COLS - 1, xToCol(nextX)));
      let targetRow = Math.max(0, Math.min(GRID_ROWS - 1, zToRow(nextZ)));
      
      // Saat melompat dengan Space, lewati hambatan grid
      if (jumpingOver || (grid[targetRow] && grid[targetRow][targetCol] === null)) {
        playerX = nextX;
        playerZ = nextZ;
      } else {
        if (grid[zToRow(playerZ)] && grid[zToRow(playerZ)][targetCol] === null) playerX = nextX;
        if (grid[targetRow] && grid[targetRow][xToCol(playerX)] === null) playerZ = nextZ;
      }
    }
  }

  if (playerCharacterModel) {
    playerCharacterModel.position.set(playerX, (playerCharacterModel.userData.baseOffsetY || 0) + (playerY - CAMERA_HEIGHT), playerZ);
    let targetRotY = cameraYaw + Math.PI;
    if (moveBackward && !moveForward) {
      if (moveLeft && !moveRight) targetRotY = cameraYaw + Math.PI * 0.25;
      else if (moveRight && !moveLeft) targetRotY = cameraYaw - Math.PI * 0.25;
      else targetRotY = cameraYaw; // Mundur menghadap kamera (terlihat wajah saat mundur ke base)
    } else if (moveForward && !moveBackward) {
      if (moveLeft && !moveRight) targetRotY = cameraYaw + Math.PI * 0.75;
      else if (moveRight && !moveLeft) targetRotY = cameraYaw + Math.PI * 1.25;
      else targetRotY = cameraYaw + Math.PI; // Maju menghadap depan (terlihat punggung)
    } else if (moveLeft && !moveRight) {
      targetRotY = cameraYaw + Math.PI * 0.5;
    } else if (moveRight && !moveLeft) {
      targetRotY = cameraYaw - Math.PI * 0.5;
    }
    playerCharacterModel.rotation.y = targetRotY;

    let state = 'idle';
    if (activeWeaponSlot === 2 && isAttackingMelee) {
      state = 'knife';
    } else if (moveForward || moveBackward || moveLeft || moveRight) {
      state = keysPressed['SHIFT'] ? 'run' : 'walk';
    } else if (activeWeaponSlot === 1) {
      state = 'rifle';
    } else if (activeWeaponSlot === 2) {
      state = 'knife';
    }

    if (typeof applyCharacterSkeletalAnimation === 'function') {
      applyCharacterSkeletalAnimation(playerCharacterModel, playerBones, playerInitialRot, state, gameTick, null, null);
    }
  }

  if (isFirstPerson) {
    camera.position.set(playerX, playerY, playerZ);
    if (pistolGroup) pistolGroup.visible = (activeWeaponSlot === 1 && !isSniperScoped);
    if (knifeGroup) knifeGroup.visible = (activeWeaponSlot === 2);
  } else {
    const dist = 3.5;
    const heightOffset = 0.5;
    camera.position.set(
      playerX + Math.sin(cameraYaw) * dist,
      playerY + heightOffset,
      playerZ + Math.cos(cameraYaw) * dist
    );
    if (pistolGroup) pistolGroup.visible = false;
    if (knifeGroup) knifeGroup.visible = false;
  }
}

function buildSciFiTurretTower() {
  const group = new THREE.Group();
  add4GridBlackFoundation(group);

  // 1. Heavy Armored Base Pedestal
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.8, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.4;
  group.add(base);

  // Neon Energy Ring on base
  const ringGeo = new THREE.TorusGeometry(1.1, 0.06, 8, 24);
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const ring = new THREE.Mesh(ringGeo, neonMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.82;
  group.add(ring);

  // 2. Tall Reinforced Tower Pillar (Tinggi menjulang melampaui pagar 2.4m)
  const pillarGeo = new THREE.CylinderGeometry(0.65, 0.85, 2.6, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 2.1;
  group.add(pillar);

  // Vertical Glowing Energy Strips on Pillar
  for (let i = 0; i < 4; i++) {
    const stripGeo = new THREE.BoxGeometry(0.12, 2.4, 0.12);
    const strip = new THREE.Mesh(stripGeo, neonMat);
    const angle = (i * Math.PI) / 2;
    strip.position.set(Math.cos(angle) * 0.7, 2.1, Math.sin(angle) * 0.7);
    group.add(strip);
  }

  // 3. Elevated Rotating Turret Head Platform (y = 3.6, jauh di atas pagar!)
  const turretHead = new THREE.Group();
  turretHead.position.y = 3.6;

  // Hydraulic Neck Pivot
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.5, 8), baseMat);
  neck.position.y = -0.15;
  turretHead.add(neck);

  // Main Armored Chassis
  const chassisGeo = new THREE.BoxGeometry(1.4, 0.8, 1.6);
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.3 });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.3;
  turretHead.add(chassis);

  // Glowing Armor Side Panels
  const panelGeo = new THREE.BoxGeometry(1.46, 0.35, 1.3);
  const panel = new THREE.Mesh(panelGeo, neonMat);
  panel.position.y = 0.3;
  turretHead.add(panel);

  // 4. Twin Heavy Railgun Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.8, 8);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });

  const leftBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  leftBarrel.rotation.x = Math.PI / 2;
  leftBarrel.position.set(-0.4, 0.3, -1.1);
  turretHead.add(leftBarrel);

  const rightBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  rightBarrel.rotation.x = Math.PI / 2;
  rightBarrel.position.set(0.4, 0.3, -1.1);
  turretHead.add(rightBarrel);

  // Muzzle Energy Tips
  const tipGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 8);
  const leftTip = new THREE.Mesh(tipGeo, neonMat);
  leftTip.rotation.x = Math.PI / 2;
  leftTip.position.set(-0.4, 0.3, -2.1);
  turretHead.add(leftTip);

  const rightTip = new THREE.Mesh(tipGeo, neonMat);
  rightTip.rotation.x = Math.PI / 2;
  rightTip.position.set(0.4, 0.3, -2.1);
  turretHead.add(rightTip);

  // 5. Top Radar & Targeting Dish
  const radarGeo = new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const radar = new THREE.Mesh(radarGeo, neonMat);
  radar.position.set(0, 0.75, 0.1);
  turretHead.add(radar);

  group.add(turretHead);
  // Biarkan skala penuh 1:1 agar tegak menjulang melampaui pagar
  return { group: group, head: turretHead };
}

function checkAndPayWithGemConversion(goldCost) {
  if (gold >= goldCost) {
    gold -= goldCost;
    localStorage.setItem('outpost_gold', gold);
    updateHUD();
    return true;
  }
  const missingGold = Math.ceil(goldCost - gold);
  const neededGems = Math.ceil(missingGold / 18);
  if (gems >= neededGems) {
    if (confirm(`⚠️ Gold tidak cukup (kurang ${missingGold} Gold).\nKonversi otomatis ${neededGems} Permata 💎 (setara ${neededGems * 18} Gold) untuk melanjutkan pembangunan?`)) {
      gems -= neededGems;
      gold = 0;
      localStorage.setItem('outpost_gems', gems);
      localStorage.setItem('outpost_gold', gold);
      updateHUD();
      return true;
    }
  } else {
    alert(`⚠️ Gold dan Permata Tidak Cukup!\nAnda butuh ${goldCost} Gold (kurang ${missingGold} Gold). Jika dikonversi membutuhkan ${neededGems} 💎, namun Anda hanya memiliki ${gems} 💎.`);
  }
  return false;
}

function tryBuildTowerAt(x, z) {
  if (towers.length >= 1) {
    alert('⚠️ Batas Pembangunan: Anda hanya bisa memiliki maksimal 1 Turret di Pos saat ini!');
    return;
  }
  if (builderBarracksLvl < 1) {
    alert('⚠️ Syarat Prasyarat: Membangun Turret Level 1 mengharuskan adanya Barak Tukang Level 1!');
    return;
  }
  if (!checkAndPayWithGemConversion(100)) return;

  const col = xToCol(x);
  const row = zToRow(z);
  const tObj = buildSciFiTurretTower();
  tObj.group.position.set(x, 0, z);
  scene.add(tObj.group);

  const newTower = { col: col, row: row, lvl: 1, hp: 50, mesh: tObj.group, head: tObj.head };
  towers.push(newTower);
  if (grid[row]) grid[row][col] = newTower;
  
  turretBuilt = true;
  turretSavedLvl = 1;
  BUILDING_POSITIONS['turret'] = { x: x, z: z };
  localStorage.setItem('outpost_building_positions', JSON.stringify(BUILDING_POSITIONS));
  localStorage.setItem('outpost_turret_built', 'true');
  localStorage.setItem('outpost_turret_lvl', '1');
  
  updateHUD();
  alert('🚀 Turret Railgun Level 1 berhasil dibangun di Tile Kolom ' + col + '!');
}

function tryBuildTower() {
  if (towers.length >= 1) {
    alert('⚠️ Batas Pembangunan: Anda hanya bisa memiliki maksimal 1 Turret di Pos saat ini!');
    return;
  }
  if (builderBarracksLvl < 1) {
    alert('⚠️ Syarat Prasyarat: Membangun Turret Level 1 mengharuskan adanya Barak Tukang Level 1!');
    return;
  }
  startBuildingPlacement('turret');
}

function tryBuildTechLab(isNPC = false) {
  if (techLabLvl === 0 && builderBarracksLvl < 1) {
    if (!isNPC) alert('⚠️ Syarat Prasyarat: Membangun Riset Teknologi Level 1 mengharuskan adanya Barak Tukang Level 1!'); return;
  }
  if (techLabLvl >= 1) {
    if (!checkUniversalUpgradeRequirements('tech', techLabLvl + 1, isNPC)) return;
  }

  const cost = Math.floor(500 * Math.pow(1.5, techLabLvl));
  if (woodCount < 10) {
    if (!isNPC) alert(`⚠️ Kayu Kurang! Butuh 10 Kayu (Anda punya ${woodCount} 🪵).`);
    return;
  }
  if (!checkAndPayWithGemConversion(cost, isNPC)) return;

  woodCount -= 10;
  techLabBuilt = true;
  techLabLvl++;
  localStorage.setItem('outpost_tech_lab', 'true');
  localStorage.setItem('outpost_tech_lvl', techLabLvl);
  localStorage.setItem('outpost_wood', woodCount);
  buildTechLabMesh();
  updateHUD();
  if (!isNPC) alert(`🔬 Riset Teknologi Quantum berhasil dibangun/ditingkatkan ke Level ${techLabLvl}!`);
}

function tryBuildBuilderBarracks(isNPC = false) {
  if (builderBarracksLvl >= 1) {
    if (!checkUniversalUpgradeRequirements('builder_barrack', builderBarracksLvl + 1, isNPC)) return;
  }

  const cost = Math.floor(300 * Math.pow(1.5, builderBarracksLvl));
  if (woodCount < 10 || stoneCount < 10) {
    if (!isNPC) alert(`⚠️ Bahan Kurang! Membangun/Upgrade Barak Tukang membutuhkan 10 Kayu & 10 Batu (Anda punya ${woodCount} 🪵 dan ${stoneCount} 🪨).`);
    return;
  }
  if (!checkAndPayWithGemConversion(cost, isNPC)) return;

  woodCount -= 10;
  stoneCount -= 10;
  builderBarracksLvl++;
  if (builderBarracksLvl === 1) {
    builderIdleTimer = 300;
    isBuilderActive = false;
    localStorage.setItem('outpost_builder_active', 'false');
  }
  localStorage.setItem('outpost_builder_barracks_lvl', builderBarracksLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  buildBuilderBarracksMesh();
  updateHUD();
  if (!isNPC) {
    if (builderBarracksLvl === 1) {
      alert(`🔨 Barak Tukang berhasil dibangun ke Level 1!\n\n💡 INFO PENTING:\nTukang saat ini dalam posisi STANDBY (Nonaktif di Barak).\nUntuk mengaktifkannya bekerja, berdiri 1 tile di sebelah Barak Tukang, arahkan kursor penargetan ke arah barak, lalu tekan tombol [I]!`);
    } else {
      alert(`🔨 Barak Tukang berhasil ditingkatkan ke Level ${builderBarracksLvl}!`);
    }
  }
}

function tryBuildLumberjackBarracks(isNPC = false) {
  if (lumberjackBarracksLvl === 0 && techLabLvl < 1) {
    if (!isNPC) alert('⚠️ Syarat Prasyarat: Membangun Barak Penebang Level 1 mengharuskan adanya Riset Teknologi Level 1!'); return;
  }
  if (lumberjackBarracksLvl >= 1) {
    if (!checkUniversalUpgradeRequirements('lumberjack', lumberjackBarracksLvl + 1, isNPC)) return;
  }

  const cost = Math.floor(350 * Math.pow(1.5, lumberjackBarracksLvl));
  const needWood = 15 + lumberjackBarracksLvl * 5;
  const needStone = 5 + lumberjackBarracksLvl * 5;
  const needIron = 10 + lumberjackBarracksLvl * 5;
  if (woodCount < needWood || stoneCount < needStone || ironCount < needIron) {
    if (!isNPC) alert(`⚠️ Bahan Kurang! Butuh ${needWood} 🪵, ${needStone} 🪨, ${needIron} ⚙️`); return;
  }
  if (!checkAndPayWithGemConversion(cost, isNPC)) return;
  woodCount -= needWood; stoneCount -= needStone; ironCount -= needIron;
  lumberjackBarracksLvl++;
  if (lumberjackBarracksLvl === 1) {
    isLumberjackActive = false;
    localStorage.setItem('outpost_lumberjack_active', 'false');
  }
  localStorage.setItem('outpost_lumberjack_lvl', lumberjackBarracksLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_iron', ironCount);
  buildLumberjackBarracksMesh();
  updateHUD();
  if (!isNPC) {
    if (lumberjackBarracksLvl === 1) {
      alert(`🪓 Barak Penebang berhasil dibangun ke Level 1!\n\n💡 INFO PENTING:\nPenebang saat ini dalam posisi STANDBY (Nonaktif di Barak).\nUntuk mengaktifkannya menebang pohon, berdiri 1 tile di sebelah Barak Penebang, arahkan kursor penargetan ke arah barak, lalu tekan tombol [I]!`);
    } else {
      alert(`🪓 Barak Penebang berhasil ditingkatkan ke Level ${lumberjackBarracksLvl}!`);
    }
  }
}

function tryBuildMinerBarracks(isNPC = false) {
  if (minerBarracksLvl === 0 && techLabLvl < 1) {
    if (!isNPC) alert('⚠️ Syarat Prasyarat: Membangun Barak Penambang Level 1 mengharuskan adanya Riset Teknologi Level 1!'); return;
  }
  if (minerBarracksLvl >= 1) {
    if (!checkUniversalUpgradeRequirements('miner', minerBarracksLvl + 1, isNPC)) return;
  }

  const cost = Math.floor(400 * Math.pow(1.5, minerBarracksLvl));
  const needWood = 20 + minerBarracksLvl * 5;
  const needStone = 15 + minerBarracksLvl * 5;
  const needIron = 15 + minerBarracksLvl * 5;
  const needSoil = 10 + minerBarracksLvl * 5;
  if (woodCount < needWood || stoneCount < needStone || ironCount < needIron || soilCount < needSoil) {
    if (!isNPC) alert(`⚠️ Bahan Kurang! Butuh ${needWood} 🪵, ${needStone} 🪨, ${needIron} ⚙️, ${needSoil} 🟤`); return;
  }
  if (!checkAndPayWithGemConversion(cost, isNPC)) return;
  woodCount -= needWood; stoneCount -= needStone; ironCount -= needIron; soilCount -= needSoil;
  minerBarracksLvl++;
  localStorage.setItem('outpost_miner_lvl', minerBarracksLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_iron', ironCount);
  localStorage.setItem('outpost_soil', soilCount);
  buildMinerBarracksMesh();
  updateHUD();
  if (!isNPC) alert(`⛏️ Barak Penambang berhasil dibangun/ditingkatkan ke Level ${minerBarracksLvl}!`);
}

function tryBuildWeaponCrate(isNPC = false) {
  const reqBuilder = weaponCrateLvl + 1;
  if (builderBarracksLvl < reqBuilder) {
    if (!isNPC) alert(`⚠️ Syarat Prasyarat: Membangun/Meningkatkan Peti Senjata Level ${reqBuilder} mengharuskan adanya Barak Tukang Level ${reqBuilder}! (Saat ini Barak Tukang Lv ${builderBarracksLvl})`); return;
  }
  if (weaponCrateLvl >= 1) {
    if (!checkUniversalUpgradeRequirements('weapon_crate', weaponCrateLvl + 1, isNPC)) return;
  }

  const cost = 1000 * (weaponCrateLvl + 1);
  if (!checkAndPayWithGemConversion(cost, isNPC)) return;
  weaponCrateLvl++;
  localStorage.setItem('outpost_weapon_crate_lvl', weaponCrateLvl);
  buildWeaponCrateMesh();
  updateHUD();
  if (!isNPC) alert(`📦 Peti Senjata berhasil dibangun/ditingkatkan ke Level ${weaponCrateLvl}!`);
}

function checkUniversalUpgradeRequirements(targetType, targetLvl, isNPC = false) {
  if (targetLvl <= 1) return true;
  const reqLvl = targetLvl - 1;
  const reqBuilderLvl = (targetLvl === 3) ? 2 : Math.max(1, targetLvl - 2);

  const buildings = [
    { type: 'wall', name: 'Pagar Barikade', lvl: wallLvl },
    { type: 'turret', name: 'Turret Railgun', lvl: towers.length > 0 ? towers[0].lvl : 0 },
    { type: 'tech', name: 'Riset Teknologi', lvl: techLabLvl },
    { type: 'lumberjack', name: 'Barak Penebang', lvl: lumberjackBarracksLvl },
    { type: 'miner', name: 'Barak Penambang', lvl: minerBarracksLvl },
    { type: 'weapon_crate', name: 'Peti Senjata', lvl: weaponCrateLvl },
    { type: 'stone', name: 'Core Stone Monolith', lvl: stoneLvl },
    { type: 'builder_barrack', name: 'Barak Tukang', lvl: builderBarracksLvl }
  ];

  for (let b of buildings) {
    if (b.type === targetType) continue;
    if (b.type === 'builder_barrack') {
      const neededBuilder = (targetType === 'weapon_crate') ? targetLvl : reqBuilderLvl;
      if (b.lvl < neededBuilder) {
        if (!isNPC) alert(`🔒 SYARAT UPGRADE KE LEVEL ${targetLvl}:\nAnda harus membuka/meningkatkan ${b.name} minimal ke Level ${neededBuilder} terlebih dahulu (Saat ini Lv ${b.lvl})!`);
        return false;
      }
    } else {
      if (b.lvl < reqLvl) {
        if (!isNPC) alert(`🔒 SYARAT UPGRADE KE LEVEL ${targetLvl}:\nSesuai aturan keseimbangan pangkalan, Anda harus meningkatkan semua bangunan lain termasuk ${b.name} minimal ke Level ${reqLvl} terlebih dahulu (Saat ini ${b.name} masih Lv ${b.lvl})!`);
        return false;
      }
    }
  }
  return true;
}

function tryUpgradeCoreStone(isNPC = false) {
  const nextLvl = stoneLvl + 1;
  if (!checkUniversalUpgradeRequirements('stone', nextLvl, isNPC)) return;

  const cost = Math.floor(500 * Math.pow(1.5, stoneLvl - 1));
  if (isNPC) {
    if (gold < cost) return;
    gold -= cost;
    localStorage.setItem('outpost_gold', Math.floor(gold));
    updateHUD();
  } else {
    if (!checkAndPayWithGemConversion(cost, isNPC)) return;
  }

  stoneLvl = nextLvl;
  stoneMaxHp = 200 + (stoneLvl - 1) * 100;
  stoneHp = stoneMaxHp;
  localStorage.setItem('outpost_stone_lvl', stoneLvl);
  updateHUD();
  if (!isNPC) alert(`💎 Core Stone Monolith berhasil ditingkatkan ke Level ${stoneLvl}! Kapasitas nyawa pangkalan meningkat menjadi ${stoneMaxHp} HP!`);
}


function tryProximityUpgrade() {
  // Raycast kursor penargetan dari kamera ke arah objek 1 grid di depan
  const raycaster = new THREE.Raycaster();
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  raycaster.set(camera.position, dir);

  let targetHit = null;
  let targetType = '';

  // 1. Cek Turret
  if (towers.length > 0) {
    const hits = raycaster.intersectObject(towers[0].mesh, true);
    if (hits.length > 0 && hits[0].distance < 4.5) {
      targetHit = towers[0];
      targetType = 'turret';
    }
  }

  // 2. Cek Riset Teknologi & Barak-barak & Core Stone
  if (!targetHit && techLabMesh) {
    const hits = raycaster.intersectObject(techLabMesh, true);
    if (hits.length > 0 && hits[0].distance < 4.5) { tryBuildTechLab(false); return; }
  }
  if (!targetHit && builderBarracksMesh) {
    const hits = raycaster.intersectObject(builderBarracksMesh, true);
    if (hits.length > 0 && hits[0].distance < 4.5) { tryBuildBuilderBarracks(false); return; }
  }
  if (!targetHit && lumberjackBarracksMesh) {
    const hits = raycaster.intersectObject(lumberjackBarracksMesh, true);
    if (hits.length > 0 && hits[0].distance < 4.5) { tryBuildLumberjackBarracks(false); return; }
  }
  if (!targetHit && minerBarracksMesh) {
    const hits = raycaster.intersectObject(minerBarracksMesh, true);
    if (hits.length > 0 && hits[0].distance < 4.5) { tryBuildMinerBarracks(false); return; }
  }
  if (!targetHit && stoneMesh) {
    const hits = raycaster.intersectObject(stoneMesh, true);
    if (hits.length > 0 && hits[0].distance < 4.5) { tryUpgradeCoreStone(false); return; }
  }

  // 3. Cek Pagar Pertahanan
  if (!targetHit) {
    for (let log of fenceMeshes) {
      const hits = raycaster.intersectObject(log);
      if (hits.length > 0 && hits[0].distance < 4.5) {
        targetType = 'fence';
        break;
      }
    }
  }

  if (targetType === 'turret') {
    let t = targetHit;
    const turretCost = Math.floor(100 * Math.pow(1.5, t.lvl));
    if (!checkUniversalUpgradeRequirements('turret', t.lvl + 1, false)) return;
    if (!checkAndPayWithGemConversion(turretCost)) return;

    t.lvl++;
    updateHUD();
    alert(`🏗️ Turret berhasil ditingkatkan ke Level ${t.lvl}! Kerusakan naik 25% menjadi ${Math.floor(8 * Math.pow(1.25, t.lvl - 1))} per bulet!`);
    return;
  }

  if (targetType === 'fence') {
    const wallCost = Math.floor(250 * Math.pow(1.5, wallLvl - 1));
    if (!checkUniversalUpgradeRequirements('wall', wallLvl + 1, false)) return;
    if (!checkAndPayWithGemConversion(wallCost)) return;

    wallLvl++;
    fenceMaxHp = Math.floor(100 * Math.pow(1.25, wallLvl - 1));
    fenceHp = fenceMaxHp;
    buildBarricadeWall();
    localStorage.setItem('outpost_wall_lvl', wallLvl);
    updateHUD();
    alert(`🛡️ Pagar berhasil ditingkatkan ke Level ${wallLvl}! Nyawa Pagar naik 25% menjadi ${fenceMaxHp} HP!`);
    return;
  }

  alert('💡 Petunjuk Upgrade Presisi:\nArahkan tanda kursor (+) tepat ke objek yang berada 1 grid di depan Anda (Turret, Pagar, atau Riset Teknologi) lalu tekan tombol [U]!');
}

function buildFullHumanoidEnemy(isPatrol) {
  const g = new THREE.Group();
  const skinColor = isPatrol ? 0x991b1b : 0x15803d;
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
  const ragColor = isPatrol ? 0x1e1b4b : 0x1e293b;
  const ragMat = new THREE.MeshStandardMaterial({ color: ragColor, roughness: 0.7 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  // Articulated Spine/Torso group for Tripo kinematics
  const spine = new THREE.Group();
  spine.position.y = isPatrol ? 1.05 : 1.0;
  g.add(spine);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(isPatrol ? 0.6 : 0.56, isPatrol ? 0.7 : 0.65, isPatrol ? 0.36 : 0.32), skinMat);
  torso.position.y = 0.34;
  if (!isPatrol) torso.rotation.x = 0.18; // Leaning forward predatory stance for creeper
  spine.add(torso);

  if (isPatrol) {
    const coreSpikes = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.38), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    coreSpikes.position.y = 0.35;
    spine.add(coreSpikes);
  } else {
    const ribs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.33), new THREE.MeshStandardMaterial({ color: 0x7f1d1d }));
    ribs.position.y = 0.35;
    spine.add(ribs);
  }

  // Head & Features
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.7, isPatrol ? 0 : 0.08);
  spine.add(headGroup);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(isPatrol ? 0.42 : 0.38, isPatrol ? 0.42 : 0.4, isPatrol ? 0.42 : 0.38), skinMat);
  headMesh.position.y = 0.2;
  headGroup.add(headMesh);

  const eyeColor = isPatrol ? 0xfbbf24 : 0xef4444;
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: eyeColor }));
  eyeL.position.set(-0.1, 0.24, 0.2);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: eyeColor }));
  eyeR.position.set(0.1, 0.24, 0.2);
  headGroup.add(eyeR);

  if (isPatrol) {
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    hornL.rotation.x = 0.5; hornL.position.set(-0.15, 0.32, 0.15); headGroup.add(hornL);
    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    hornR.rotation.x = 0.5; hornR.position.set(0.15, 0.32, 0.15); headGroup.add(hornR);
  }

  // Limbs
  const lArm = new THREE.Group(); lArm.position.set(isPatrol ? -0.38 : -0.35, 0.58, 0); spine.add(lArm);
  lArm.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.65, 0.15), skinMat));
  const rArm = new THREE.Group(); rArm.position.set(isPatrol ? 0.38 : 0.35, 0.58, 0); spine.add(rArm);
  rArm.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.65, 0.15), skinMat));

  const lLeg = new THREE.Group(); lLeg.position.set(-0.18, isPatrol ? 1.05 : 1.0, 0); g.add(lLeg);
  lLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.18), ragMat));
  const rLeg = new THREE.Group(); rLeg.position.set(0.18, isPatrol ? 1.05 : 1.0, 0); g.add(rLeg);
  rLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.18), ragMat));

  // 3D Floating HP Bar Above Head
  const hpBarGroup = new THREE.Group();
  hpBarGroup.position.y = 2.5;
  const bgBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: 0x111827 }));
  hpBarGroup.add(bgBar);
  const fillBar = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
  fillBar.position.z = 0.01;
  hpBarGroup.add(fillBar);
  g.add(hpBarGroup);
  g.userData = { hpBarFill: fillBar, hpBarGroup: hpBarGroup, spine: spine, head: headGroup, lArm: lArm, rArm: rArm, lLeg: lLeg, rLeg: rLeg };

  return g;
}

function spawnLootWood() {
  const randRow = FENCE_ROW + 2 + Math.floor(Math.random() * (GRID_ROWS - FENCE_ROW - 6)); // Hanya muncul di area kedatangan musuh
  const randCol = 2 + Math.floor(Math.random() * (GRID_COLS - 4)); // Kolom 2 sampai 15 (di luar area pohon kiri/kanan)
  const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(colToX(randCol), 0.3, rowToZ(randRow));
  scene.add(mesh);
  woodItems.push({ mesh: mesh, col: randCol, row: randRow });
}

function spawnEnemy(isPatrol = false) {
  const spawnCol = 2 + Math.floor(Math.random() * (GRID_COLS - 4));
  const spawnRow = isPatrol ? (FENCE_ROW + 3 + Math.floor(Math.random() * (GRID_ROWS - FENCE_ROW - 8))) : (GRID_ROWS - 2);
  const hp = 50; // Nyawa musuh tepat 50 HP

  const eMesh = buildFullHumanoidEnemy(isPatrol);
  eMesh.position.set(colToX(spawnCol), 0, rowToZ(spawnRow));
  scene.add(eMesh);

  enemies.push({
    mesh: eMesh, hp: hp, maxHp: hp, speed: isPatrol ? 0 : 0.032,
    row: spawnRow, isPatrol: isPatrol, vx: (Math.random() > 0.5 ? 0.03 : -0.03)
  });
}

function executeAutoUpgradeFence() {
  const wallCost = Math.floor(250 * Math.pow(1.5, wallLvl - 1));
  if (!checkUniversalUpgradeRequirements('wall', wallLvl + 1, true)) return;
  if (gold < wallCost) return;
  gold -= wallCost;
  wallLvl++;
  fenceMaxHp = Math.floor(100 * Math.pow(1.25, wallLvl - 1));
  fenceHp = fenceMaxHp;
  buildBarricadeWall();
  localStorage.setItem('outpost_wall_lvl', wallLvl);
  localStorage.setItem('outpost_gold', Math.floor(gold));
  updateHUD();
}

function executeAutoUpgradeTower() {
  if (towers.length === 0) return;
  let t = towers[0];
  const turretCost = Math.floor(100 * Math.pow(1.5, t.lvl));
  if (!checkUniversalUpgradeRequirements('turret', t.lvl + 1, true)) return;
  if (gold < turretCost) return;
  gold -= turretCost;
  t.lvl++;
  turretBuilt = true;
  turretSavedLvl = t.lvl;
  localStorage.setItem('outpost_gold', Math.floor(gold));
  localStorage.setItem('outpost_turret_built', 'true');
  localStorage.setItem('outpost_turret_lvl', t.lvl);
  updateHUD();
}

function updateFloatingBuildProgress(title, pct, remSec, objX, objY, objZ) {
  const badge = document.getElementById('floating-build-badge');
  if (!badge) return;
  badge.style.display = 'block';
  document.getElementById('build-badge-title').innerText = '🔨 MEMBANGUN ' + title;
  document.getElementById('build-badge-bar').style.width = pct + '%';
  document.getElementById('build-badge-time').innerText = remSec + 's';
  document.getElementById('build-badge-pct').innerText = pct + '%';

  const vec = new THREE.Vector3(objX, objY, objZ);
  vec.project(camera);
  const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vec.y * 0.5) + 0.5) * window.innerHeight;
  if (vec.z > 1.0) {
    badge.style.display = 'none';
  } else {
    badge.style.left = x + 'px';
    badge.style.top = y + 'px';
  }
}

function hideFloatingBuildProgress() {
  const badge = document.getElementById('floating-build-badge');
  if (badge) badge.style.display = 'none';
}

function separateWorkers() {
  const entities = [];
  if (builderMesh && builderBarracksLvl > 0) entities.push(builderMesh.position);
  if (lumberjackMesh && lumberjackBarracksLvl > 0) entities.push(lumberjackMesh.position);
  if (minerMesh && minerBarracksLvl > 0) entities.push(minerMesh.position);

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const dx = entities[i].x - entities[j].x;
      const dz = entities[i].z - entities[j].z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.4 && dist > 0.001) {
        const overlap = (1.4 - dist) * 0.5;
        const nx = dx / dist;
        const nz = dz / dist;
        entities[i].x += nx * overlap;
        entities[i].z += nz * overlap;
        entities[j].x -= nx * overlap;
        entities[j].z -= nz * overlap;
      }
    }
  }
}

function updateBuildingPlacement() {
  if (placingBuildingType && placingHologramMesh && placingHologramMesh.visible && camera) {
    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);
    const targetX = Math.round((camera.position.x - 10 * sinY) / 4.0) * 4.0;
    const targetZ = Math.round((camera.position.z - 10 * cosY) / 4.0) * 4.0;
    placingHologramMesh.position.set(targetX, 1.75, targetZ);

    let isValid = true;
    if (targetZ < rowToZ(FENCE_ROW - 2) || targetX < colToX(3) || targetX > colToX(14)) isValid = false;
    for (let key in BUILDING_POSITIONS) {
      if (isRelocatingBuilding && key === placingBuildingType) continue;
      const p = BUILDING_POSITIONS[key];
      if (p && Math.hypot(targetX - p.x, targetZ - p.z) < 3.8) { isValid = false; break; }
    }
    for (let t of towers) {
      if (isRelocatingBuilding && placingBuildingType === 'turret' && t === relocatingTowerObj) continue;
      if (t.mesh && Math.hypot(targetX - t.mesh.position.x, targetZ - t.mesh.position.z) < 3.8) { isValid = false; break; }
    }
    for (let t of forestTrees) {
      if (t.group && !t.chopped && Math.hypot(targetX - t.x, targetZ - t.z) < 3.8) { isValid = false; break; }
    }
    placingHologramMesh.material.color.setHex(isValid ? 0x22c55e : 0xef4444);
    placingHologramMesh.isValidPlacement = isValid;
  }
}

function loop() {
  if (!gameRunning) {
    if (camera && renderer && scene) {
      cameraYaw += 0.002;
      camera.rotation.set(0, cameraYaw, 0, 'YXZ');
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
    return;
  }
  gameTick++;

  updateBuildingPlacement();

  if (techLabRadarRing) techLabRadarRing.rotation.z += 0.04;
  if (weaponCrateHoloGun) weaponCrateHoloGun.rotation.y += 0.03;
  // === NPC TUKANG AI (Builder NPC) ===
  if (builderBarracksLvl > 0 && builderMesh) {
    const builderSpeed = 1.0 + (builderBarracksLvl - 1) * 0.1;
    // Auto-repair fence segments
    if (gameTick % 15 === 0) {
      fences.forEach(f => {
        if (f.hp < fenceMaxHp) {
          f.hp = Math.min(fenceMaxHp, f.hp + 1.5 * builderBarracksLvl);
          if (f.hp > 0 && !f.mesh) buildBarricadeWall();
        }
      });
      updateHUD();
    }

    if (!isBuilderActive) {
      if (builderTarget) {
        builderTarget = null;
        if (typeof hideFloatingBuildProgress === 'function') hideFloatingBuildProgress();
      }
      const bPos = getBuildingPos('builder_barrack');
      if (bPos) {
        const targetX = bPos.x - 0.6;
        const targetZ = bPos.z + 1.2;
        const dx = targetX - builderMesh.position.x;
        const dz = targetZ - builderMesh.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.3) {
          const moveSpeed = 0.06 * builderSpeed;
          builderMesh.position.x += (dx / dist) * moveSpeed;
          builderMesh.position.z += (dz / dist) * moveSpeed;
          builderMesh.rotation.y = Math.atan2(dx, dz);
          if (builderMesh.children[1]) builderMesh.children[1].rotation.x = Math.sin(gameTick * 0.2) * 0.4;
          if (builderMesh.children[2]) builderMesh.children[2].rotation.x = -Math.sin(gameTick * 0.2) * 0.4;
        } else {
          builderMesh.rotation.y = 0;
          if (builderHammerGroup) builderHammerGroup.rotation.z = Math.sin(gameTick * 0.05) * 0.1;
          if (builderMesh.children[1]) builderMesh.children[1].rotation.x = 0;
          if (builderMesh.children[2]) builderMesh.children[2].rotation.x = 0;
        }
      }
      if (typeof hideFloatingBuildProgress === 'function') hideFloatingBuildProgress();
    } else if (builderIdleTimer > 0) {
      builderIdleTimer--;
      if (builderHammerGroup) builderHammerGroup.rotation.z = Math.sin(gameTick * 0.05) * 0.1;
      if (builderMesh.children[1]) builderMesh.children[1].rotation.x = 0;
      if (builderMesh.children[2]) builderMesh.children[2].rotation.x = 0;
      hideFloatingBuildProgress();
    } else {
      // Cari tugas bangun/upgrade dengan harga terendah jika belum ada tugas aktif (Hanya daftar di shortcut B)
      if (!builderTarget && gameTick % 30 === 0 && builderBarracksLvl > 0) {
        const plan = getBuilderPlanList();
        const affordable = plan.bisaDikerjakan.filter(item => item.canAfford);
        if (affordable.length > 0) {
          if (affordable[0].manualOnly) {
            const nextAuto = affordable.find(item => !item.manualOnly);
            if (nextAuto) {
              builderTarget = nextAuto;
              builderTarget.timer = 0;
            } else {
              toggleBuilderActiveState(false, true);
              if (typeof createFloatingText === 'function' && builderMesh) {
                createFloatingText("🛑 Tukang selesai! Kembali ke Barak (Barak Tukang & Core Stone harus manual oleh Player)", builderMesh.position.x, 3.5, builderMesh.position.z, '#fbbf24');
              }
            }
          } else {
            builderTarget = affordable[0];
            builderTarget.timer = 0;
          }
        }
      }

      if (builderTarget) {
        const dx = builderTarget.x - builderMesh.position.x;
        const dz = builderTarget.z - builderMesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 3.2) { // Berhenti tepat di grid bersebelahan (4 grid area width = 5.0)
          const moveSpeed = 0.06 * builderSpeed;
          builderMesh.position.x += (dx / dist) * moveSpeed;
          builderMesh.position.z += (dz / dist) * moveSpeed;
          builderMesh.rotation.y = Math.atan2(dx, dz);
          // Jalan animasi kaki
          if (builderMesh.children[1]) builderMesh.children[1].rotation.x = Math.sin(gameTick * 0.2) * 0.4;
          if (builderMesh.children[2]) builderMesh.children[2].rotation.x = -Math.sin(gameTick * 0.2) * 0.4;
          hideFloatingBuildProgress();
        } else {
          builderMesh.rotation.y = Math.atan2(dx, dz);
          if (builderHammerGroup) builderHammerGroup.rotation.z = Math.sin(gameTick * 0.25) * 0.6;
          builderTarget.timer++;
          const baseSec = builderTarget.estSec || (builderTarget.isNew ? 5 : 10 * Math.pow(1.5, builderTarget.lvl - 2));
          const requiredTicks = Math.floor((baseSec * 60) / builderSpeed);
          const pct = Math.min(100, Math.floor((builderTarget.timer / requiredTicks) * 100));
          const remSecStr = formatDuration((requiredTicks - builderTarget.timer) / 60);
          updateFloatingBuildProgress(builderTarget.name, pct, remSecStr, builderTarget.x, 3.8, builderTarget.z);
          if (builderTarget.timer >= requiredTicks) {
            if (typeof builderTarget.execute === 'function') builderTarget.execute();
            builderTarget = null;
            builderIdleTimer = 300; // Jeda 5 detik sebelum membangun/upgrade berikutnya!
            hideFloatingBuildProgress();
          }
        }
      } else {
        if (builderHammerGroup) builderHammerGroup.rotation.z = Math.sin(gameTick * 0.1) * 0.2;
        if (builderMesh.children[1]) builderMesh.children[1].rotation.x = 0;
        if (builderMesh.children[2]) builderMesh.children[2].rotation.x = 0;
        hideFloatingBuildProgress();
      }
    }
  } else {
    hideFloatingBuildProgress();
  }

  // Pertumbuhan pasif 0.1 Gold / detik (+0.01 setiap 6 tick di 60 FPS)
  if (gameTick % 6 === 0) {
    gold += 0.01;
    updateHUD();
  }

  if (playerFireCooldown > 0) playerFireCooldown--;

  // === RELOAD TIMER COUNTDOWN (FIX STUCK RELOAD) ===
  if (isReloading && reloadTimer > 0) {
    reloadTimer--;
    if (gameTick % 6 === 0) updateHUD();
    if (reloadTimer <= 0) {
      const st = WEAPON_STATS[equippedRanged] || WEAPON_STATS.pistol;
      currentAmmo = st.ammoMax || 12;
      maxAmmo = currentAmmo;
      isReloading = false;
      reloadTimer = 0;
      updateHUD();
    }
  }

  // === NPC LUMBERJACK AI (Penebang Pohon berjalan & menebang) ===
  if (lumberjackBarracksLvl > 0 && lumberjackMesh) {
    const lumberjackSpeed = 1.0 + (lumberjackBarracksLvl - 1) * 0.1;

    if (!isLumberjackActive) {
      if (lumberjackTarget) {
        lumberjackTarget = null;
      }
      const bPos = getBuildingPos('lumberjack');
      if (bPos) {
        const targetX = bPos.x - 0.6;
        const targetZ = bPos.z + 1.2;
        const dx = targetX - lumberjackMesh.position.x;
        const dz = targetZ - lumberjackMesh.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.3) {
          const moveSpeed = 0.05 * lumberjackSpeed;
          lumberjackMesh.position.x += (dx / dist) * moveSpeed;
          lumberjackMesh.position.z += (dz / dist) * moveSpeed;
          lumberjackMesh.rotation.y = Math.atan2(dx, dz);
          if (lumberjackMesh.children[1]) lumberjackMesh.children[1].rotation.x = Math.sin(gameTick * 0.2) * 0.4;
          if (lumberjackMesh.children[2]) lumberjackMesh.children[2].rotation.x = -Math.sin(gameTick * 0.2) * 0.4;
        } else {
          lumberjackMesh.rotation.y = 0;
          if (lumberjackMesh.children[1]) lumberjackMesh.children[1].rotation.x = 0;
          if (lumberjackMesh.children[2]) lumberjackMesh.children[2].rotation.x = 0;
        }
      }
    } else if (!lumberjackTarget) {
      let nearestTree = null;
      let minD = Infinity;
      for (let t of forestTrees) {
        // Hanya tebang pohon di arah belakang core stone (row <= 0) dan bukan pohon batas kiri/kanan
        if (!t.chopped && t.group && t.row <= 0 && t.col >= 2 && t.col <= GRID_COLS - 3) {
          const d = Math.hypot(t.x - lumberjackMesh.position.x, t.z - lumberjackMesh.position.z);
          if (d < minD) { minD = d; nearestTree = t; }
        }
      }
      if (nearestTree) {
        lumberjackTarget = { tree: nearestTree, timer: 0 };
      } else {
        // Tidak ada lagi pohon (maksimal 35 pohon sudah selesai ditebang), kembali ke Barak Penebang!
        const bPos = getBuildingPos('lumberjack');
        const dx = bPos.x - lumberjackMesh.position.x;
        const dz = bPos.z - lumberjackMesh.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 1.5) {
          const moveSpeed = 0.05 * lumberjackSpeed;
          lumberjackMesh.position.x += (dx / dist) * moveSpeed;
          lumberjackMesh.position.z += (dz / dist) * moveSpeed;
          lumberjackMesh.rotation.y = Math.atan2(dx, dz);
          if (lumberjackMesh.children[1]) lumberjackMesh.children[1].rotation.x = Math.sin(gameTick * 0.2) * 0.4;
          if (lumberjackMesh.children[2]) lumberjackMesh.children[2].rotation.x = -Math.sin(gameTick * 0.2) * 0.4;
        } else {
          if (lumberjackMesh.children[1]) lumberjackMesh.children[1].rotation.x = 0;
          if (lumberjackMesh.children[2]) lumberjackMesh.children[2].rotation.x = 0;
        }
      }
    }

    if (lumberjackTarget && lumberjackTarget.tree && !lumberjackTarget.tree.chopped) {
      const dx = lumberjackTarget.tree.x - lumberjackMesh.position.x;
      const dz = lumberjackTarget.tree.z - lumberjackMesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 2.0) {
        const moveSpeed = 0.05 * lumberjackSpeed;
        lumberjackMesh.position.x += (dx / dist) * moveSpeed;
        lumberjackMesh.position.z += (dz / dist) * moveSpeed;
        lumberjackMesh.position.x = Math.max(colToX(2), Math.min(colToX(GRID_COLS - 2), lumberjackMesh.position.x));
        lumberjackMesh.rotation.y = Math.atan2(dx, dz);
        if (lumberjackMesh.children[1]) lumberjackMesh.children[1].rotation.x = Math.sin(gameTick * 0.2) * 0.4;
        if (lumberjackMesh.children[2]) lumberjackMesh.children[2].rotation.x = -Math.sin(gameTick * 0.2) * 0.4;
      } else {
        lumberjackMesh.rotation.y = Math.atan2(dx, dz);
        // Ayunkan kapak
        if (lumberjackMesh.children.length > 0) {
          const lastChild = lumberjackMesh.children[lumberjackMesh.children.length - 1];
          if (lastChild.isGroup) lastChild.rotation.z = Math.sin(gameTick * 0.2) * 0.6;
        }
        lumberjackTarget.timer++;
        const requiredTicks = Math.floor(1800 / lumberjackSpeed); // 30s base
        if (lumberjackTarget.timer >= requiredTicks) {
          if (lumberjackTarget.tree.group) scene.remove(lumberjackTarget.tree.group);
          lumberjackTarget.tree.chopped = true;
          if (lumberjackTarget.tree.id && !choppedTrees.includes(lumberjackTarget.tree.id)) {
            choppedTrees.push(lumberjackTarget.tree.id);
            localStorage.setItem('outpost_chopped_trees', JSON.stringify(choppedTrees));
          }
          clearedGridCount++;
          woodCount += 5;
          rubberCount += 3;
          localStorage.setItem('outpost_cleared_grids', clearedGridCount);
          localStorage.setItem('outpost_wood', woodCount);
          localStorage.setItem('outpost_rubber', rubberCount);
          // Tanah menjadi mulus seperti area pertahanan/musuh (tanpa garis wireframe hijau atau efek lain)
          updateHUD();
          lumberjackTarget = null;
        }
      }
    }
  }

  // === NPC MINER AI (Penambang Mineral) ===
  if (minerBarracksLvl > 0 && minerMesh) {
    const minerSpeed = 1.0 + (minerBarracksLvl - 1) * 0.1;
    minerTimer++;
    const mineInterval = Math.floor(600 / minerSpeed); // 10s base at 60fps
    if (minerTimer >= mineInterval) {
      minerTimer = 0;
      const roll = Math.random();
      if (roll < 0.45) { soilCount++; localStorage.setItem('outpost_soil', soilCount); }
      else if (roll < 0.75) { stoneCount++; localStorage.setItem('outpost_stone_res', stoneCount); }
      else if (roll < 0.90) { ironCount++; localStorage.setItem('outpost_iron', ironCount); }
      else { gold += 1; localStorage.setItem('outpost_gold', Math.floor(gold)); }
      updateHUD();
    }
    // Animate miner pickaxe
    if (minerMesh.children.length > 0) {
      const lastChild = minerMesh.children[minerMesh.children.length - 1];
      if (lastChild.isGroup) lastChild.rotation.z = Math.sin(gameTick * 0.15) * 0.55;
    }
  }

  separateWorkers();

  handleSmoothPlayerMovement();

  // Cek Looting Kayu di posisi pemain
  for (let i = woodItems.length - 1; i >= 0; i--) {
    let w = woodItems[i];
    if (Math.abs(xToCol(playerX) - w.col) <= 0.8 && Math.abs(zToRow(playerZ) - w.row) <= 0.8) {
      woodCount++;
      localStorage.setItem('outpost_wood', woodCount);
      scene.remove(w.mesh);
      woodItems.splice(i, 1);
      updateHUD();
    }
  }

  // Regular Spawn
  attackerSpawnTimer++;
  if (attackerSpawnTimer >= 1200) { spawnEnemy(false); attackerSpawnTimer = 0; }
  patrolSpawnTimer++;
  if (patrolSpawnTimer >= 3600) { spawnEnemy(true); patrolSpawnTimer = 0; }

  // Munculkan 1 Kayu setiap 1 menit (3600 tick)
  if (gameTick > 0 && gameTick % 3600 === 0) {
    spawnLootWood();
  }

  // 1. Setiap 5 Menit (18000 ticks di 60 FPS) Muncul 10 Musuh Serentak
  if (gameTick > 0 && gameTick % 18000 === 0) {
    for (let w = 0; w < 10; w++) spawnEnemy(false);
  }

  // 2. Setiap Jam 19:00 Malam Muncul 1800 Musuh dalam 1 Jam (1 musuh per 2 detik / 120 ticks)
  const nowHour = new Date().getHours();
  if ((nowHour === 19 || isSimulating1900) && gameTick % 120 === 0) {
    spawnEnemy(false);
  }

  // Tower tracking & shooting dengan peningkatan Atk Spd 25% per level & Jarak +70%
  towers.forEach(t => {
    let nearestEnemy = null;
    let minD = Infinity;
    const maxTurretDist = 20.4 * CELL_SIZE; // 20.4 tile (~40.8 units) dari posisi turet (+70%)
    for (let e of enemies) {
      let d = t.mesh.position.distanceTo(e.mesh.position);
      if (d < minD && d <= maxTurretDist) { minD = d; nearestEnemy = e; }
    }

    if (nearestEnemy && t.head) {
      const dx = nearestEnemy.mesh.position.x - t.mesh.position.x;
      const dz = nearestEnemy.mesh.position.z - t.mesh.position.z;
      t.head.rotation.y = Math.atan2(dx, dz) + Math.PI;
    } else if (t.head) {
      t.head.rotation.y += 0.015;
    }

    const tCooldown = Math.max(2, Math.floor(10 / Math.pow(1.25, t.lvl - 1)));
    if (gameTick % tCooldown === 0 && nearestEnemy) {
      const bGeo = new THREE.SphereGeometry(0.25);
      const bMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      
      const angle = t.head ? t.head.rotation.y : 0;
      // Posisi spawn proyektil tepat di ujung pipa laras railgun (Y=3.6) jauh di atas pagar
      bMesh.position.set(
        t.mesh.position.x + Math.sin(angle) * 1.6,
        3.6,
        t.mesh.position.z + Math.cos(angle) * 1.6
      );
      scene.add(bMesh);
      const targetPos = nearestEnemy.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
      const dir = targetPos.sub(bMesh.position).normalize().multiplyScalar(1.8);
      const tDmg = Math.floor(8 * Math.pow(1.25, t.lvl - 1));
      bullets.push({ mesh: bMesh, dir: dir, dmg: tDmg, startPos: bMesh.position.clone(), maxDist: maxTurretDist, isTurret: true });
    }
  });

  // Update bullets (termasuk efek gravitasi peluru manual dan turet)
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.mesh.position.add(b.dir);
    if (b.isGrenade) {
      b.dir.y -= 0.015; // Efek gravitasi melengkung untuk lemparan granat
    } else if (b.isPlayerBullet) {
      b.dir.y -= 0.016; // Efek gravitasi melengkung untuk peluru senjata manual
    } else if (b.isTurret) {
      b.dir.y -= 0.010; // Efek gravitasi melengkung dari atas pipa turet menuju musuh
    }

    if ((b.startPos && b.maxDist && b.mesh.position.distanceTo(b.startPos) > b.maxDist) || b.mesh.position.y <= 0) {
      if (b.isRudal) triggerAoEExplosion(b.mesh.position, 3.0, b.dmg, 0xff4500);
      else if (b.isGrenade) triggerAoEExplosion(b.mesh.position, 2.0, b.dmg, 0xfbbf24);
      scene.remove(b.mesh); bullets.splice(i, 1); continue;
    }
    if (b.mesh.position.z < -550 || b.mesh.position.z > 150 || b.mesh.position.x < -150 || b.mesh.position.x > 150) {
      scene.remove(b.mesh); bullets.splice(i, 1); continue;
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      let e = enemies[j];
      const dist3D = b.mesh.position.distanceTo(e.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
      const dist2D = Math.hypot(b.mesh.position.x - e.mesh.position.x, b.mesh.position.z - e.mesh.position.z);
      if (dist3D < 2.0 || dist2D < 1.6) {
        if (b.isRudal) {
          triggerAoEExplosion(b.mesh.position, 3.0, b.dmg, 0xff4500);
          scene.remove(b.mesh); bullets.splice(i, 1);
        } else if (b.isGrenade) {
          triggerAoEExplosion(b.mesh.position, 2.0, b.dmg, 0xfbbf24);
          scene.remove(b.mesh); bullets.splice(i, 1);
        } else {
          let finalDmg = b.dmg;
          if (b.mesh.position.y >= e.mesh.position.y + 1.2) {
            finalDmg *= 2; // 2x lipat kerusakan jika mengenai kepala musuh
            showFloatingLootText('💥 HEADSHOT x2!', e.mesh.position.x, e.mesh.position.y + 2.0, e.mesh.position.z, '#ef4444');
          }
          e.hp -= finalDmg;
          scene.remove(b.mesh); bullets.splice(i, 1);
          if (e.hp <= 0) {
            rewardEnemyKill(e);
            scene.remove(e.mesh); enemies.splice(j, 1);
          }
        }
        break;
      }
    }
  }

  // Update enemies & Floating HP Bar LookAt
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    
    if (e.mesh.userData && e.mesh.userData.hpBarGroup) {
      e.mesh.userData.hpBarGroup.lookAt(camera.position);
      const ratio = Math.max(0, e.hp / e.maxHp);
      if (e.mesh.userData.hpBarFill) {
        e.mesh.userData.hpBarFill.scale.x = ratio;
        e.mesh.userData.hpBarFill.material.color.setHex(ratio > 0.5 ? 0x10b981 : (ratio > 0.2 ? 0xfbbf24 : 0xef4444));
      }
    }

    if (e.isPatrol) {
      e.mesh.position.x += e.vx;
      if (e.mesh.position.x < colToX(2.5) || e.mesh.position.x > colToX(GRID_COLS - 2.5)) e.vx *= -1;
    } else {
      // Penargetan dinamis ke 4 objek terdekat: Player, Pagar, Turret/Tech Lab, atau Core Stone
      let dPlayer = e.mesh.position.distanceTo(camera.position);
      let dStone = stoneHp > 0 ? e.mesh.position.distanceTo(stoneMesh.position) : Infinity;
      let dBuild = Infinity;
      let targetBuilding = null;
      let dFence = Infinity;
      let targetFence = null;

      towers.forEach(t => {
        if ((t.hp || 50) > 0) {
          let d = e.mesh.position.distanceTo(t.mesh.position);
          if (d < dBuild) { dBuild = d; targetBuilding = t; }
        }
      });

      fences.forEach(f => {
        if (f.hp > 0 && f.mesh) {
          let d = Math.hypot(e.mesh.position.x - f.mesh.position.x, e.mesh.position.z - f.mesh.position.z);
          if (d < dFence) { dFence = d; targetFence = f; }
        }
      });

      let minD = Math.min(dPlayer, dFence, dBuild, dStone);

      if (minD === dPlayer) {
        const dirP = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
        dirP.y = 0;
        if (dirP.length() > 2.0) { // Jarak serangan 1 tile (= 2.0 units)
          dirP.normalize();
          e.mesh.position.addScaledVector(dirP, e.speed);
          e.attackState = 'idle'; e.attackTimer = 0;
        } else {
          if (!e.attackState || e.attackState === 'idle') {
            e.attackState = 'windup'; e.attackTimer = 90; // Aktivasi serangan 1.5 detik (90 ticks)
          } else if (e.attackState === 'windup') {
            e.attackTimer--;
            if (e.attackTimer <= 0) {
              playerHp -= 3.0;
              updateHUD();
              if (playerHp <= 0) {
                alert("⚠️ KARAKTER ANDA GUGUR DI SERANG MUSUH! Respawn darurat di dalam pos...");
                playerHp = playerMaxHp;
                playerX = colToX(19.5); playerZ = rowToZ(5);
                camera.position.set(playerX, CAMERA_HEIGHT, playerZ);
                updateHUD();
              }
              e.attackState = 'cooldown'; e.attackTimer = 54; // Jeda tiap serangan 0.90 detik (54 ticks)
            }
          } else if (e.attackState === 'cooldown') {
            e.attackTimer--;
            if (e.attackTimer <= 0) { e.attackState = 'windup'; e.attackTimer = 90; }
          }
        }
      } else if (minD === dBuild && targetBuilding) {
        const dirB = new THREE.Vector3().subVectors(targetBuilding.mesh.position, e.mesh.position);
        dirB.y = 0;
        if (dirB.length() > 2.0) { // Jarak serangan 1 tile (= 2.0 units)
          dirB.normalize();
          e.mesh.position.addScaledVector(dirB, e.speed);
          e.attackState = 'idle'; e.attackTimer = 0;
        } else {
          if (!e.attackState || e.attackState === 'idle') {
            e.attackState = 'windup'; e.attackTimer = 90;
          } else if (e.attackState === 'windup') {
            e.attackTimer--;
            if (e.attackTimer <= 0) {
              targetBuilding.hp = (targetBuilding.hp || 50) - 5.0;
              if (targetBuilding.hp <= 0) {
                scene.remove(targetBuilding.mesh);
                towers = towers.filter(tw => tw !== targetBuilding);
                grid[targetBuilding.row][targetBuilding.col] = null;
              }
              e.attackState = 'cooldown'; e.attackTimer = 54;
            }
          } else if (e.attackState === 'cooldown') {
            e.attackTimer--;
            if (e.attackTimer <= 0) { e.attackState = 'windup'; e.attackTimer = 90; }
          }
        }
      } else if (minD === dFence && targetFence) {
        const dirF = new THREE.Vector3().subVectors(targetFence.mesh.position, e.mesh.position);
        dirF.y = 0;
        if (dirF.length() > 2.0) { // Jarak serangan 1 tile (= 2.0 units)
          dirF.normalize();
          e.mesh.position.addScaledVector(dirF, e.speed);
          e.attackState = 'idle'; e.attackTimer = 0;
        } else {
          if (!e.attackState || e.attackState === 'idle') {
            e.attackState = 'windup'; e.attackTimer = 90;
          } else if (e.attackState === 'windup') {
            e.attackTimer--;
            if (e.attackTimer <= 0) {
              targetFence.hp -= 6.0;
              updateHUD();
              if (targetFence.hp <= 0) {
                if (targetFence.mesh) scene.remove(targetFence.mesh);
                targetFence.mesh = null;
                updateHUD();
              }
              e.attackState = 'cooldown'; e.attackTimer = 54;
            }
          } else if (e.attackState === 'cooldown') {
            e.attackTimer--;
            if (e.attackTimer <= 0) { e.attackState = 'windup'; e.attackTimer = 90; }
          }
        }
      } else {
        const dirS = new THREE.Vector3().subVectors(stoneMesh.position, e.mesh.position);
        dirS.y = 0;
        if (dirS.length() > 2.0) { // Jarak serangan 1 tile (= 2.0 units)
          dirS.normalize();
          e.mesh.position.addScaledVector(dirS, e.speed);
          e.attackState = 'idle'; e.attackTimer = 0;
        } else {
          if (!e.attackState || e.attackState === 'idle') {
            e.attackState = 'windup'; e.attackTimer = 90;
          } else if (e.attackState === 'windup') {
            e.attackTimer--;
            if (e.attackTimer <= 0) {
              stoneHp -= 15.0;
              updateHUD();
              if (stoneHp <= 0) { triggerCoreStoneStolen(); return; }
              e.attackState = 'cooldown'; e.attackTimer = 54;
            }
          } else if (e.attackState === 'cooldown') {
            e.attackTimer--;
            if (e.attackTimer <= 0) { e.attackState = 'windup'; e.attackTimer = 90; }
          }
        }
      }
    }

    // Batas samping arena pertempuran (agar tidak menembus pohon sisi kiri & kanan)
    e.mesh.position.x = Math.max(colToX(2.0), Math.min(colToX(GRID_COLS - 2.0), e.mesh.position.x));

    // Collider antar musuh (agar tidak saling tembus / tumpuk)
    for (let j = 0; j < enemies.length; j++) {
      if (i === j) continue;
      let other = enemies[j];
      let dx = e.mesh.position.x - other.mesh.position.x;
      let dz = e.mesh.position.z - other.mesh.position.z;
      let dist = Math.hypot(dx, dz);
      if (dist < 1.4 && dist > 0.001) {
        let overlap = (1.4 - dist) * 0.5;
        e.mesh.position.x += (dx / dist) * overlap;
        e.mesh.position.z += (dz / dist) * overlap;
        other.mesh.position.x -= (dx / dist) * overlap;
        other.mesh.position.z -= (dz / dist) * overlap;
      }
    }
  }

  // Animations & Weapon Bobbing
  const isMoving = (keysPressed['W'] || keysPressed['S'] || keysPressed['A'] || keysPressed['D']);
  const bobY = Math.sin(gameTick * (isMoving ? 0.2 : 0.05)) * (isMoving ? 0.015 : 0.005);
  const bobX = Math.cos(gameTick * (isMoving ? 0.1 : 0.03)) * (isMoving ? 0.01 : 0.003);

  if (pistolGroup && pistolGroup.visible) {
    if (pistolRecoilAnim > 0) {
      pistolGroup.position.set(0.22 + bobX, -0.15 + bobY, -0.38);
      pistolGroup.rotation.x = 0.15;
      pistolRecoilAnim--;
    } else {
      pistolGroup.position.set(0.22 + bobX, -0.18 + bobY, -0.45);
      pistolGroup.rotation.x = 0;
    }
  }
  if (knifeGroup && knifeGroup.visible) {
    knifeGroup.position.set(0.22 + bobX, -0.18 + bobY, -0.45);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function openTopup() {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  document.getElementById('topup-modal').classList.add('active');
}
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(n, p, a) {
  MidtransPay.checkout({ itemName: n, price: p, onSuccess: () => { gems += a; updateHUD(); closeTopup(); } });
}

// Modal Tas Bahan [I]
function openInventory() {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  updateHUD();
  const modal = document.getElementById('inventory-modal');
  if (modal) modal.classList.add('active');
}
function closeInventory() {
  const modal = document.getElementById('inventory-modal');
  if (modal) modal.classList.remove('active');
}
function toggleInventory() {
  const modal = document.getElementById('inventory-modal');
  if (modal && modal.classList.contains('active')) closeInventory();
  else openInventory();
}

function isPlayerAdjacentToWeaponCrate() {
  if (!weaponCrateMesh || weaponCrateLvl === 0 || !camera) return false;
  const distToCrate = Math.hypot(playerX - weaponCrateMesh.position.x, playerZ - weaponCrateMesh.position.z);
  if (distToCrate > 3.5) return false;
  const rc = new THREE.Raycaster();
  rc.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = rc.intersectObject(weaponCrateMesh, true);
  return hits.length > 0;
}

function isWeaponUnlocked(wKey) {
  if (wKey === 'pistol' || wKey === 'knife') return true; // Default Lv 0
  if (weaponCrateLvl >= 1 && (wKey === 'shotgun' || wKey === 'axe')) return true;
  if (weaponCrateLvl >= 2 && (wKey === 'sniper' || wKey === 'blade')) return true;
  if (weaponCrateLvl >= 3 && (wKey === 'ak47' || wKey === 'bow')) return true;
  if (weaponCrateLvl >= 4 && (wKey === 'rudal' || wKey === 'scythe' || wKey === 'hammer')) return true;
  return false;
}

// Modal Penyimpanan Senjata [E] & Navigasi
function openEquipment(force = false) {
  if (!force && !isPlayerAdjacentToWeaponCrate()) {
    return;
  }
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  updateHUD();
  renderWeaponNav();
  updateWeaponPreview();
  switchETab('weapon');
  const modal = document.getElementById('equipment-modal');
  if (modal) modal.classList.add('active');
}

function closeEquipment() {
  const modal = document.getElementById('equipment-modal');
  if (modal) modal.classList.remove('active');
}

function renderWeaponNav() {
  const navList = document.getElementById('weapon-nav-list');
  if (!navList) return;
  navList.innerHTML = '';
  weaponsOrder.forEach((wKey, idx) => {
    const st = WEAPON_STATS[wKey] || {};
    const unlocked = isWeaponUnlocked(wKey);
    const btn = document.createElement('button');
    btn.className = 'btn-pc';
    btn.style.width = 'auto';
    btn.style.flex = '0 0 auto';
    btn.style.padding = '8px 14px';
    btn.style.fontSize = '12px';
    btn.style.whiteSpace = 'nowrap';
    btn.style.opacity = unlocked ? '1' : '0.55';
    btn.style.background = (idx === selectedPreviewWeaponIdx) ? '#3b82f6' : '#1e293b';
    btn.style.border = (idx === selectedPreviewWeaponIdx) ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)';
    btn.innerText = (unlocked ? '' : '🔒 ') + (st.name || wKey);
    btn.onclick = () => {
      selectedPreviewWeaponIdx = idx;
      renderWeaponNav();
      updateWeaponPreview();
    };
    navList.appendChild(btn);
  });
}

function navigateWeapon(dir) {
  selectedPreviewWeaponIdx = (selectedPreviewWeaponIdx + dir + weaponsOrder.length) % weaponsOrder.length;
  renderWeaponNav();
  updateWeaponPreview();
}

function updateWeaponPreview() {
  const wKey = weaponsOrder[selectedPreviewWeaponIdx];
  const st = WEAPON_STATS[wKey] || {};
  const unlocked = isWeaponUnlocked(wKey);
  const hdr = document.getElementById('preview-wep-header');
  if (hdr) hdr.innerText = (unlocked ? '' : '🔒 [TERKUNCI] ') + (st.name || wKey);
  const pA = document.getElementById('pv-ammo');
  if (pA) pA.innerText = st.ammoMax === Infinity ? 'Melee (Tanpa Amunisi)' : `${st.ammoMax} Peluru`;
  const pD = document.getElementById('pv-dmg');
  if (pD) pD.innerText = `${st.dmg} HP / Tembakan`;
  const pS = document.getElementById('pv-spd');
  if (pS) pS.innerText = st.speed || '0.5s';
  const pR = document.getElementById('pv-reload');
  if (pR) pR.innerText = st.reload ? `${st.reload}s Otomatis` : 'N/A';
  const pRg = document.getElementById('pv-range');
  if (pRg) pRg.innerText = `${st.range} Grid`;
  const pDsc = document.getElementById('pv-desc');
  if (pDsc) {
    let desc = st.desc || '';
    if (!unlocked) desc += `\n\n🔒 SYARAT PEMBUKAAN: Butuh Peti Senjata Level ${wKey === 'shotgun' || wKey === 'axe' ? 1 : (wKey === 'sniper' || wKey === 'blade' ? 2 : (wKey === 'ak47' || wKey === 'bow' ? 3 : 4))}!`;
    pDsc.innerText = desc;
  }
}

function equipCurrentPreview() {
  const wKey = weaponsOrder[selectedPreviewWeaponIdx];
  if (!isWeaponUnlocked(wKey)) {
    alert("🔒 SENJATA TERKUNCI!\nAnda harus meningkatkan Peti Senjata ke level yang sesuai untuk membuka dan menggunakan senjata ini!");
    return;
  }
  const st = WEAPON_STATS[wKey] || {};
  if (st.type === 'ranged') {
    equippedRanged = wKey;
    localStorage.setItem('outpost_eq_ranged', wKey);
    activeWeaponSlot = 1;
    currentAmmo = st.ammoMax;
    maxAmmo = st.ammoMax;
    isReloading = false;
  } else {
    equippedMelee = wKey;
    localStorage.setItem('outpost_eq_melee', wKey);
    activeWeaponSlot = 2;
  }
  isSniperScoped = false;
  if (typeof updateSniperScopeUI === 'function') updateSniperScopeUI();
  buildFPSArms();
  updateHUD();
  renderWeaponNav();
}

function switchETab(tabName) {
  const wTab = document.getElementById('tab-weapon-content');
  const eTab = document.getElementById('tab-equipment-content');
  const wBtn = document.getElementById('tab-btn-weapon');
  const eBtn = document.getElementById('tab-btn-equip');
  if (!wTab || !eTab) return;
  if (tabName === 'weapon') {
    wTab.style.display = 'block';
    eTab.style.display = 'none';
    if (wBtn) { wBtn.style.background = '#3b82f6'; wBtn.style.color = 'white'; wBtn.style.borderColor = 'white'; }
    if (eBtn) { eBtn.style.background = '#1e293b'; eBtn.style.color = '#94a3b8'; eBtn.style.borderColor = 'rgba(255,255,255,0.2)'; }
  } else {
    wTab.style.display = 'none';
    eTab.style.display = 'block';
    if (eBtn) { eBtn.style.background = '#3b82f6'; eBtn.style.color = 'white'; eBtn.style.borderColor = 'white'; }
    if (wBtn) { wBtn.style.background = '#1e293b'; wBtn.style.color = '#94a3b8'; wBtn.style.borderColor = 'rgba(255,255,255,0.2)'; }
  }
}

// Modal Pusat Bangunan [B]
function openBuildingMenu() {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  const modal = document.getElementById('building-modal');
  if (modal) modal.classList.add('active');
}
function closeBuildingMenu() {
  const modal = document.getElementById('building-modal');
  if (modal) modal.classList.remove('active');
}
function toggleBuildingMenu() {
  const modal = document.getElementById('building-modal');
  if (modal && modal.classList.contains('active')) closeBuildingMenu();
  else openBuildingMenu();
}
function confirmBuildSelection() {
  const selected = document.querySelector('input[name="build-select"]:checked');
  if (!selected) return;
  const val = selected.value;
  closeBuildingMenu();

  if (val === 'turret') {
    tryBuildTower();
  } else if (val === 'tech') {
    if (techLabLvl === 0 && !BUILDING_POSITIONS['tech']) startBuildingPlacement('tech');
    else tryBuildTechLab();
  } else if (val === 'builder_barrack') {
    if (builderBarracksLvl === 0 && !BUILDING_POSITIONS['builder_barrack']) startBuildingPlacement('builder_barrack');
    else tryBuildBuilderBarracks();
  } else if (val === 'lumberjack') {
    if (lumberjackBarracksLvl === 0 && !BUILDING_POSITIONS['lumberjack']) startBuildingPlacement('lumberjack');
    else tryBuildLumberjackBarracks();
  } else if (val === 'miner') {
    if (minerBarracksLvl === 0 && !BUILDING_POSITIONS['miner']) startBuildingPlacement('miner');
    else tryBuildMinerBarracks();
  } else if (val === 'stone') {
    tryUpgradeCoreStone();
  }
}

// === SISTEM RENCANA KERJA NPC TUKANG & MODAL [B] ===
function getMissingReqString(targetType, targetLvl) {
  const reqLvl = targetLvl - 1;
  const reqBuilderLvl = Math.max(0, targetLvl - 2);
  let missing = [];
  if (targetType !== 'wall' && wallLvl < reqLvl) missing.push(`Pagar Lv ${reqLvl}`);
  if (targetType !== 'turret' && (towers.length === 0 || towers[0].lvl < reqLvl)) missing.push(`Turret Lv ${reqLvl}`);
  if (targetType !== 'lumberjack' && lumberjackBarracksLvl < reqLvl) missing.push(`Barak Penebang Lv ${reqLvl}`);
  if (targetType !== 'miner' && minerBarracksLvl < reqLvl) missing.push(`Barak Penambang Lv ${reqLvl}`);
  if (targetType !== 'stone' && stoneLvl < reqLvl) missing.push(`Core Stone Lv ${reqLvl}`);
  if (targetType !== 'tech' && techLabLvl < reqLvl) missing.push(`Riset Teknologi Lv ${reqLvl}`);
  if (targetType !== 'builder_barrack' && builderBarracksLvl < reqBuilderLvl) missing.push(`Barak Tukang Lv ${reqBuilderLvl}`);
  if (missing.length === 0) return "";
  return "harus ada " + missing.join(", ");
}

function getBuilderPlanList() {
  const bisaDikerjakan = [];
  const syaratBelumTerpenuhi = [];

  const evaluateCandidate = (type, name, currentLvl, baseCost, costMult, executeFunc, canAffordCheck, customReqCheck = null) => {
    const nextLvl = currentLvl + 1;
    const cost = type === 'weapon_crate' ? 1000 * nextLvl : Math.floor(baseCost * Math.pow(costMult, currentLvl));
    const reqMet = customReqCheck !== null ? customReqCheck(nextLvl) : checkUniversalUpgradeRequirements(type, nextLvl, true);
    
    if (reqMet) {
      const isNew = currentLvl === 0;
      const baseSec = isNew ? 5 : 10 * Math.pow(1.5, nextLvl - 2);
      let targetX = getBuildingPos(type).x;
      let targetZ = getBuildingPos(type).z;
      if (type === 'turret' && towers.length > 0 && towers[0].mesh) {
        targetX = towers[0].mesh.position.x;
        targetZ = towers[0].mesh.position.z;
      } else if (type === 'wall') {
        targetX = colToX(8.5);
        targetZ = rowToZ(FENCE_ROW);
      } else if (type === 'stone') {
        targetX = colToX(8.5);
        targetZ = rowToZ(2);
      }

      bisaDikerjakan.push({
        type, name: isNew ? `Bangun ${name}` : `Upgrade ${name} ke level ${nextLvl}`,
        lvl: nextLvl, cost, canAfford: gold >= cost && canAffordCheck(nextLvl),
        isNew, estSec: baseSec,
        x: targetX, z: targetZ,
        execute: executeFunc,
        manualOnly: type === 'builder_barrack' || type === 'stone'
      });
    } else {
      let missingReq = "";
      if (currentLvl === 0 && type === 'turret') missingReq = "harus ada Barak Tukang level 1";
      else if (currentLvl === 0 && type === 'tech') missingReq = "harus ada Barak Tukang level 1";
      else if (currentLvl === 0 && type === 'weapon_crate') missingReq = "harus ada Barak Tukang level 1";
      else if (currentLvl === 0 && (type === 'lumberjack' || type === 'miner')) missingReq = "harus ada Riset Teknologi level 1";
      else missingReq = getMissingReqString(type, nextLvl);
      
      syaratBelumTerpenuhi.push({
        type, name: currentLvl === 0 ? `Bangun ${name}` : `Upgrade ${name} ke level ${nextLvl}`,
        lvl: nextLvl, cost, missingReq
      });
    }
  };

  evaluateCandidate('wall', 'Pagar Pos', wallLvl, 250, 1.5, executeAutoUpgradeFence, () => true);
  const turretLvl = towers.length > 0 ? towers[0].lvl : 0;
  evaluateCandidate('turret', 'Turret Railgun', turretLvl, 100, 1.5, () => {
    if (towers.length === 0) {
      if (builderBarracksLvl >= 1 && gold >= 100) {
        gold -= 100; localStorage.setItem('outpost_gold', Math.floor(gold));
        const pos = getBuildingPos('turret');
        const col = Math.round(xToCol(pos.x));
        const row = Math.round(zToRow(pos.z));
        const tObj = buildSciFiTurretTower(); tObj.group.position.set(pos.x, 0, pos.z);
        scene.add(tObj.group);
        const newTower = { col, row, lvl: 1, hp: 50, mesh: tObj.group, head: tObj.head };
        towers.push(newTower); if (grid[row]) grid[row][col] = newTower;
        BUILDING_POSITIONS['turret'] = { x: pos.x, z: pos.z };
        localStorage.setItem('outpost_building_positions', JSON.stringify(BUILDING_POSITIONS));
        turretBuilt = true;
        turretSavedLvl = 1;
        localStorage.setItem('outpost_turret_built', 'true');
        localStorage.setItem('outpost_turret_lvl', '1');
        updateHUD();
      }
    } else executeAutoUpgradeTower();
  }, (lvl) => lvl === 1 ? woodCount >= 10 : true, (lvl) => lvl === 1 ? builderBarracksLvl >= 1 : checkUniversalUpgradeRequirements('turret', lvl, true));
  evaluateCandidate('tech', 'Riset Teknologi', techLabLvl, 500, 1.5, () => tryBuildTechLab(true), (lvl) => lvl === 1 ? woodCount >= 10 : true, (lvl) => lvl === 1 ? builderBarracksLvl >= 1 : checkUniversalUpgradeRequirements('tech', lvl, true));
  
  if (builderBarracksLvl === 0) {
    syaratBelumTerpenuhi.push({
      type: 'builder_barrack', name: 'Bangun Barak Tukang',
      lvl: 1, cost: 300, missingReq: 'Hanya bisa dibangun manual oleh Player [B] (Tukang belum ada)'
    });
  } else {
    evaluateCandidate('builder_barrack', 'Barak Tukang', builderBarracksLvl, 300, 1.5, () => tryBuildBuilderBarracks(true), (lvl) => woodCount >= 10 && stoneCount >= 10, (lvl) => checkUniversalUpgradeRequirements('builder_barrack', lvl, true));
  }
  
  evaluateCandidate('lumberjack', 'Barak Penebang', lumberjackBarracksLvl, 350, 1.5, () => tryBuildLumberjackBarracks(true), (lvl) => woodCount >= (15 + (lvl-1)*5) && stoneCount >= (5 + (lvl-1)*5) && ironCount >= (10 + (lvl-1)*5), (lvl) => lvl === 1 ? techLabLvl >= 1 : checkUniversalUpgradeRequirements('lumberjack', lvl, true));
  evaluateCandidate('miner', 'Barak Penambang', minerBarracksLvl, 400, 1.5, () => tryBuildMinerBarracks(true), (lvl) => woodCount >= (20 + (lvl-1)*5) && stoneCount >= (15 + (lvl-1)*5) && ironCount >= (15 + (lvl-1)*5) && soilCount >= (10 + (lvl-1)*5), (lvl) => lvl === 1 ? techLabLvl >= 1 : checkUniversalUpgradeRequirements('miner', lvl, true));
  evaluateCandidate('weapon_crate', 'Peti Senjata', weaponCrateLvl, 1000, 1.0, () => tryBuildWeaponCrate(true), () => true, (lvl) => builderBarracksLvl >= lvl && (lvl === 1 ? true : checkUniversalUpgradeRequirements('weapon_crate', lvl, true)));
  evaluateCandidate('stone', 'Core Stone Monolith', stoneLvl, 500, 1.5, () => tryUpgradeCoreStone(true), () => true);

  bisaDikerjakan.sort((a, b) => a.cost - b.cost);
  return { bisaDikerjakan, syaratBelumTerpenuhi };
}

function openBuilderPlanModal() {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  const modal = document.getElementById('builder-plan-modal');
  if (!modal) return;
  const content = document.getElementById('builder-plan-content');
  const plan = getBuilderPlanList();
  
  const statusBadgeBg = isBuilderActive ? '#10b981' : '#ef4444';
  const statusBadgeTxt = isBuilderActive ? '🛠️ STATUS TUKANG: AKTIF (Sedang Bekerja dari Daftar)' : '🛑 STATUS TUKANG: NONAKTIF / STANDBY DI BARAK (Berdiri 1 tile di samping barak ini & Tekan [I] untuk Mengaktifkan)';
  let html = `<div style="background:${statusBadgeBg}22; border:1px solid ${statusBadgeBg}; color:${statusBadgeBg}; padding:10px 14px; border-radius:8px; font-weight:700; font-size:13px; margin-bottom:14px; text-align:center;">${statusBadgeTxt}</div>`;

  html += `<div style="font-weight:800; color:#10b981; font-size:15px; margin-bottom:8px;">=Bisa Dikerjakan (Diurutkan Termurah)=</div>`;
  if (plan.bisaDikerjakan.length === 0) {
    html += `<div style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:16px; color:#64748b; font-style:italic;">Tidak ada tugas yang bisa dikerjakan saat ini (semua membutuhkan prasyarat).</div>`;
  } else {
    html += `<div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">`;
    plan.bisaDikerjakan.forEach((item, idx) => {
      const statusBg = item.canAfford ? '#10b981' : '#f59e0b';
      const statusTxt = item.canAfford ? 'Siap Bangun' : 'Bahan/Gold Kurang';
      const manualBadge = item.manualOnly ? `<span style="background:#a855f7; color:white; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px;">🧑‍🔧 Hanya Manual Player [U]</span>` : `<span style="background:#0369a1; color:white; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px;">🤖 Auto Tukang</span>`;
      html += `<div style="background:#0f172a; padding:10px 14px; border-radius:8px; border-left:4px solid ${statusBg}; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:600; color:#e2e8f0;">${idx + 1}. ${item.name} ${manualBadge}</div>
          <div style="font-size:11px; color:#94a3b8;">Status: <span style="color:${statusBg}; font-weight:700;">${statusTxt}</span> | ⏱️ Durasi: <b style="color:#38bdf8;">${formatDuration(item.estSec || 5)}</b></div>
        </div>
        <span style="background:#1e293b; color:#fbbf24; font-weight:800; padding:6px 10px; border-radius:6px; font-size:12px;">${item.cost.toLocaleString('id-ID')} Gold</span>
      </div>`;
    });
    html += `</div>`;
  }

  html += `<div style="font-weight:800; color:#ef4444; font-size:15px; margin-bottom:8px;">=Syarat Belum Terpenuhi=</div>`;
  if (plan.syaratBelumTerpenuhi.length === 0) {
    html += `<div style="background:#0f172a; padding:10px; border-radius:8px; color:#64748b; font-style:italic;">Semua syarat prasyarat bangunan telah terpenuhi!</div>`;
  } else {
    html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
    plan.syaratBelumTerpenuhi.forEach((item, idx) => {
      html += `<div style="background:#0f172a; padding:10px 14px; border-radius:8px; border-left:4px solid #ef4444; display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600; color:#cbd5e1;">${idx + 1}. ${item.name}</span>
          <span style="color:#94a3b8; font-size:12px;">${item.cost.toLocaleString('id-ID')} Gold</span>
        </div>
        <div style="font-size:11px; color:#f87171; font-style:italic;">-> ${item.missingReq}</div>
      </div>`;
    });
    html += `</div>`;
  }

  content.innerHTML = html;
  modal.style.display = 'flex';
}
function closeBuilderPlanModal() {
  const modal = document.getElementById('builder-plan-modal');
  if (modal) modal.style.display = 'none';
}

function toggleSimulate1900() {
  isSimulating1900 = !isSimulating1900;
  const btn = document.getElementById('sim-horde-btn');
  if (btn) btn.innerHTML = isSimulating1900 ? '<i class="fa-solid fa-stop"></i> Stop Jam 19:00' : '<i class="fa-solid fa-clock"></i> Tes Jam 19:00';
  if (isSimulating1900) alert('🌙 Simulasi Jam 19:00 Aktif! 1800 musuh akan menyerbu (muncul 1 musuh setiap 2 detik)!');
}

window.addEventListener('resize', () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

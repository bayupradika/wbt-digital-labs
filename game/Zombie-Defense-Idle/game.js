// Core Stone 3D FPS Engine using Three.js WebGL
const container = document.getElementById('webgl-container');
const canvas = document.getElementById('gameCanvas');

// Game Persistent State & Story Lore
let gold = parseInt(localStorage.getItem('outpost_gold') || '50000');
let gems = parseInt(localStorage.getItem('outpost_gems') || '1000');
let currentPhase = parseInt(localStorage.getItem('corestone_phase') || '1');
let isLockedOut = localStorage.getItem('corestone_locked') === 'true';

let woodCount = parseInt(localStorage.getItem('outpost_wood') || '500');
let stoneCount = parseInt(localStorage.getItem('outpost_stone_res') || '500');
let ironCount = parseInt(localStorage.getItem('outpost_iron') || '500');
let soilCount = parseInt(localStorage.getItem('outpost_soil') || '500');
let rubberCount = parseInt(localStorage.getItem('outpost_rubber') || '500');

if (!localStorage.getItem('outpost_init_v5')) {
  gold = 50000;
  gems = 1000;
  woodCount = 500;
  stoneCount = 500;
  ironCount = 500;
  soilCount = 500;
  rubberCount = 500;
  localStorage.setItem('outpost_init_v5', 'true');
  localStorage.setItem('outpost_gold', '50000');
  localStorage.setItem('outpost_gems', '1000');
  localStorage.setItem('outpost_wood', '500');
  localStorage.setItem('outpost_stone_res', '500');
  localStorage.setItem('outpost_iron', '500');
  localStorage.setItem('outpost_soil', '500');
  localStorage.setItem('outpost_rubber', '500');
}

let techLabBuilt = localStorage.getItem('outpost_tech_lab') === 'true';
let techLabLvl = parseInt(localStorage.getItem('outpost_tech_lvl') || (techLabBuilt ? '1' : '0'));
let barracksLvl = parseInt(localStorage.getItem('outpost_barracks_lvl') || '0');
let builderBarracksLvl = parseInt(localStorage.getItem('outpost_builder_barracks_lvl') || '0');
let techLabMesh = null;
let builderBarracksMesh = null;
let builderMesh = null;
let lumberjackBarracksLvl = parseInt(localStorage.getItem('outpost_lumberjack_lvl') || '0');
let minerBarracksLvl = parseInt(localStorage.getItem('outpost_miner_lvl') || '0');
let mineLvl = parseInt(localStorage.getItem('outpost_mine_lvl') || '0');
let farmLvl = parseInt(localStorage.getItem('outpost_farm_lvl') || '0');
let oilPumpLvl = parseInt(localStorage.getItem('outpost_oilpump_lvl') || '0');
let lumberjackBarracksMesh = null;
let lumberjackMesh = null;
let minerBarracksMesh = null;
let minerMesh = null;
let mineMesh = null;
let farmMesh = null;
let oilPumpMesh = null;
let lumberjackTimer = 0;
let minerTimer = 0;
let oilPumpTimer = 0;
let clearedGridCount = parseInt(localStorage.getItem('outpost_cleared_grids') || '0');
let woodItems = [];
let activeWeaponSlot = 1; // 1 = Ranged, 2 = Melee
let equippedRanged = localStorage.getItem('outpost_eq_ranged') || 'pistol'; // pistol, sniper, shotgun
let equippedMelee = localStorage.getItem('outpost_eq_melee') || 'knife'; // knife, sword, axe
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
  pistol: { name: 'Pistol FPS', type: 'ranged', ammoMax: 12, dmg: 10, speed: '0.5s (2/dtk)', reload: 0.2, range: 10, desc: 'Pistol taktis standar. Kapasitas 12 peluru, reload kilat 0,2 detik.' },
  sniper: { name: 'Sniper Rifle', type: 'ranged', ammoMax: 1, dmg: 45, speed: '1.0s (1/dtk)', reload: 1.0, range: 14, desc: 'Senapan jarak jauh berpresisi tinggi. Kapasitas 1 peluru, reload 1 detik.' },
  shotgun: { name: 'Shotgun Plasma', type: 'ranged', ammoMax: 2, dmg: 24, speed: '0.6s burst', reload: 0.6, range: 8, desc: 'Menembakkan 3 peluru menyebar sekaligus. Kapasitas 2 peluru, reload 0,6 detik.' },
  ak47: { name: 'AK-47 Assault', type: 'ranged', ammoMax: 30, dmg: 14, speed: '0.2s (5/dtk)', reload: 1.2, range: 11, desc: 'Senapan serbu otomatis dengan kapasitas magazin 30 peluru.' },
  bow: { name: 'Compound Bow', type: 'ranged', ammoMax: 1, dmg: 35, speed: '0.8s', reload: 0.5, range: 12, desc: 'Busur karbon senyap penetrasi tinggi. Kapasitas 1 panah.' },
  knife: { name: 'Pisau Komando', type: 'melee', ammoMax: Infinity, dmg: 15, speed: '0.25s (4/dtk)', reload: 0, range: 2.8, desc: 'Pisau komando taktis jarak dekat tanpa amunisi.' },
  blade: { name: 'Katana Plasma', type: 'melee', ammoMax: Infinity, dmg: 30, speed: '0.4s', reload: 0, range: 3.5, desc: 'Pedang panjang tebas armor musuh tanpa amunisi.' },
  axe: { name: 'Kapak Titanium', type: 'melee', ammoMax: Infinity, dmg: 40, speed: '0.55s', reload: 0, range: 3.2, desc: 'Kapak perang titanium bertembakan berat.' },
  hammer: { name: 'Palu Besi Gada', type: 'melee', ammoMax: Infinity, dmg: 50, speed: '0.7s', reload: 0, range: 3.5, desc: 'Palu godam penghancur kerangka musuh secara brutal.' }
};

const weaponsOrder = ['pistol', 'sniper', 'shotgun', 'ak47', 'bow', 'knife', 'blade', 'axe', 'hammer'];
let selectedPreviewWeaponIdx = 0;
let currentAmmo = 12;
let maxAmmo = 12;
let isReloading = false;
let reloadTimer = 0;

let gameRunning = false;
let isSimulating1900 = false;

// 3D Grid Parameters (8 Columns x 20 Rows)
// Cell Size = 2.5 meters.
const GRID_COLS = 8;
const GRID_ROWS = 20;
const CELL_SIZE = 2.5;
let grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));

function colToX(col) { return (col - 3.5) * CELL_SIZE; }
function rowToZ(row) { return -row * CELL_SIZE; }
function xToCol(x) { return Math.round(x / CELL_SIZE + 3.5); }
function zToRow(z) { return Math.round(-z / CELL_SIZE); }

// Continuous Floating-Point Player Position
let playerX = colToX(3.5);
let playerZ = rowToZ(3);
const CAMERA_HEIGHT = 3.2; // Raised higher so view is never blocked by fence!

// Smooth WASD Key State
const keysPressed = {};

// Three.js Core Variables
let scene, camera, renderer;
let fenceMeshes = [];
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
let gameTick = 0;

// Initialize Three.js 3D Scene
function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.FogExp2(0x020617, 0.022);

  camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(playerX, CAMERA_HEIGHT, playerZ);
  camera.rotation.set(cameraPitch, cameraYaw, 0, 'YXZ');

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

  // Ground Plane
  const groundGeo = new THREE.PlaneGeometry(GRID_COLS * CELL_SIZE, GRID_ROWS * CELL_SIZE);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -GRID_ROWS * CELL_SIZE / 2 + CELL_SIZE / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid Lines
  const gridHelper = new THREE.GridHelper(GRID_ROWS * CELL_SIZE, GRID_ROWS, 0x1e293b, 0x1e293b);
  gridHelper.position.set(0, 0.02, -GRID_ROWS * CELL_SIZE / 2 + CELL_SIZE / 2);
  gridHelper.scale.set(GRID_COLS / GRID_ROWS, 1, 1);
  scene.add(gridHelper);

  buildDenseForest();

  // Core Stone Monolith (Row 1, Cols 3 & 4)
  const stoneGeo = new THREE.CylinderGeometry(1.2, 1.4, 3.5, 8);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
  stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
  stoneMesh.position.set((colToX(3) + colToX(4)) / 2, 1.75, rowToZ(1));
  scene.add(stoneMesh);

  const crystalGeo = new THREE.OctahedronGeometry(0.8);
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.set(0, 0.5, 0);
  stoneMesh.add(crystal);

  coreLight = new THREE.PointLight(0x38bdf8, 3, 18);
  coreLight.position.set((colToX(3) + colToX(4)) / 2, 2.5, rowToZ(1));
  scene.add(coreLight);

  grid[1][3] = { type: 'stone', name: 'Core Stone' };
  grid[1][4] = { type: 'stone', name: 'Core Stone' };

  buildBarricadeWall();
  buildTechLabMesh();
  buildBuilderBarracksMesh();
  buildLumberjackBarracksMesh();
  buildMinerBarracksMesh();
  buildMineMesh();
  buildFarmMesh();
  buildOilPumpMesh();
  buildFPSArms();
}

function buildDenseForest() {
  const treeGeo = new THREE.ConeGeometry(1.4, 4.5, 5);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8 });
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });

  const addTree = (x, z) => {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    group.add(trunk);
    const leaves = new THREE.Mesh(treeGeo, treeMat);
    leaves.position.y = 3;
    group.add(leaves);
    group.position.set(x, 0, z);
    group.scale.setScalar(0.7 + Math.random() * 0.6);
    scene.add(group);
  };

  for (let r = 0; r < GRID_ROWS; r++) {
    addTree(colToX(0) - 2.5 - Math.random() * 2, rowToZ(r));
    addTree(colToX(0) - 5 - Math.random() * 2, rowToZ(r));
    addTree(colToX(7) + 2.5 + Math.random() * 2, rowToZ(r));
    addTree(colToX(7) + 5 + Math.random() * 2, rowToZ(r));
  }
  for (let c = 0; c < GRID_COLS; c++) {
    addTree(colToX(c), rowToZ(0) + 2);
  }
}

function buildBarricadeWall() {
  fenceMeshes.forEach(m => scene.remove(m));
  fenceMeshes = [];
  if (fenceHp <= 0) return;

  const logGeo = new THREE.CylinderGeometry(0.25, 0.28, 2.2, 6);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

  for (let c = 0; c < GRID_COLS; c++) {
    for (let i = -1; i <= 1; i += 0.7) {
      const log = new THREE.Mesh(logGeo, logMat);
      log.position.set(colToX(c) + i, 1.1, rowToZ(5));
      log.castShadow = true;
      scene.add(log);
      fenceMeshes.push(log);
    }
  }
}

function buildTechLabMesh() {
  if (techLabMesh) scene.remove(techLabMesh);
  techLabMesh = new THREE.Group();

  const posX = colToX(2);
  const posZ = rowToZ(1);
  techLabMesh.position.set(posX, 0, posZ);

  if (!techLabBuilt) {
    const padGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.1, 6);
    const padMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.08;
    techLabMesh.add(pad);

    const pillarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
      const p = new THREE.Mesh(pillarGeo, padMat);
      p.position.set(Math.cos(angle) * 1.2, 0.9, Math.sin(angle) * 1.2);
      techLabMesh.add(p);
    }
  } else {
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
  }

  scene.add(techLabMesh);
  grid[1][2] = { type: 'tech_lab', built: techLabBuilt };
}

let builderHammerGroup = null;
function buildBuilderBarracksMesh() {
  if (builderBarracksMesh) scene.remove(builderBarracksMesh);
  builderBarracksMesh = new THREE.Group();
  const posX = colToX(5);
  const posZ = rowToZ(1);
  builderBarracksMesh.position.set(posX, 0, posZ);

  if (builderBarracksLvl === 0) {
    const padGeo = new THREE.BoxGeometry(2.2, 0.1, 2.2);
    const padMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.05;
    builderBarracksMesh.add(pad);
  } else {
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
  }
  scene.add(builderBarracksMesh);
  grid[1][5] = { type: 'builder_barrack', lvl: builderBarracksLvl };
  buildBuilderNPC();
}

function buildBuilderNPC() {
  if (builderMesh) scene.remove(builderMesh);
  if (builderBarracksLvl === 0) return;

  builderMesh = new THREE.Group();
  builderMesh.position.set(colToX(4.8), 0, rowToZ(1.6));

  // Sepatu Hitam
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat);
  lBoot.position.set(-0.15, 0.1, 0.05); builderMesh.add(lBoot);
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat);
  rBoot.position.set(0.15, 0.1, 0.05); builderMesh.add(rBoot);

  // Celana Biru
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat);
  lLeg.position.set(-0.15, 0.45, 0); builderMesh.add(lLeg);
  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat);
  rLeg.position.set(0.15, 0.45, 0); builderMesh.add(rLeg);

  // Kemeja Kuning / Putih
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), shirtMat);
  torso.position.set(0, 0.95, 0); builderMesh.add(torso);

  // Kepala
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfecca1 }));
  head.position.set(0, 1.4, 0); builderMesh.add(head);

  // Topi Biru (Blue Hardhat)
  const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
  hatBase.position.set(0, 1.55, 0); builderMesh.add(hatBase);
  const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
  hatTop.position.set(0, 1.55, 0); builderMesh.add(hatTop);

  // Tangan Kiri
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat);
  lArm.position.set(-0.32, 0.95, 0); builderMesh.add(lArm);

  // Tangan Kanan Selalu Memegang Palu
  builderHammerGroup = new THREE.Group();
  builderHammerGroup.position.set(0.32, 1.1, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat);
  rArm.position.set(0, -0.2, 0); builderHammerGroup.add(rArm);

  const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55), new THREE.MeshStandardMaterial({ color: 0xa16207 }));
  hammerHandle.position.set(0, -0.3, 0.2); hammerHandle.rotation.x = Math.PI / 3; builderHammerGroup.add(hammerHandle);
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 }));
  hammerHead.position.set(0, -0.15, 0.45); builderHammerGroup.add(hammerHead);

  builderMesh.add(builderHammerGroup);
  scene.add(builderMesh);
}

// === BARAK PENEBANG + NPC PENEBANG (Kapak) ===
function buildLumberjackBarracksMesh() {
  if (lumberjackBarracksMesh) scene.remove(lumberjackBarracksMesh);
  lumberjackBarracksMesh = new THREE.Group();
  lumberjackBarracksMesh.position.set(colToX(6), 0, rowToZ(2));
  if (lumberjackBarracksLvl > 0) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 }));
    base.position.y = 0.6; lumberjackBarracksMesh.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0x15803d }));
    roof.position.y = 1.55; roof.rotation.y = Math.PI / 4; lumberjackBarracksMesh.add(roof);
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x92400e }));
    stump.position.set(-0.8, 0.2, 1.1); lumberjackBarracksMesh.add(stump);
  } else {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.8), new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true }));
    pad.position.y = 0.05; lumberjackBarracksMesh.add(pad);
  }
  scene.add(lumberjackBarracksMesh);
  buildLumberjackNPC();
}

function buildLumberjackNPC() {
  if (lumberjackMesh) scene.remove(lumberjackMesh);
  if (lumberjackBarracksLvl === 0) return;
  lumberjackMesh = new THREE.Group();
  lumberjackMesh.position.set(colToX(6.5), 0, rowToZ(2.5));
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
  const lB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); lB.position.set(-0.15, 0.1, 0); lumberjackMesh.add(lB);
  const rB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); rB.position.set(0.15, 0.1, 0); lumberjackMesh.add(rB);
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x713f12 });
  const lL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); lL.position.set(-0.15, 0.45, 0); lumberjackMesh.add(lL);
  const rL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); rL.position.set(0.15, 0.45, 0); lumberjackMesh.add(rL);
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), shirtMat); torso.position.set(0, 0.95, 0); lumberjackMesh.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfecca1 }));
  head.position.set(0, 1.4, 0); lumberjackMesh.add(head);
  const bandana = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
  bandana.position.set(0, 1.52, 0); lumberjackMesh.add(bandana);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); lArm.position.set(-0.32, 0.95, 0); lumberjackMesh.add(lArm);
  // Tangan Kanan: Kapak
  const axeGrp = new THREE.Group(); axeGrp.position.set(0.32, 1.1, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); rArm.position.set(0, -0.2, 0); axeGrp.add(rArm);
  const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55), new THREE.MeshStandardMaterial({ color: 0xa16207 }));
  axeHandle.position.set(0, -0.3, 0.2); axeHandle.rotation.x = Math.PI / 3; axeGrp.add(axeHandle);
  const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.3), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
  axeHead.position.set(0, -0.15, 0.45); axeGrp.add(axeHead);
  lumberjackMesh.add(axeGrp);
  scene.add(lumberjackMesh);
}

// === BARAK PENAMBANG + NPC PENAMBANG (Beliung) ===
function buildMinerBarracksMesh() {
  if (minerBarracksMesh) scene.remove(minerBarracksMesh);
  minerBarracksMesh = new THREE.Group();
  minerBarracksMesh.position.set(colToX(7), 0, rowToZ(3));
  if (minerBarracksLvl > 0) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.9 }));
    base.position.y = 0.6; minerBarracksMesh.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0x78716c }));
    roof.position.y = 1.55; roof.rotation.y = Math.PI / 4; minerBarracksMesh.add(roof);
  } else {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.8), new THREE.MeshBasicMaterial({ color: 0x78716c, wireframe: true }));
    pad.position.y = 0.05; minerBarracksMesh.add(pad);
  }
  scene.add(minerBarracksMesh);
  buildMinerNPC();
}

function buildMinerNPC() {
  if (minerMesh) scene.remove(minerMesh);
  if (minerBarracksLvl === 0 || mineLvl === 0) return;
  minerMesh = new THREE.Group();
  minerMesh.position.set(colToX(7), 0, rowToZ(3.6));
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x292524 });
  const lB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); lB.position.set(-0.15, 0.1, 0); minerMesh.add(lB);
  const rB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bootMat); rB.position.set(0.15, 0.1, 0); minerMesh.add(rB);
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x57534e });
  const lL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); lL.position.set(-0.15, 0.45, 0); minerMesh.add(lL);
  const rL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), pantMat); rL.position.set(0.15, 0.45, 0); minerMesh.add(rL);
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), shirtMat); torso.position.set(0, 0.95, 0); minerMesh.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfecca1 }));
  head.position.set(0, 1.4, 0); minerMesh.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xeab308 }));
  helmet.position.set(0, 1.52, 0); minerMesh.add(helmet);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); lArm.position.set(-0.32, 0.95, 0); minerMesh.add(lArm);
  // Tangan Kanan: Beliung/Pickaxe
  const pickGrp = new THREE.Group(); pickGrp.position.set(0.32, 1.1, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), shirtMat); rArm.position.set(0, -0.2, 0); pickGrp.add(rArm);
  const pickHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  pickHandle.position.set(0, -0.3, 0.2); pickHandle.rotation.x = Math.PI / 3; pickGrp.add(pickHandle);
  const pickHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.9 }));
  pickHead.position.set(0, -0.12, 0.48); pickGrp.add(pickHead);
  minerMesh.add(pickGrp);
  scene.add(minerMesh);
}

// === FASILITAS TAMBANG MINERAL ===
function buildMineMesh() {
  if (mineMesh) scene.remove(mineMesh);
  mineMesh = new THREE.Group();
  mineMesh.position.set(colToX(1), 0, rowToZ(3));
  if (mineLvl > 0) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x57534e, wireframe: false, roughness: 0.9 }));
    frame.position.y = 1.1; mineMesh.add(frame);
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
    hole.position.set(0, 0.15, 0.8); mineMesh.add(hole);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.0), new THREE.MeshStandardMaterial({ color: 0x78716c, metalness: 0.8 }));
    rail.position.set(-0.2, 0.05, 0.8); mineMesh.add(rail);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.0), new THREE.MeshStandardMaterial({ color: 0x78716c, metalness: 0.8 }));
    rail2.position.set(0.2, 0.05, 0.8); mineMesh.add(rail2);
  } else {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), new THREE.MeshBasicMaterial({ color: 0x78716c, wireframe: true }));
    pad.position.y = 0.05; mineMesh.add(pad);
  }
  scene.add(mineMesh);
}

// === LAHAN PERTANIAN ===
function buildFarmMesh() {
  if (farmMesh) scene.remove(farmMesh);
  farmMesh = new THREE.Group();
  farmMesh.position.set(colToX(0), 0, rowToZ(2));
  if (farmLvl > 0) {
    for (let r = 0; r < 3; r++) {
      const row = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.35), new THREE.MeshStandardMaterial({ color: 0x713f12 }));
      row.position.set(0, 0.08, r * 0.5 - 0.5); farmMesh.add(row);
      for (let c = -0.5; c <= 0.5; c += 0.35) {
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 4), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
        plant.position.set(c, 0.35, r * 0.5 - 0.5); farmMesh.add(plant);
      }
    }
    const fence = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.06), new THREE.MeshStandardMaterial({ color: 0xa16207 }));
    fence.position.set(0, 0.3, -1.0); farmMesh.add(fence);
  } else {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true }));
    pad.position.y = 0.05; farmMesh.add(pad);
  }
  scene.add(farmMesh);
}

// === POMPA MINYAK & KARET ===
function buildOilPumpMesh() {
  if (oilPumpMesh) scene.remove(oilPumpMesh);
  oilPumpMesh = new THREE.Group();
  oilPumpMesh.position.set(colToX(0), 0, rowToZ(4));
  if (oilPumpLvl > 0) {
    const pumpBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
    pumpBase.position.y = 0.2; oilPumpMesh.add(pumpBase);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    arm.position.set(0, 1.2, 0.3); oilPumpMesh.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    head.position.set(0, 1.2, -0.6); oilPumpMesh.add(head);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), new THREE.MeshStandardMaterial({ color: 0x374151 }));
    post.position.set(0, 0.8, 0); oilPumpMesh.add(post);
  } else {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 1.4), new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true }));
    pad.position.y = 0.05; oilPumpMesh.add(pad);
  }
  scene.add(oilPumpMesh);
}

function buildFPSArms() {
  if (knifeGroup) camera.remove(knifeGroup);
  if (pistolGroup) camera.remove(pistolGroup);

  const armMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }); // Tangan karakter

  // Melee Group (Diposisikan jelas di kanan bawah kamera saat aktif)
  knifeGroup = new THREE.Group();
  const meleeArm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.35), armMat);
  meleeArm.position.set(0.05, -0.15, 0.15); knifeGroup.add(meleeArm);

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
  } else {
    // Pisau Komando
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.04), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
    blade.position.set(0, 0.25, -0.1); knifeGroup.add(blade);
  }
  knifeGroup.position.set(0.28, -0.22, -0.55);
  knifeGroup.rotation.set(0.3, -0.1, 0.1);
  camera.add(knifeGroup);

  // Ranged Group (Diposisikan jelas di kanan bawah kamera saat aktif)
  pistolGroup = new THREE.Group();
  const rangedArm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.35), armMat);
  rangedArm.position.set(0.05, -0.15, 0.15); pistolGroup.add(rangedArm);

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
  } else {
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.45), gunMat);
    pistolGroup.add(barrel);
  }
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.1), gunMat);
  grip.position.set(0, -0.12, 0.1); grip.rotation.x = 0.3; pistolGroup.add(grip);
  pistolGroup.position.set(0.28, -0.22, -0.55);
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
    if (fenceHp <= 0) {
      fHpEl.innerText = '💥 RUNTUH!';
      fHpEl.style.color = '#ef4444';
    } else {
      fHpEl.innerText = `${Math.floor(fenceHp)} / ${fenceMaxHp}`;
      fHpEl.style.color = '#fbbf24';
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
  const invSoil = document.getElementById('inv-grid-soil');
  if (invSoil) invSoil.innerText = soilCount.toLocaleString('id-ID');
  const invRub = document.getElementById('inv-grid-rubber');
  if (invRub) invRub.innerText = rubberCount.toLocaleString('id-ID');

  // Active Weapon Label
  const activeWep = document.getElementById('active-wep-lbl');
  if (activeWep) {
    if (activeWeaponSlot === 1) {
      const w = WEAPON_STATS[equippedRanged];
      activeWep.innerText = w ? w.name : 'Pistol';
    } else {
      const w = WEAPON_STATS[equippedMelee];
      activeWep.innerText = w ? w.name : 'Pisau';
    }
  }

  // Update Equipment Modal Table Slot Texts
  const eqS1 = document.getElementById('eq-slot-1-txt');
  if (eqS1) eqS1.innerText = (WEAPON_STATS[equippedRanged] ? WEAPON_STATS[equippedRanged].name : equippedRanged);
  const eqS2 = document.getElementById('eq-slot-2-txt');
  if (eqS2) eqS2.innerText = (WEAPON_STATS[equippedMelee] ? WEAPON_STATS[equippedMelee].name : equippedMelee);
}

function startGame() {
  isLockedOut = false;
  localStorage.setItem('corestone_locked', 'false');
  document.getElementById('start-screen').classList.add('hidden');
  const lockoutEl = document.getElementById('lockout-screen');
  if (lockoutEl) lockoutEl.classList.add('hidden');

  fenceMaxHp = Math.floor(100 * Math.pow(1.25, wallLvl - 1)); fenceHp = fenceMaxHp;
  stoneMaxHp = 200 + (stoneLvl - 1) * 100; stoneHp = stoneMaxHp;
  buildBarricadeWall();
  enemies.forEach(e => scene.remove(e.mesh)); enemies = [];
  bullets.forEach(b => scene.remove(b.mesh)); bullets = [];
  towers.forEach(t => scene.remove(t.mesh)); towers = [];
  woodItems.forEach(w => scene.remove(w.mesh)); woodItems = [];
  grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
  grid[1][3] = { type: 'stone' }; grid[1][4] = { type: 'stone' };
  playerX = colToX(3.5); playerZ = rowToZ(3);
  camera.position.set(playerX, CAMERA_HEIGHT, playerZ);
  gameRunning = true;
  spawnEnemy(false);
  spawnEnemy(true);
  updateHUD();

  if (canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
}

function triggerCoreStoneStolen() {
  gameRunning = false;
  isLockedOut = true;
  localStorage.setItem('corestone_locked', 'true');
  const penalties = { 1: 100, 2: 300, 3: 500 };
  const cost = penalties[currentPhase] || 100;
  document.getElementById('lockout-cost').innerText = `💎 ${cost} Permata`;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('lockout-screen').classList.remove('hidden');
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

canvas.addEventListener('mousedown', e => {
  if (!gameRunning || isAnyModalActive()) return;
  isMouseDragging = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
  if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
  fireFPSPistol();
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

function fireFPSPistol() {
  if (playerFireCooldown > 0) return;

  if (activeWeaponSlot === 2) {
    // Melee Attack
    const st = WEAPON_STATS[equippedMelee] || WEAPON_STATS.knife;
    let dmg = st.dmg || 15;
    let cd = Math.floor((parseFloat(st.speed) || 0.25) * 60);
    let reach = st.range || 2.8;

    playerFireCooldown = cd;
    if (knifeGroup) knifeGroup.rotation.z = -0.55;
    setTimeout(() => { if (knifeGroup) knifeGroup.rotation.z = 0.2; }, 120);

    for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      if (camera.position.distanceTo(e.mesh.position) < reach) {
        e.hp -= dmg;
        if (e.hp <= 0) {
          gold += 1; updateHUD();
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

  if (equippedRanged === 'shotgun') {
    for (let s = -0.1; s <= 0.1; s += 0.1) {
      const bM = new THREE.Mesh(bulletGeo, bulletMat);
      const pelletDir = dir.clone().add(new THREE.Vector3(s + (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, 0)).normalize();
      bM.position.copy(camera.position).addScaledVector(pelletDir, 0.8);
      scene.add(bM);
      bullets.push({ mesh: bM, dir: pelletDir.multiplyScalar(spdMult), dmg: dmg / 3 });
    }
  } else {
    const bMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bMesh.position.copy(camera.position).addScaledVector(dir, 0.8);
    scene.add(bMesh);
    bullets.push({ mesh: bMesh, dir: dir.clone().multiplyScalar(spdMult), dmg: dmg });
  }
}

function startReload() {
  if (isReloading || activeWeaponSlot !== 1) return;
  const st = WEAPON_STATS[equippedRanged] || WEAPON_STATS.pistol;
  isReloading = true;
  reloadTimer = Math.floor((st.reload || 0.5) * 60);
  updateHUD();
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
  if (k === 'Q') {
    activeWeaponSlot = activeWeaponSlot === 1 ? 2 : 1;
    if (pistolGroup) pistolGroup.visible = (activeWeaponSlot === 1);
    if (knifeGroup) knifeGroup.visible = (activeWeaponSlot === 2);
    if (activeWeaponSlot === 1 && !isReloading) {
      const st = WEAPON_STATS[equippedRanged] || WEAPON_STATS.pistol;
      if (currentAmmo <= 0) currentAmmo = st.ammoMax;
    }
    updateHUD();
  }
  if (k === 'E') openEquipment();
  if (k === 'B') openBuildingMenu();
  if (k === 'T') tryBuildTower();
  if (k === 'U') tryProximityUpgrade();
  if (k === 'I') toggleInventory();
  if (e.key === 'Escape') { closeInventory(); closeEquipment(); closeBuildingMenu(); }
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

    nextX = Math.max(colToX(0), Math.min(colToX(7), nextX));

    nextZ = Math.max(rowToZ(18), Math.min(rowToZ(1), nextZ));

    // Pagar hanya dapat dilewati dengan melompat / menggunakan shortcut space
    if (fenceHp > 0) {
      const fenceZ = rowToZ(5);
      const isCrossingFence = (playerZ > fenceZ && nextZ <= fenceZ) || (playerZ < fenceZ && nextZ >= fenceZ);
      if (isCrossingFence && (!isJumping || playerY < 3.8)) {
        nextZ = playerZ; // Tembok pagar tidak bisa dilewati tanpa melompat dengan space!
      }
    }

    let targetCol = Math.max(0, Math.min(7, xToCol(nextX)));
    let targetRow = Math.max(0, Math.min(19, zToRow(nextZ)));
    
    // Saat melompat tinggi, lewati hambatan grid
    if ((isJumping && playerY > 3.6) || grid[targetRow][targetCol] === null) {
      playerX = nextX;
      playerZ = nextZ;
    } else {
      if (grid[zToRow(playerZ)][targetCol] === null) playerX = nextX;
      if (grid[targetRow][xToCol(playerX)] === null) playerZ = nextZ;
    }
  }

  camera.position.set(playerX, playerY, playerZ);
}

function buildSciFiTurretTower() {
  const group = new THREE.Group();

  // 1. Reinforced Armored Octagonal Foundation Base
  const baseGeo = new THREE.CylinderGeometry(0.85, 1.1, 0.7, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.35;
  group.add(base);

  // Neon Energy Ring on base
  const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 16);
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const ring = new THREE.Mesh(ringGeo, neonMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.68;
  group.add(ring);

  // 2. Rotating Turret Head Group
  const turretHead = new THREE.Group();
  turretHead.position.y = 1.1;

  // Hydraulic Neck Pivot
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 8), baseMat);
  neck.position.y = -0.15;
  turretHead.add(neck);

  // Main Armored Chassis
  const chassisGeo = new THREE.BoxGeometry(1.1, 0.7, 1.3);
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.3 });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.3;
  turretHead.add(chassis);

  // Glowing Armor Side Panels
  const panelGeo = new THREE.BoxGeometry(1.16, 0.3, 1.0);
  const panel = new THREE.Mesh(panelGeo, neonMat);
  panel.position.y = 0.3;
  turretHead.add(panel);

  // 3. Twin Railgun Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });

  const leftBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  leftBarrel.rotation.x = Math.PI / 2;
  leftBarrel.position.set(-0.32, 0.3, -0.9);
  turretHead.add(leftBarrel);

  const rightBarrel = new THREE.Mesh(barrelGeo, barrelMat);
  rightBarrel.rotation.x = Math.PI / 2;
  rightBarrel.position.set(0.32, 0.3, -0.9);
  turretHead.add(rightBarrel);

  // Muzzle Energy Tips
  const tipGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 8);
  const leftTip = new THREE.Mesh(tipGeo, neonMat);
  leftTip.rotation.x = Math.PI / 2;
  leftTip.position.set(-0.32, 0.3, -1.65);
  turretHead.add(leftTip);

  const rightTip = new THREE.Mesh(tipGeo, neonMat);
  rightTip.rotation.x = Math.PI / 2;
  rightTip.position.set(0.32, 0.3, -1.65);
  turretHead.add(rightTip);

  // 4. Radar Dome
  const radarGeo = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const radar = new THREE.Mesh(radarGeo, neonMat);
  radar.position.set(0, 0.65, 0.1);
  turretHead.add(radar);

  group.add(turretHead);
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

function tryBuildTower() {
  if (towers.length >= 1) {
    alert('⚠️ Batas Pembangunan: Anda hanya bisa memiliki maksimal 1 Turret di Pos saat ini!');
    return;
  }
  if (!checkAndPayWithGemConversion(100)) return;

  let currentCol = Math.max(3, Math.min(4, xToCol(playerX)));
  let frontRow = 4; // Tepat di baris pertahanan tengah

  if (grid[frontRow][currentCol] !== null) {
    // Coba kolom sebelah
    currentCol = (currentCol === 3) ? 4 : 3;
    if (grid[frontRow][currentCol] !== null) return;
  }

  const tObj = buildSciFiTurretTower();
  tObj.group.position.set(colToX(currentCol), 0, rowToZ(frontRow));
  scene.add(tObj.group);

  const newTower = { col: currentCol, row: frontRow, lvl: 1, hp: 50, mesh: tObj.group, head: tObj.head };
  towers.push(newTower);
  grid[frontRow][currentCol] = newTower;
  updateHUD();
}

function tryBuildTechLab() {
  if (techLabBuilt && techLabLvl >= 2) {
    alert('✅ Bangunan Riset Teknologi sudah mencapai Level Maksimal (Lv 2)!');
    return;
  }
  if (woodCount < 10) {
    alert(`⚠️ Kayu Kurang! Membangun Riset Teknologi membutuhkan 10 Kayu (Anda punya ${woodCount} 🪵). Ambil di hutan luar pagar.`);
    return;
  }
  if (!checkAndPayWithGemConversion(500)) return;

  woodCount -= 10;
  techLabBuilt = true;
  techLabLvl++;
  localStorage.setItem('outpost_tech_lab', 'true');
  localStorage.setItem('outpost_tech_lvl', techLabLvl);
  localStorage.setItem('outpost_wood', woodCount);
  buildTechLabMesh();
  updateHUD();
  alert(`🔬 Riset Teknologi Quantum berhasil dibangun/ditingkatkan ke Level ${techLabLvl}!`);
}

function tryBuildBuilderBarracks() {
  const cost = Math.floor(300 * Math.pow(1.5, builderBarracksLvl));
  if (woodCount < 10 || stoneCount < 10) {
    alert(`⚠️ Bahan Kurang! Membangun/Upgrade Barak Tukang membutuhkan 10 Kayu & 10 Batu (Anda punya ${woodCount} 🪵 dan ${stoneCount} 🪨).`);
    return;
  }
  if (!checkAndPayWithGemConversion(cost)) return;

  woodCount -= 10;
  stoneCount -= 10;
  builderBarracksLvl++;
  localStorage.setItem('outpost_builder_barracks_lvl', builderBarracksLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  buildBuilderBarracksMesh();
  updateHUD();
  alert(`🔨 Barak Tukang berhasil dibangun/ditingkatkan ke Level ${builderBarracksLvl}! NPC Tukang bertopi biru siap memperbaiki pos!`);
}

function tryBuildLumberjackBarracks() {
  if (builderBarracksLvl < 1) { alert('⚠️ Syarat: Barak Tukang Level 1 harus dibangun terlebih dahulu!'); return; }
  const cost = Math.floor(350 * Math.pow(1.5, lumberjackBarracksLvl));
  const needWood = 15 + lumberjackBarracksLvl * 5;
  const needStone = 5 + lumberjackBarracksLvl * 5;
  const needIron = 10 + lumberjackBarracksLvl * 5;
  if (woodCount < needWood || stoneCount < needStone || ironCount < needIron) {
    alert(`⚠️ Bahan Kurang! Butuh ${needWood} 🪵, ${needStone} 🪨, ${needIron} ⚙️`); return;
  }
  if (!checkAndPayWithGemConversion(cost)) return;
  woodCount -= needWood; stoneCount -= needStone; ironCount -= needIron;
  lumberjackBarracksLvl++;
  localStorage.setItem('outpost_lumberjack_lvl', lumberjackBarracksLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_iron', ironCount);
  buildLumberjackBarracksMesh();
  updateHUD();
  alert(`🪓 Barak Penebang berhasil dibangun/ditingkatkan ke Level ${lumberjackBarracksLvl}! NPC Penebang mulai membuka hutan!`);
}

function tryBuildMinerBarracks() {
  if (builderBarracksLvl < 1) { alert('⚠️ Syarat: Barak Tukang Level 1 harus dibangun terlebih dahulu!'); return; }
  if (mineLvl < 1) { alert('⚠️ Syarat: Fasilitas Tambang Mineral harus dibangun terlebih dahulu!'); return; }
  const cost = Math.floor(400 * Math.pow(1.5, minerBarracksLvl));
  const needWood = 20 + minerBarracksLvl * 5;
  const needStone = 15 + minerBarracksLvl * 5;
  const needIron = 15 + minerBarracksLvl * 5;
  const needSoil = 10 + minerBarracksLvl * 5;
  if (woodCount < needWood || stoneCount < needStone || ironCount < needIron || soilCount < needSoil) {
    alert(`⚠️ Bahan Kurang! Butuh ${needWood} 🪵, ${needStone} 🪨, ${needIron} ⚙️, ${needSoil} 🟤`); return;
  }
  if (!checkAndPayWithGemConversion(cost)) return;
  woodCount -= needWood; stoneCount -= needStone; ironCount -= needIron; soilCount -= needSoil;
  minerBarracksLvl++;
  localStorage.setItem('outpost_miner_lvl', minerBarracksLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_iron', ironCount);
  localStorage.setItem('outpost_soil', soilCount);
  buildMinerBarracksMesh();
  updateHUD();
  alert(`⛏️ Barak Penambang berhasil dibangun/ditingkatkan ke Level ${minerBarracksLvl}! NPC Penambang mulai menambang mineral!`);
}

function tryBuildMine() {
  if (builderBarracksLvl < 1) { alert('⚠️ Syarat: Barak Tukang Level 1 harus dibangun terlebih dahulu!'); return; }
  const cost = Math.floor(250 * Math.pow(1.5, mineLvl));
  if (woodCount < 15 || stoneCount < 15 || ironCount < 5 || soilCount < 10) {
    alert('⚠️ Bahan Kurang! Butuh 15 🪵, 15 🪨, 5 ⚙️, 10 🟤'); return;
  }
  if (!checkAndPayWithGemConversion(cost)) return;
  woodCount -= 15; stoneCount -= 15; ironCount -= 5; soilCount -= 10;
  mineLvl++;
  localStorage.setItem('outpost_mine_lvl', mineLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_iron', ironCount);
  localStorage.setItem('outpost_soil', soilCount);
  buildMineMesh();
  buildMinerNPC(); // respawn miner if barracks exists
  updateHUD();
  alert(`⛏️ Fasilitas Tambang Mineral berhasil dibangun ke Level ${mineLvl}!`);
}

function tryBuildFarm() {
  if (builderBarracksLvl < 1) { alert('⚠️ Syarat: Barak Tukang Level 1 harus dibangun terlebih dahulu!'); return; }
  const cost = Math.floor(200 * Math.pow(1.5, farmLvl));
  if (woodCount < 10 || stoneCount < 5 || soilCount < 20) {
    alert('⚠️ Bahan Kurang! Butuh 10 🪵, 5 🪨, 20 🟤'); return;
  }
  if (!checkAndPayWithGemConversion(cost)) return;
  woodCount -= 10; stoneCount -= 5; soilCount -= 20;
  farmLvl++;
  playerMaxHp += 10;
  playerHp = Math.min(playerHp + 10, playerMaxHp);
  localStorage.setItem('outpost_farm_lvl', farmLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_soil', soilCount);
  buildFarmMesh();
  updateHUD();
  alert(`🌾 Lahan Pertanian berhasil dibangun ke Level ${farmLvl}! Max HP Pemain meningkat menjadi ${playerMaxHp}!`);
}

function tryBuildOilPump() {
  if (techLabLvl < 2) { alert('⚠️ Syarat: Riset Teknologi Level 2 harus dibangun terlebih dahulu!'); return; }
  if (builderBarracksLvl < 1) { alert('⚠️ Syarat: Barak Tukang Level 1 harus dibangun terlebih dahulu!'); return; }
  const cost = Math.floor(500 * Math.pow(1.5, oilPumpLvl));
  if (woodCount < 20 || stoneCount < 20 || ironCount < 20 || soilCount < 10 || rubberCount < 10) {
    alert('⚠️ Bahan Kurang! Butuh 20 🪵, 20 🪨, 20 ⚙️, 10 🟤, 10 ⚫'); return;
  }
  if (!checkAndPayWithGemConversion(cost)) return;
  woodCount -= 20; stoneCount -= 20; ironCount -= 20; soilCount -= 10; rubberCount -= 10;
  oilPumpLvl++;
  localStorage.setItem('outpost_oilpump_lvl', oilPumpLvl);
  localStorage.setItem('outpost_wood', woodCount);
  localStorage.setItem('outpost_stone_res', stoneCount);
  localStorage.setItem('outpost_iron', ironCount);
  localStorage.setItem('outpost_soil', soilCount);
  localStorage.setItem('outpost_rubber', rubberCount);
  buildOilPumpMesh();
  updateHUD();
  alert(`⛽ Pompa Minyak & Karet berhasil dibangun ke Level ${oilPumpLvl}! Menghasilkan 2 Karet & 50 Gold setiap 15 detik!`);
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

  // 2. Cek Riset Teknologi
  if (!targetHit && techLabMesh) {
    const hits = raycaster.intersectObject(techLabMesh, true);
    if (hits.length > 0 && hits[0].distance < 4.5) {
      tryBuildTechLab();
      return;
    }
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
    if (t.lvl >= 1 && techLabLvl < 1) {
      alert('🔒 RISET TEKNOLOGI DIPERLUKAN!\nUpgrade Turret ke Level 2 membutuhkan Bangunan Riset Teknologi Level 1!');
      return;
    }
    if (!checkAndPayWithGemConversion(turretCost)) return;

    t.lvl++;
    updateHUD();
    alert(`🏗️ Turret berhasil ditingkatkan ke Level ${t.lvl}! Kerusakan naik 25% menjadi ${Math.floor(8 * Math.pow(1.25, t.lvl - 1))} per bulet!`);
    return;
  }

  if (targetType === 'fence') {
    const wallCost = Math.floor(250 * Math.pow(1.5, wallLvl - 1));
    if (wallLvl === 2 && techLabLvl < 1) {
      alert('🔒 SYARAT UPGRADE PAGAR LV 3:\nMembutuhkan Bangunan Riset Teknologi Level 1!');
      return;
    }
    if (wallLvl >= 3 && (techLabLvl < 2 || barracksLvl < 1)) {
      alert('🔒 SYARAT UPGRADE PAGAR LV 4+:\nMembutuhkan Bangunan Riset Teknologi Level 2 dan Barak Level 1!');
      return;
    }
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
  const skinMat = new THREE.MeshStandardMaterial({color: 0xfed7aa, roughness: 0.5});
  const shirtColor = isPatrol ? 0x06b6d4 : (currentPhase === 1 ? 0xd97706 : 0xdc2626);
  const shirtMat = new THREE.MeshStandardMaterial({color: shirtColor, roughness: 0.6});
  const pantsMat = new THREE.MeshStandardMaterial({color: 0x1e293b, roughness: 0.7});
  const bootMat = new THREE.MeshStandardMaterial({color: 0x0f172a, roughness: 0.8});

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 0.75, 8), shirtMat);
  torso.position.y = 1.35; g.add(torso);

  // Head & Hair
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.38), skinMat);
  head.position.y = 1.9; g.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.44), new THREE.MeshStandardMaterial({color: 0x3e2723}));
  hair.position.set(0, 2.14, -0.02); g.add(hair);

  // Left Arm + Hand
  const lSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.4, 6), shirtMat);
  lSleeve.position.set(-0.55, 1.5, 0); lSleeve.rotation.z = 0.2; g.add(lSleeve);
  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.4, 6), skinMat);
  lForearm.position.set(-0.65, 1.15, 0); lForearm.rotation.z = 0.2; g.add(lForearm);

  // Right Arm + Hand
  const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.4, 6), shirtMat);
  rSleeve.position.set(0.55, 1.5, 0); rSleeve.rotation.z = -0.2; g.add(rSleeve);
  const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.4, 6), skinMat);
  rForearm.position.set(0.65, 1.15, 0); rForearm.rotation.z = -0.2; g.add(rForearm);

  // Left & Right Legs + Boots
  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.75, 6), pantsMat);
  lLeg.position.set(-0.2, 0.5, 0); g.add(lLeg);
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.35), bootMat);
  lBoot.position.set(-0.2, 0.1, 0.05); g.add(lBoot);

  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.75, 6), pantsMat);
  rLeg.position.set(0.2, 0.5, 0); g.add(rLeg);
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.35), bootMat);
  rBoot.position.set(0.2, 0.1, 0.05); g.add(rBoot);

  // 3D Floating HP Bar Above Head
  const hpBarGroup = new THREE.Group();
  hpBarGroup.position.y = 2.5;
  const bgBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.05), new THREE.MeshBasicMaterial({ color: 0x111827 }));
  hpBarGroup.add(bgBar);
  const fillBar = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
  fillBar.position.z = 0.01;
  hpBarGroup.add(fillBar);
  g.add(hpBarGroup);
  g.userData = { hpBarFill: fillBar, hpBarGroup: hpBarGroup };

  return g;
}

function spawnLootWood() {
  const randRow = Math.floor(Math.random() * 11) + 7; // Baris 7 sampai 17 di luar pagar
  const randCol = Math.floor(Math.random() * 8); // Kolom 0 sampai 7
  const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(colToX(randCol), 0.3, rowToZ(randRow));
  scene.add(mesh);
  woodItems.push({ mesh: mesh, col: randCol, row: randRow });
}

function spawnEnemy(isPatrol = false) {
  const spawnCol = Math.floor(Math.random() * GRID_COLS);
  const spawnRow = isPatrol ? (12 + Math.floor(Math.random() * 4)) : 19;
  const hp = 50; // Nyawa musuh tepat 50 HP

  const eMesh = buildFullHumanoidEnemy(isPatrol);
  eMesh.position.set(colToX(spawnCol), 0, rowToZ(spawnRow));
  scene.add(eMesh);

  enemies.push({
    mesh: eMesh, hp: hp, maxHp: hp, speed: isPatrol ? 0 : 0.032, // 18 detik perjalanan ke pagar
    row: spawnRow, isPatrol: isPatrol, vx: (Math.random() > 0.5 ? 0.03 : -0.03)
  });
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

  if (techLabRadarRing) techLabRadarRing.rotation.z += 0.04;
  if (builderHammerGroup) {
    builderHammerGroup.rotation.z = Math.sin(gameTick * 0.15) * 0.4;
    if (gameTick % 30 === 0 && builderBarracksLvl > 0) {
      if (fenceHp < fenceMaxHp) {
        fenceHp = Math.min(fenceMaxHp, fenceHp + 0.5 * builderBarracksLvl);
        updateHUD();
      }
    }
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

  // === NPC LUMBERJACK AI (Penebang Pohon) ===
  if (lumberjackBarracksLvl > 0 && lumberjackMesh) {
    const lumberjackSpeed = 1.0 + (lumberjackBarracksLvl - 1) * 0.1;
    lumberjackTimer++;
    const clearInterval = Math.floor(1800 / lumberjackSpeed); // 30s base at 60fps
    if (lumberjackTimer >= clearInterval) {
      lumberjackTimer = 0;
      clearedGridCount++;
      woodCount += 5;
      rubberCount += 3;
      localStorage.setItem('outpost_cleared_grids', clearedGridCount);
      localStorage.setItem('outpost_wood', woodCount);
      localStorage.setItem('outpost_rubber', rubberCount);
      updateHUD();
    }
    // Animate lumberjack chopping
    if (lumberjackMesh.children.length > 0) {
      const lastChild = lumberjackMesh.children[lumberjackMesh.children.length - 1];
      if (lastChild.isGroup) lastChild.rotation.z = Math.sin(gameTick * 0.12) * 0.5;
    }
  }

  // === NPC MINER AI (Penambang Mineral) ===
  if (minerBarracksLvl > 0 && mineLvl > 0 && minerMesh) {
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
      if (lastChild.isGroup) lastChild.rotation.z = Math.sin(gameTick * 0.1) * 0.45;
    }
  }

  // === OIL PUMP AUTO-PRODUCTION ===
  if (oilPumpLvl > 0) {
    oilPumpTimer++;
    if (oilPumpTimer >= 900) { // 15 detik
      oilPumpTimer = 0;
      rubberCount += 2;
      gold += 50;
      localStorage.setItem('outpost_rubber', rubberCount);
      localStorage.setItem('outpost_gold', Math.floor(gold));
      updateHUD();
    }
  }

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

  // Tower tracking & shooting dengan peningkatan Atk Spd 25% per level
  towers.forEach(t => {
    if (enemies.length > 0 && t.head) {
      const target = enemies[0];
      const dx = target.mesh.position.x - t.mesh.position.x;
      const dz = target.mesh.position.z - t.mesh.position.z;
      t.head.rotation.y = Math.atan2(dx, dz) + Math.PI;
    } else if (t.head) {
      t.head.rotation.y += 0.015;
    }

    const tCooldown = Math.max(2, Math.floor(10 / Math.pow(1.25, t.lvl - 1)));
    if (gameTick % tCooldown === 0 && enemies.length > 0) {
      const target = enemies[0];
      const bGeo = new THREE.SphereGeometry(0.25);
      const bMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.copy(t.mesh.position).y += 1.4;
      scene.add(bMesh);
      const dir = target.mesh.position.clone().sub(bMesh.position).normalize().multiplyScalar(1.2);
      const tDmg = Math.floor(8 * Math.pow(1.25, t.lvl - 1));
      bullets.push({ mesh: bMesh, dir: dir, dmg: tDmg });
    }
  });

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.mesh.position.add(b.dir);
    if (b.mesh.position.z < -60 || b.mesh.position.z > 10) {
      scene.remove(b.mesh); bullets.splice(i, 1); continue;
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      let e = enemies[j];
      if (b.mesh.position.distanceTo(e.mesh.position) < 1.4) {
        e.hp -= b.dmg;
        scene.remove(b.mesh); bullets.splice(i, 1);
        if (e.hp <= 0) {
          gold += 1; // Tepat 1 Gold per kill
          updateHUD();
          scene.remove(e.mesh); enemies.splice(j, 1);
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
      if (e.mesh.position.x < colToX(0) || e.mesh.position.x > colToX(7)) e.vx *= -1;
    } else {
      // Penargetan dinamis ke 4 objek terdekat: Player, Pagar, Turret/Tech Lab, atau Core Stone
      let dPlayer = e.mesh.position.distanceTo(camera.position);
      let dFence = fenceHp > 0 ? Math.abs(e.mesh.position.z - rowToZ(5)) : Infinity;
      let dStone = stoneHp > 0 ? e.mesh.position.distanceTo(stoneMesh.position) : Infinity;
      let dBuild = Infinity;
      let targetBuilding = null;

      towers.forEach(t => {
        if ((t.hp || 50) > 0) {
          let d = e.mesh.position.distanceTo(t.mesh.position);
          if (d < dBuild) { dBuild = d; targetBuilding = t; }
        }
      });

      let minD = Math.min(dPlayer, dFence, dBuild, dStone);

      if (minD === dPlayer) {
        // Menargetkan Player jika paling dekat
        const dirP = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
        dirP.y = 0;
        if (dirP.length() > 1.6) {
          dirP.normalize();
          e.mesh.position.addScaledVector(dirP, e.speed);
        } else {
          playerHp -= 0.05;
          if (gameTick % 15 === 0) updateHUD();
          if (playerHp <= 0) {
            alert("⚠️ KARAKTER ANDA GUGUR DI SERANG MUSUH! Respawn darurat di dalam pos...");
            playerHp = playerMaxHp;
            playerX = colToX(3.5); playerZ = rowToZ(3);
            camera.position.set(playerX, CAMERA_HEIGHT, playerZ);
            updateHUD();
          }
        }
      } else if (minD === dBuild && targetBuilding) {
        // Menargetkan Bangunan Turret
        const dirB = new THREE.Vector3().subVectors(targetBuilding.mesh.position, e.mesh.position);
        dirB.y = 0;
        if (dirB.length() > 1.8) {
          dirB.normalize();
          e.mesh.position.addScaledVector(dirB, e.speed);
        } else {
          targetBuilding.hp = (targetBuilding.hp || 50) - 0.08;
          if (targetBuilding.hp <= 0) {
            scene.remove(targetBuilding.mesh);
            towers = towers.filter(tw => tw !== targetBuilding);
            grid[targetBuilding.row][targetBuilding.col] = null;
          }
        }
      } else if (minD === dFence) {
        // Menargetkan Pagar
        if (e.mesh.position.z < rowToZ(5.2)) {
          e.mesh.position.z += e.speed;
        } else {
          fenceHp -= 0.08;
          if (gameTick % 15 === 0) updateHUD();
          if (fenceHp <= 0) buildBarricadeWall();
        }
      } else {
        // Menargetkan Core Stone
        const dirS = new THREE.Vector3().subVectors(stoneMesh.position, e.mesh.position);
        dirS.y = 0;
        if (dirS.length() > 2.0) {
          dirS.normalize();
          e.mesh.position.addScaledVector(dirS, e.speed);
        } else {
          stoneHp -= 0.25;
          if (gameTick % 15 === 0) updateHUD();
          if (stoneHp <= 0) { triggerCoreStoneStolen(); return; }
        }
      }
    }
  }

  // Animations
  if (pistolRecoilAnim > 0) {
    if (pistolGroup) pistolGroup.position.z = -0.5;
    pistolRecoilAnim--;
  } else {
    if (pistolGroup) pistolGroup.position.z = -0.6;
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

// Modal Penyimpanan Senjata [E] & Navigasi
function openEquipment() {
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
    const btn = document.createElement('button');
    btn.className = 'btn-pc';
    btn.style.padding = '8px 12px';
    btn.style.fontSize = '12px';
    btn.style.whiteSpace = 'nowrap';
    btn.style.background = (idx === selectedPreviewWeaponIdx) ? '#3b82f6' : '#1e293b';
    btn.style.border = (idx === selectedPreviewWeaponIdx) ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)';
    btn.innerText = st.name || wKey;
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
  const hdr = document.getElementById('preview-wep-header');
  if (hdr) hdr.innerText = st.name || wKey;
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
  if (pDsc) pDsc.innerText = st.desc || '';
}

function equipCurrentPreview() {
  const wKey = weaponsOrder[selectedPreviewWeaponIdx];
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
    tryBuildTechLab();
  } else if (val === 'barrack') {
    const cost = Math.floor(400 * Math.pow(1.5, barracksLvl));
    if (woodCount < 5) {
      alert(`⚠️ Kayu Kurang! Membangun/Upgrade Barak membutuhkan 5 Kayu (Anda punya ${woodCount} 🪵).`);
      return;
    }
    if (!checkAndPayWithGemConversion(cost)) return;
    woodCount -= 5;
    barracksLvl++;
    localStorage.setItem('outpost_barracks_lvl', barracksLvl);
    localStorage.setItem('outpost_wood', woodCount);
    updateHUD();
    alert(`⛺ Barak Pertahanan Pasukan berhasil ditingkatkan ke Level ${barracksLvl}! Membuka batas upgrade Pagar pos!`);
  } else if (val === 'builder_barrack') {
    tryBuildBuilderBarracks();
  } else if (val === 'lumberjack') {
    tryBuildLumberjackBarracks();
  } else if (val === 'miner') {
    tryBuildMinerBarracks();
  } else if (val === 'mine') {
    tryBuildMine();
  } else if (val === 'farm') {
    tryBuildFarm();
  } else if (val === 'oilpump') {
    tryBuildOilPump();
  }
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

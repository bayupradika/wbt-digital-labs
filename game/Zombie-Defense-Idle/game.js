// Core Stone 3D FPS Engine using Three.js WebGL
const container = document.getElementById('webgl-container');
const canvas = document.getElementById('gameCanvas');

// Game Persistent State & Story Lore
let gold = parseInt(localStorage.getItem('outpost_gold') || '400');
let gems = parseInt(localStorage.getItem('outpost_gems') || '50');
let currentPhase = parseInt(localStorage.getItem('corestone_phase') || '1');
let isLockedOut = localStorage.getItem('corestone_locked') === 'true';

if (!localStorage.getItem('outpost_init_v2')) {
  gold = 100; // Starter gold pas 100 untuk bangun 1 turret
  gems = Math.max(gems, 50);
  localStorage.setItem('outpost_init_v2', 'true');
  localStorage.setItem('outpost_gold', '100');
  localStorage.setItem('outpost_gems', gems);
}

let techLabBuilt = localStorage.getItem('outpost_tech_lab') === 'true';
let techLabMesh = null;

// Infinite Upgrade Levels
let knifeLvl = parseInt(localStorage.getItem('outpost_knife_lvl') || '1');
let pistolLvl = parseInt(localStorage.getItem('outpost_pistol_lvl') || '1');
let wallLvl = parseInt(localStorage.getItem('outpost_wall_lvl') || '1');
let stoneLvl = parseInt(localStorage.getItem('outpost_stone_lvl') || '1');
let survivorLvl = parseInt(localStorage.getItem('outpost_survivor_lvl') || '1');

// Separated Health Pools
let fenceMaxHp = 100 + (wallLvl - 1) * 60;
let fenceHp = fenceMaxHp;
let stoneMaxHp = 200 + (stoneLvl - 1) * 100;
let stoneHp = stoneMaxHp;

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
    // Holographic Construction Blueprint Pad
    const padGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
    const padMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.08;
    techLabMesh.add(pad);

    const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const p = new THREE.Mesh(pillarGeo, padMat);
      p.position.set(Math.cos(angle) * 1.0, 0.75, Math.sin(angle) * 1.0);
      techLabMesh.add(p);
    }
  } else {
    // Built Tech Lab 3D Building
    const baseGeo = new THREE.BoxGeometry(2.2, 1.8, 2.2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.9;
    techLabMesh.add(base);

    // Glowing Neon Dome
    const domeGeo = new THREE.SphereGeometry(0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 1.8;
    techLabMesh.add(dome);

    // Spinning Radar Antenna
    const antGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.y = 2.4;
    techLabMesh.add(ant);
  }

  scene.add(techLabMesh);
  grid[1][2] = { type: 'tech_lab', built: techLabBuilt };
}

function buildFPSArms() {
  scene.add(camera);

  // Left Hand: Survival Knife
  knifeGroup = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(0.06, 0.45, 0.04);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.y = 0.25;
  knifeGroup.add(blade);
  const hGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2);
  const hMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
  const h = new THREE.Mesh(hGeo, hMat);
  knifeGroup.add(h);
  knifeGroup.position.set(-0.35, -0.3, -0.65);
  knifeGroup.rotation.z = 0.2;
  knifeGroup.rotation.x = 0.4;
  camera.add(knifeGroup);

  // Right Hand: Tactical Pistol
  pistolGroup = new THREE.Group();
  const barrelGeo = new THREE.BoxGeometry(0.08, 0.12, 0.4);
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.3 });
  const barrel = new THREE.Mesh(barrelGeo, gunMat);
  pistolGroup.add(barrel);
  const gripGeo = new THREE.BoxGeometry(0.07, 0.2, 0.1);
  const grip = new THREE.Mesh(gripGeo, gunMat);
  grip.position.set(0, -0.12, 0.1);
  grip.rotation.x = 0.3;
  pistolGroup.add(grip);
  pistolGroup.position.set(0.32, -0.25, -0.6);
  camera.add(pistolGroup);

  // Muzzle Flash
  const flashGeo = new THREE.SphereGeometry(0.12);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlashMesh.position.set(0, 0, -0.3);
  muzzleFlashMesh.visible = false;
  pistolGroup.add(muzzleFlashMesh);
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
  document.getElementById('gold-display').innerText = gold.toLocaleString('id-ID');
  document.getElementById('gem-display').innerText = gems.toLocaleString('id-ID');

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
}

function startGame() {
  isLockedOut = false;
  localStorage.setItem('corestone_locked', 'false');
  document.getElementById('start-screen').classList.add('hidden');
  const lockoutEl = document.getElementById('lockout-screen');
  if (lockoutEl) lockoutEl.classList.add('hidden');

  fenceMaxHp = 100 + (wallLvl - 1) * 60; fenceHp = fenceMaxHp;
  stoneMaxHp = 200 + (stoneLvl - 1) * 100; stoneHp = stoneMaxHp;
  buildBarricadeWall();
  enemies.forEach(e => scene.remove(e.mesh)); enemies = [];
  bullets.forEach(b => scene.remove(b.mesh)); bullets = [];
  towers.forEach(t => scene.remove(t.mesh)); towers = [];
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

canvas.addEventListener('mousedown', e => {
  if (!gameRunning) return;
  isMouseDragging = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
  if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
  fireFPSPistol();
});

window.addEventListener('mouseup', () => { isMouseDragging = false; });

canvas.addEventListener('mousemove', e => {
  if (!gameRunning) return;
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
    moveX = e.movementX || 0;
    moveY = e.movementY || 0;
  }

  if (moveX !== 0 || moveY !== 0) {
    cameraYaw -= moveX * 0.0035;
    cameraPitch -= moveY * 0.0035;
    cameraPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraPitch));
    camera.rotation.set(cameraPitch, cameraYaw, 0, 'YXZ');
  }
});

let playerFireCooldown = 0;

function fireFPSPistol() {
  if (playerFireCooldown > 0) return; // Max attack speed: 2 bullets per second (30 ticks cooldown)
  playerFireCooldown = 30;

  pistolRecoilAnim = 10;
  muzzleFlashMesh.visible = true;
  setTimeout(() => { if (muzzleFlashMesh) muzzleFlashMesh.visible = false; }, 60);

  const bulletGeo = new THREE.SphereGeometry(0.18);
  const bulletMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const bMesh = new THREE.Mesh(bulletGeo, bulletMat);

  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyQuaternion(camera.quaternion);

  bMesh.position.copy(camera.position).addScaledVector(dir, 0.8);
  scene.add(bMesh);
  bullets.push({ mesh: bMesh, dir: dir.clone().multiplyScalar(1.5), dmg: 10 }); // Fixed 10 damage per bullet
}

// Smooth Continuous WASD & Shortcuts Tracking
window.addEventListener('keydown', e => {
  keysPressed[e.key.toUpperCase()] = true;
  if (!gameRunning) return;
  const k = e.key.toUpperCase();
  if (k === 'T') tryBuildTower();
  if (k === 'R') tryBuildTechLab();
  if (k === 'U') tryProximityUpgrade();
  if (k === 'I') toggleInventory();
  if (e.key === 'Escape') closeInventory();
});

window.addEventListener('keyup', e => {
  keysPressed[e.key.toUpperCase()] = false;
});

function handleSmoothPlayerMovement() {
  const moveSpeed = 0.12;
  let fwd = 0;
  let side = 0;

  if (keysPressed['W'] || keysPressed['ARROWUP']) fwd += moveSpeed;
  if (keysPressed['S'] || keysPressed['ARROWDOWN']) fwd -= moveSpeed;
  if (keysPressed['A'] || keysPressed['ARROWLEFT']) side -= moveSpeed;
  if (keysPressed['D'] || keysPressed['ARROWRIGHT']) side += moveSpeed;

  if (fwd !== 0 || side !== 0) {
    const sinY = Math.sin(cameraYaw);
    const cosY = Math.cos(cameraYaw);

    // Calculate movement vector relative to camera 360 facing angle
    let dx = -fwd * sinY + side * cosY;
    let dz = -fwd * cosY - side * sinY;

    let nextX = playerX + dx;
    let nextZ = playerZ + dz;

    // Bound inside Safe Zone (Cols 0..7 -> X = -8.75 to +8.75, Rows 1..4.5 -> Z = -2.0 to -11.0)
    nextX = Math.max(colToX(0), Math.min(colToX(7), nextX));
    nextZ = Math.max(rowToZ(4.5), Math.min(rowToZ(1), nextZ));

    // Solid Collider Check vs Grid Objects
    let targetCol = Math.max(0, Math.min(7, xToCol(nextX)));
    let targetRow = Math.max(0, Math.min(19, zToRow(nextZ)));
    
    if (grid[targetRow][targetCol] === null) {
      playerX = nextX;
      playerZ = nextZ;
    } else {
      // Allow sliding along open axis if blocked diagonally
      if (grid[zToRow(playerZ)][targetCol] === null) playerX = nextX;
      if (grid[targetRow][xToCol(playerX)] === null) playerZ = nextZ;
    }

    camera.position.set(playerX, CAMERA_HEIGHT, playerZ);
  }
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

function tryBuildTower() {
  if (towers.length >= 1) {
    alert('⚠️ Batas Pembangunan: Anda hanya bisa membangun maksimal 1 Turret di Pos saat ini!');
    return;
  }
  if (gold < 100) {
    alert('⚠️ Gold tidak cukup! Membangun Turret membutuhkan 100 Gold.');
    return;
  }

  let currentCol = Math.max(0, Math.min(7, xToCol(playerX)));
  let currentRow = Math.max(1, Math.min(4, zToRow(playerZ)));
  let frontRow = currentRow + 1;

  if (frontRow > 4 || grid[frontRow][currentCol] !== null) return;
  gold -= 100;

  const tObj = buildSciFiTurretTower();
  tObj.group.position.set(colToX(currentCol), 0, rowToZ(frontRow));
  scene.add(tObj.group);

  const newTower = { col: currentCol, row: frontRow, lvl: 1, mesh: tObj.group, head: tObj.head };
  towers.push(newTower);
  grid[frontRow][currentCol] = newTower;
  updateHUD();
}

function tryBuildTechLab() {
  if (techLabBuilt) {
    alert('✅ Bangunan Riset Teknologi sudah beroperasi!');
    return;
  }
  if (gold < 150) {
    alert('⚠️ Gold tidak cukup! Membangun Bangunan Riset Teknologi membutuhkan 150 Gold.');
    return;
  }
  gold -= 150;
  techLabBuilt = true;
  localStorage.setItem('outpost_tech_lab', 'true');
  buildTechLabMesh();
  updateHUD();
  alert('🔬 Riset Teknologi berhasil dibangun! Sekarang Anda memenuhi syarat untuk meningkatkan Turret dan Pagar ke Level 2+!');
}

function tryProximityUpgrade() {
  let currentRow = zToRow(playerZ);
  let currentCol = xToCol(playerX);

  // 1. Cek di dekat Bangunan Riset Teknologi (Kolom 2, Baris 1-2)
  if (currentRow <= 2 && Math.abs(currentCol - 2) <= 1.5 && !techLabBuilt) {
    tryBuildTechLab();
    return;
  }

  // 2. Cek di dekat Pagar (Baris 4-5)
  if (currentRow >= 3.5) {
    const wallCost = 250 * wallLvl;
    if (wallLvl >= 1 && !techLabBuilt) {
      alert('🔒 RISET TEKNOLOGI DIPERLUKAN!\nAnda harus membangun Bangunan Riset Teknologi (Tekan [R] dekat pos, 150 Gold) terlebih dahulu sebelum bisa meningkatkan Pagar ke Level ' + (wallLvl + 1) + '!');
      return;
    }
    if (gold < wallCost) {
      alert('⚠️ Gold tidak cukup! Upgrade Pagar ke Lv ' + (wallLvl + 1) + ' membutuhkan ' + wallCost + ' Gold.');
      return;
    }
    gold -= wallCost;
    wallLvl++;
    fenceMaxHp += 100;
    fenceHp = fenceMaxHp;
    buildBarricadeWall();
    localStorage.setItem('outpost_wall_lvl', wallLvl);
    updateHUD();
    alert('🛡️ Pagar berhasil ditingkatkan ke Level ' + wallLvl + '!');
    return;
  }

  // 3. Cek di dekat Turret
  if (towers.length > 0) {
    let t = towers[0];
    if (Math.abs(currentRow - t.row) <= 1.5 && Math.abs(currentCol - t.col) <= 1.5) {
      const turretCost = 250 * t.lvl;
      if (t.lvl >= 1 && !techLabBuilt) {
        alert('🔒 RISET TEKNOLOGI DIPERLUKAN!\nAnda harus membangun Bangunan Riset Teknologi (Tekan [R] dekat pos, 150 Gold) terlebih dahulu sebelum bisa meningkatkan Turret ke Level ' + (t.lvl + 1) + '!');
        return;
      }
      if (gold < turretCost) {
        alert('⚠️ Gold tidak cukup! Upgrade Turret ke Lv ' + (t.lvl + 1) + ' membutuhkan ' + turretCost + ' Gold.');
        return;
      }
      gold -= turretCost;
      t.lvl++;
      updateHUD();
      alert('🏗️ Turret berhasil ditingkatkan ke Level ' + t.lvl + '! Kerusakan kini ' + (t.lvl * 8) + ' per tembakan!');
      return;
    }
  }

  alert('💡 Petunjuk Upgrade:\n- Mepet ke Turret lalu tekan [U] untuk upgrade Turret (250 Gold x Lv).\n- Mepet ke Pagar lalu tekan [U] untuk upgrade Pagar (250 Gold x Lv).\n- Tekan [R] di dekat Kolom 2 untuk membangun Riset Teknologi (150 Gold).');
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

function spawnEnemy(isPatrol = false) {
  const spawnCol = Math.floor(Math.random() * GRID_COLS);
  const spawnRow = isPatrol ? (12 + Math.floor(Math.random() * 4)) : 19;
  const hp = 50; // Fixed 50 HP per enemy as specified

  const eMesh = buildFullHumanoidEnemy(isPatrol);
  eMesh.position.set(colToX(spawnCol), 0, rowToZ(spawnRow));
  scene.add(eMesh);

  enemies.push({
    mesh: eMesh, hp: hp, maxHp: hp, speed: isPatrol ? 0 : 0.045,
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

  if (playerFireCooldown > 0) playerFireCooldown--;

  handleSmoothPlayerMovement();

  // Regular Spawn
  attackerSpawnTimer++;
  if (attackerSpawnTimer >= 1200) { spawnEnemy(false); attackerSpawnTimer = 0; }
  patrolSpawnTimer++;
  if (patrolSpawnTimer >= 3600) { spawnEnemy(true); patrolSpawnTimer = 0; }

  // 1. Setiap 5 Menit (18000 ticks di 60 FPS) Muncul 10 Musuh Serentak
  if (gameTick > 0 && gameTick % 18000 === 0) {
    for (let w = 0; w < 10; w++) spawnEnemy(false);
  }

  // 2. Setiap Jam 19:00 Malam Muncul 1800 Musuh dalam 1 Jam (1 musuh per 2 detik / 120 ticks)
  const nowHour = new Date().getHours();
  if ((nowHour === 19 || isSimulating1900) && gameTick % 120 === 0) {
    spawnEnemy(false);
  }

  // Tower tracking & shooting (3x lebih cepat dari user = setiap 10 ticks, kerusakan 8)
  towers.forEach(t => {
    if (enemies.length > 0 && t.head) {
      const target = enemies[0];
      const dx = target.mesh.position.x - t.mesh.position.x;
      const dz = target.mesh.position.z - t.mesh.position.z;
      t.head.rotation.y = Math.atan2(dx, dz) + Math.PI;
    } else if (t.head) {
      t.head.rotation.y += 0.015; // Idle radar scan
    }
  });

  if (gameTick % 10 === 0 && enemies.length > 0) {
    towers.forEach(t => {
      const target = enemies[0];
      const bGeo = new THREE.SphereGeometry(0.25);
      const bMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.copy(t.mesh.position).y += 1.4;
      scene.add(bMesh);
      const dir = target.mesh.position.clone().sub(bMesh.position).normalize().multiplyScalar(1.2);
      bullets.push({ mesh: bMesh, dir: dir, dmg: 8 }); // Kerusakan turret 8 per bullet
    });
  }

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
          gold += 25 * currentPhase; updateHUD();
          scene.remove(e.mesh); enemies.splice(j, 1);
        }
        break;
      }
    }
  }

  // Update enemies & Floating HP Bar LookAt
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    
    // Floating HP Bar dynamic update
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
      if (e.mesh.position.z > rowToZ(5) || fenceHp <= 0) {
        e.mesh.position.z += e.speed;
      } else {
        fenceHp -= 0.1; updateHUD();
        if (fenceHp <= 0) buildBarricadeWall();
      }
      if (e.mesh.position.z >= rowToZ(1)) {
        stoneHp -= 0.3; updateHUD();
        if (stoneHp <= 0) { triggerCoreStoneStolen(); return; }
      }
    }
  }

  // Animations
  if (pistolRecoilAnim > 0) {
    pistolGroup.position.z = -0.5; pistolRecoilAnim--;
  } else {
    pistolGroup.position.z = -0.6;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function openTopup() { document.getElementById('topup-modal').classList.add('active'); }
function closeTopup() { document.getElementById('topup-modal').classList.remove('active'); }
function buyGems(n, p, a) {
  MidtransPay.checkout({ itemName: n, price: p, onSuccess: () => { gems += a; updateHUD(); closeTopup(); } });
}

function openInventory() {
  if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock();
  const modal = document.getElementById('inventory-modal');
  if (modal) {
    document.getElementById('inv-gold-val').innerText = gold.toLocaleString('id-ID');
    document.getElementById('inv-gem-val').innerText = gems.toLocaleString('id-ID');
    modal.classList.add('active');
  }
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

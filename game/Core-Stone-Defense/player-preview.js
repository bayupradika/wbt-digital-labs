// ==========================================
// TRIPO 3D PLAYER MODEL PREVIEW & ANIMATION STUDIO
// Model: Athletic Male Figure Facing Forward With Arms Extended Wearing Black
// ID: bb1388b7-64dc-4c61-83da-58c3c81d6266
// ==========================================

let previewScene, previewCamera, previewRenderer, previewControls;
let previewModel = null;
let previewBones = {};
let previewInitialRot = {};
let previewAnimState = 'idle';
let previewAnimClock = 0;
let previewRifleGroup = null;
let previewKnifeGroup = null;
let isPreviewInitialized = false;

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initPlayerPreview, 100);
});

function initPlayerPreview() {
  const canvas = document.getElementById('preview-3d-canvas');
  if (!canvas) return;
  if (isPreviewInitialized) return;
  isPreviewInitialized = true;

  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x0f172a);
  previewScene.fog = new THREE.FogExp2(0x0f172a, 0.05);

  previewCamera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  previewCamera.position.set(0, 1.25, 3.6);
  previewCamera.lookAt(0, 0.9, 0);

  previewRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  previewRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  previewRenderer.shadowMap.enabled = true;
  previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Orbit controls for user dragging/rotating preview
  if (typeof THREE.OrbitControls !== 'undefined') {
    previewControls = new THREE.OrbitControls(previewCamera, canvas);
    previewControls.target.set(0, 0.9, 0);
    previewControls.enablePan = false;
    previewControls.minDistance = 1.6;
    previewControls.maxDistance = 5.5;
    previewControls.maxPolarAngle = Math.PI / 2 + 0.05;
    previewControls.update();
  } else {
    // Simple drag fallback if OrbitControls isn't loaded yet
    let isDragging = false;
    let prevX = 0;
    canvas.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; });
    window.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging || !previewModel) return;
      const deltaX = e.clientX - prevX;
      previewModel.rotation.y += deltaX * 0.01;
      prevX = e.clientX;
    });
  }

  // Lighting setup for high-tech sci-fi look
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
  previewScene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
  dirLight.position.set(3, 6, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  previewScene.add(dirLight);

  const rimLightPurple = new THREE.PointLight(0xa855f7, 2.5, 8);
  rimLightPurple.position.set(-2.5, 2.0, -2.0);
  previewScene.add(rimLightPurple);

  const rimLightCyan = new THREE.PointLight(0x38bdf8, 2.5, 8);
  rimLightCyan.position.set(2.5, 1.2, 2.0);
  previewScene.add(rimLightCyan);

  // Platform
  if (typeof THREE.PolarGridHelper !== 'undefined') {
    const gridHelper = new THREE.PolarGridHelper(2.2, 16, 8, 64, 0xa855f7, 0x38bdf8);
    gridHelper.position.y = 0.01;
    previewScene.add(gridHelper);
  } else {
    const gridHelper = new THREE.GridHelper(4, 16, 0xa855f7, 0x38bdf8);
    gridHelper.position.y = 0.01;
    previewScene.add(gridHelper);
  }

  const discGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.04, 32);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = -0.02;
  disc.receiveShadow = true;
  previewScene.add(disc);

  // Build weapons to attach during preview
  buildPreviewWeapons();

  // Load GLB Model
  loadTripoCharacterModel();

  // Animation loop for preview
  requestAnimationFrame(animatePreviewLoop);

  // Resize handler
  window.addEventListener('resize', () => {
    if (!canvas || !previewCamera || !previewRenderer) return;
    previewCamera.aspect = canvas.clientWidth / canvas.clientHeight;
    previewCamera.updateProjectionMatrix();
    previewRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}

function buildPreviewWeapons() {
  // Sci-Fi Rifle
  previewRifleGroup = new THREE.Group();
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.2 });
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.65), gunMat);
  barrel.position.set(0, 0, 0.2);
  previewRifleGroup.add(barrel);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.08, 0.15);
  previewRifleGroup.add(scope);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.08), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
  mag.position.set(0, -0.1, 0.1);
  mag.rotation.x = -0.2;
  previewRifleGroup.add(mag);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), gunMat);
  grip.position.set(0, -0.08, -0.08);
  grip.rotation.x = 0.3;
  previewRifleGroup.add(grip);
  previewRifleGroup.visible = false;
  previewScene.add(previewRifleGroup);

  // Plasma Knife
  previewKnifeGroup = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  previewKnifeGroup.add(handle);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.3, 0.04), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
  blade.position.set(0, 0.2, 0);
  previewKnifeGroup.add(blade);
  previewKnifeGroup.visible = false;
  previewScene.add(previewKnifeGroup);
}

function loadTripoCharacterModel() {
  const badge = document.getElementById('preview-loader-badge');
  if (typeof THREE.GLTFLoader === 'undefined') {
    if (badge) badge.innerText = '❌ Error: GLTFLoader belum dimuat.';
    return;
  }

  const loader = new THREE.GLTFLoader();
  if (typeof MeshoptDecoder !== 'undefined' && loader.setMeshoptDecoder) {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }

  const modelPath = 'assets/models/player_tripo.glb';

  loader.load(modelPath, (gltf) => {
    if (badge) badge.style.display = 'none';
    previewModel = gltf.scene;

    previewModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Compute bounding box and normalize scale (~1.78m human height)
    const box = new THREE.Box3().setFromObject(previewModel);
    const height = box.max.y - box.min.y;
    if (height > 0.001) {
      const targetScale = 1.78 / height;
      previewModel.scale.set(targetScale, targetScale, targetScale);
    }

    // Align feet exactly on the platform at y = 0
    const boxAfter = new THREE.Box3().setFromObject(previewModel);
    previewModel.position.y = -boxAfter.min.y;
    previewModel.position.x = 0;
    previewModel.position.z = 0;

    // Cache bones and rest rotations
    const boneNames = [
      'L_Thigh', 'R_Thigh', 'L_Calf', 'R_Calf', 'L_Foot', 'R_Foot',
      'L_Upperarm', 'R_Upperarm', 'L_Forearm', 'R_Forearm', 'L_Hand', 'R_Hand',
      'Spine01', 'Spine02', 'Waist', 'Pelvis', 'NeckTwist01', 'Head'
    ];
    boneNames.forEach((name) => {
      const bone = previewModel.getObjectByName(name);
      if (bone) {
        previewBones[name] = bone;
        previewInitialRot[name] = bone.rotation.clone();
      }
    });

    previewScene.add(previewModel);
    setPreviewAnim('idle');
  }, (progress) => {
    if (badge && progress.total > 0) {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      badge.innerText = `⏳ Memuat Model 3D (${pct}%)...`;
    }
  }, (err) => {
    console.error('Error loading Tripo model in preview:', err);
    if (badge) badge.innerText = '❌ Gagal memuat model. Periksa koneksi atau CORS.';
  });
}

function setPreviewAnim(animType, btnEl) {
  previewAnimState = animType;
  if (btnEl) {
    const allBtns = document.querySelectorAll('.btn-preview');
    allBtns.forEach(b => {
      b.style.background = '#1e293b';
      b.style.color = '#e2e8f0';
      b.style.border = '1px solid #334155';
    });
    btnEl.style.background = '#38bdf8';
    btnEl.style.color = '#0f172a';
    btnEl.style.border = 'none';
  }

  // Update weapon visibility based on stance
  if (previewRifleGroup && previewKnifeGroup) {
    if (animType === 'rifle') {
      previewRifleGroup.visible = true;
      previewKnifeGroup.visible = false;
    } else if (animType === 'knife') {
      previewRifleGroup.visible = false;
      previewKnifeGroup.visible = true;
    } else {
      previewRifleGroup.visible = false;
      previewKnifeGroup.visible = false;
    }
  }

  // Reset bones to initial rest pose
  for (const [name, bone] of Object.entries(previewBones)) {
    if (previewInitialRot[name]) {
      bone.rotation.copy(previewInitialRot[name]);
    }
  }
}

function animatePreviewLoop(timestamp) {
  requestAnimationFrame(animatePreviewLoop);
  previewAnimClock += 0.016;

  if (previewControls) {
    previewControls.update();
  }

  if (previewModel) {
    applyCharacterSkeletalAnimation(previewModel, previewBones, previewInitialRot, previewAnimState, previewAnimClock, previewRifleGroup, previewKnifeGroup);
  }

  if (previewRenderer && previewScene && previewCamera) {
    previewRenderer.render(previewScene, previewCamera);
  }
}

// Shared procedural kinematics engine used by both Preview and In-Game Player
function applyCharacterSkeletalAnimation(model, bones, initRot, state, time, rifleGroup, knifeGroup) {
  if (!bones || Object.keys(bones).length === 0) return;

  const getRot = (name) => initRot[name] || new THREE.Euler();

  // Reset core bone positions before applying state offsets
  if (bones['L_Thigh']) bones['L_Thigh'].rotation.copy(getRot('L_Thigh'));
  if (bones['R_Thigh']) bones['R_Thigh'].rotation.copy(getRot('R_Thigh'));
  if (bones['L_Calf']) bones['L_Calf'].rotation.copy(getRot('L_Calf'));
  if (bones['R_Calf']) bones['R_Calf'].rotation.copy(getRot('R_Calf'));
  if (bones['L_Upperarm']) bones['L_Upperarm'].rotation.copy(getRot('L_Upperarm'));
  if (bones['R_Upperarm']) bones['R_Upperarm'].rotation.copy(getRot('R_Upperarm'));
  if (bones['L_Forearm']) bones['L_Forearm'].rotation.copy(getRot('L_Forearm'));
  if (bones['R_Forearm']) bones['R_Forearm'].rotation.copy(getRot('R_Forearm'));
  if (bones['Spine01']) bones['Spine01'].rotation.copy(getRot('Spine01'));
  if (bones['Head']) bones['Head'].rotation.copy(getRot('Head'));

  const baseRotLThigh = getRot('L_Thigh');
  const baseRotRThigh = getRot('R_Thigh');
  const baseRotLCalf = getRot('L_Calf');
  const baseRotRCalf = getRot('R_Calf');
  const baseRotLUpper = getRot('L_Upperarm');
  const baseRotRUpper = getRot('R_Upperarm');
  const baseRotLFore = getRot('L_Forearm');
  const baseRotRFore = getRot('R_Forearm');
  const baseRotSpine = getRot('Spine01');
  const baseRotHead = getRot('Head');

  if (state === 'idle') {
    // Subtle breathing & natural standing posture
    if (bones['Spine01']) bones['Spine01'].rotation.x = baseRotSpine.x + Math.sin(time * 2.2) * 0.04;
    if (bones['L_Upperarm']) bones['L_Upperarm'].rotation.z = baseRotLUpper.z + Math.sin(time * 2.2) * 0.03;
    if (bones['R_Upperarm']) bones['R_Upperarm'].rotation.z = baseRotRUpper.z - Math.sin(time * 2.2) * 0.03;
    if (bones['Head']) bones['Head'].rotation.y = baseRotHead.y + Math.sin(time * 1.5) * 0.08;
    if (model) model.position.y = Math.sin(time * 2.2) * 0.01;
  } 
  else if (state === 'walk') {
    // Tactical Walk
    const speed = 7.0;
    const legSwing = Math.sin(time * speed) * 0.5;
    if (bones['L_Thigh']) bones['L_Thigh'].rotation.x = baseRotLThigh.x + legSwing;
    if (bones['R_Thigh']) bones['R_Thigh'].rotation.x = baseRotRThigh.x - legSwing;
    if (bones['L_Calf']) bones['L_Calf'].rotation.x = baseRotLCalf.x + Math.max(0, -legSwing) * 0.4;
    if (bones['R_Calf']) bones['R_Calf'].rotation.x = baseRotRCalf.x + Math.max(0, legSwing) * 0.4;
    
    // Arms swing opposite to legs
    if (bones['L_Upperarm']) bones['L_Upperarm'].rotation.x = baseRotLUpper.x - legSwing * 0.6;
    if (bones['R_Upperarm']) bones['R_Upperarm'].rotation.x = baseRotRUpper.x + legSwing * 0.6;
    if (bones['Spine01']) bones['Spine01'].rotation.y = baseRotSpine.y + Math.sin(time * speed) * 0.05;
    if (model) model.position.y = Math.abs(Math.sin(time * speed)) * 0.05;
  } 
  else if (state === 'run') {
    // Combat Run
    const speed = 13.0;
    const legSwing = Math.sin(time * speed) * 0.85;
    if (bones['L_Thigh']) bones['L_Thigh'].rotation.x = baseRotLThigh.x + legSwing;
    if (bones['R_Thigh']) bones['R_Thigh'].rotation.x = baseRotRThigh.x - legSwing;
    if (bones['L_Calf']) bones['L_Calf'].rotation.x = baseRotLCalf.x + Math.max(0, -legSwing) * 0.7;
    if (bones['R_Calf']) bones['R_Calf'].rotation.x = baseRotRCalf.x + Math.max(0, legSwing) * 0.7;

    if (bones['L_Upperarm']) bones['L_Upperarm'].rotation.x = baseRotLUpper.x - legSwing * 0.75;
    if (bones['L_Forearm']) bones['L_Forearm'].rotation.x = baseRotLFore.x - 0.55;
    if (bones['R_Upperarm']) bones['R_Upperarm'].rotation.x = baseRotRUpper.x + legSwing * 0.75;
    if (bones['R_Forearm']) bones['R_Forearm'].rotation.x = baseRotRFore.x - 0.55;

    if (bones['Spine01']) bones['Spine01'].rotation.x = baseRotSpine.x + 0.22;
    if (model) model.position.y = Math.abs(Math.sin(time * speed)) * 0.12;
  } 
  else if (state === 'rifle') {
    // Tactical Rifle Aiming Stance
    if (bones['L_Thigh']) bones['L_Thigh'].rotation.x = baseRotLThigh.x + 0.25;
    if (bones['R_Thigh']) bones['R_Thigh'].rotation.x = baseRotRThigh.x - 0.2;
    
    // Right arm holding gun grip
    if (bones['R_Upperarm']) bones['R_Upperarm'].rotation.set(baseRotRUpper.x - 1.25, baseRotRUpper.y - 0.2, baseRotRUpper.z - 0.15);
    if (bones['R_Forearm']) bones['R_Forearm'].rotation.x = baseRotRFore.x - 0.45;
    
    // Left arm holding foregrip
    if (bones['L_Upperarm']) bones['L_Upperarm'].rotation.set(baseRotLUpper.x - 1.05, baseRotLUpper.y + 0.45, baseRotLUpper.z + 0.35);
    if (bones['L_Forearm']) bones['L_Forearm'].rotation.x = baseRotLFore.x - 0.8;

    if (bones['Spine01']) bones['Spine01'].rotation.y = baseRotSpine.y + 0.2 + Math.sin(time * 3.0) * 0.02;
    if (bones['Head']) bones['Head'].rotation.y = baseRotHead.y - 0.2;

    // Attach/Position rifle to right hand if available
    if (rifleGroup && bones['R_Hand']) {
      const handWorldPos = new THREE.Vector3();
      const handWorldQuat = new THREE.Quaternion();
      bones['R_Hand'].getWorldPosition(handWorldPos);
      bones['R_Hand'].getWorldQuaternion(handWorldQuat);
      rifleGroup.position.copy(handWorldPos);
      rifleGroup.quaternion.copy(handWorldQuat);
      rifleGroup.rotateX(Math.PI / 2);
      rifleGroup.rotateZ(0.2);
      rifleGroup.translateY(0.25);
      rifleGroup.translateZ(0.05);
    }
  } 
  else if (state === 'knife') {
    // Melee Plasma Knife Combat Slash Stance & Attack
    const attackPhase = Math.sin(time * 16.0);
    if (bones['R_Upperarm']) bones['R_Upperarm'].rotation.set(baseRotRUpper.x - 0.8 + attackPhase * 0.6, baseRotRUpper.y - 0.3, baseRotRUpper.z - 0.3);
    if (bones['R_Forearm']) bones['R_Forearm'].rotation.x = baseRotRFore.x - 0.6 + Math.max(0, attackPhase * 0.4);
    if (bones['L_Upperarm']) bones['L_Upperarm'].rotation.set(baseRotLUpper.x - 0.5, baseRotLUpper.y + 0.3, baseRotLUpper.z + 0.3);
    
    if (bones['Spine01']) bones['Spine01'].rotation.y = baseRotSpine.y + attackPhase * 0.2;

    if (knifeGroup && bones['R_Hand']) {
      const handWorldPos = new THREE.Vector3();
      const handWorldQuat = new THREE.Quaternion();
      bones['R_Hand'].getWorldPosition(handWorldPos);
      bones['R_Hand'].getWorldQuaternion(handWorldQuat);
      knifeGroup.position.copy(handWorldPos);
      knifeGroup.quaternion.copy(handWorldQuat);
      knifeGroup.rotateX(Math.PI / 2);
      knifeGroup.translateY(0.12);
    }
  }
}

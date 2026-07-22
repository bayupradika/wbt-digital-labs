import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let scene, camera, renderer, controls, currentModel;
let autoRotate = true;

const container = document.getElementById('canvasContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

init();
animate();

function init() {
    scene = new THREE.Scene();

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 0.5 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88, wireframe: false });
    currentModel = new THREE.Mesh(geometry, material);
    scene.add(currentModel);

    window.addEventListener('resize', onWindowResize);
    setupUI();
    setupDragAndDrop();
}

function setupUI() {
    document.getElementById('autoRotateToggle').addEventListener('change', (e) => {
        autoRotate = e.target.checked;
    });

    document.getElementById('wireframeToggle').addEventListener('change', (e) => {
        if (currentModel) {
            currentModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    if(Array.isArray(child.material)) {
                        child.material.forEach(m => m.wireframe = e.target.checked);
                    } else {
                        child.material.wireframe = e.target.checked;
                    }
                }
            });
        }
    });

    document.getElementById('gridToggle').addEventListener('change', (e) => {
        const grid = scene.children.find(c => c.type === 'GridHelper');
        if(grid) grid.visible = e.target.checked;
    });

    document.getElementById('lightIntensity').addEventListener('input', (e) => {
        const dLight = scene.children.find(c => c.type === 'DirectionalLight');
        if(dLight) dLight.intensity = parseFloat(e.target.value);
    });

    document.getElementById('resetCamBtn').addEventListener('click', () => {
        camera.position.set(5, 5, 5);
        controls.target.set(0, 0, 0);
    });
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            loadModel(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadModel(e.target.files[0]);
        }
    });
}

function loadModel(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    loadingOverlay.classList.remove('hidden');
    loadingText.innerText = `Memuat ${file.name}...`;

    reader.onload = function(e) {
        const contents = e.target.result;
        
        if (currentModel) {
            scene.remove(currentModel);
        }

        try {
            if (extension === 'gltf' || extension === 'glb') {
                const loader = new GLTFLoader();
                loader.parse(contents, '', function(gltf) {
                    processLoadedModel(gltf.scene);
                });
            } else if (extension === 'obj') {
                const loader = new OBJLoader();
                const obj = loader.parse(new TextDecoder().decode(contents));
                processLoadedModel(obj);
            } else if (extension === 'fbx') {
                const loader = new FBXLoader();
                const fbx = loader.parse(contents, '');
                processLoadedModel(fbx);
            } else {
                alert('Format tidak didukung! Gunakan FBX, OBJ, atau GLB.');
                loadingOverlay.classList.add('hidden');
            }
        } catch (error) {
            console.error(error);
            alert('Gagal memuat model. Format file mungkin tidak valid atau rusak.');
            loadingOverlay.classList.add('hidden');
        }
    };

    if (extension === 'obj') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function processLoadedModel(model) {
    currentModel = model;
    
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Auto-scale to fit screen perfectly
    const scale = 5 / (maxDim === 0 ? 1 : maxDim);
    model.scale.set(scale, scale, scale);
    
    // Recenter
    box.setFromObject(model);
    box.getCenter(center);
    model.position.sub(center); 

    const isWireframe = document.getElementById('wireframeToggle').checked;
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if(child.material) {
                if(Array.isArray(child.material)) {
                    child.material.forEach(m => m.wireframe = isWireframe);
                } else {
                    child.material.wireframe = isWireframe;
                }
            }
        }
    });

    scene.add(currentModel);
    loadingOverlay.classList.add('hidden');
    controls.target.set(0, 0, 0);
    camera.position.set(5, 5, 5);
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (autoRotate && currentModel) {
        currentModel.rotation.y += 0.005;
    }
    controls.update();
    renderer.render(scene, camera);
}

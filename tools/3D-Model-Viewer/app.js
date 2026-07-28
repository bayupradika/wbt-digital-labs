import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

let scene, camera, renderer, orbitControls, transformControls;
let models = [];
let selectedModel = null;
let autoRotate = true;

const container = document.getElementById('canvasContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const selectionPanel = document.getElementById('selectionPanel');

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

init();
animate();

function init() {
    scene = new THREE.Scene();

    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    scene.add(gridHelper);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(10, 10, 15);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 0.5 );
    hemiLight.position.set( 0, 20, 0 );
    scene.add( hemiLight );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Orbit Controls (Camera)
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;

    // Transform Controls (Object Manipulation)
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', function (event) {
        orbitControls.enabled = !event.value; // Disable camera orbit when dragging object
    });
    scene.add(transformControls);

    window.addEventListener('resize', onWindowResize);
    
    // Raycaster click event for selection
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    setupUI();
    setupDragAndDrop();
}

function onPointerDown(event) {
    if (transformControls.dragging) return; // Don't select if currently dragging a gizmo

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Filter out grid helper, lights, etc. Only intersect models
    const intersectableObjects = models.flatMap(model => {
        let meshes = [];
        model.traverse(child => { if (child.isMesh) meshes.push(child); });
        return meshes;
    });

    const intersects = raycaster.intersectObjects(intersectableObjects, false);

    if (intersects.length > 0) {
        // Find the root group of the clicked mesh
        let object = intersects[0].object;
        while (object.parent && object.parent !== scene && object.parent.type !== 'Scene') {
            // Find the top-level model group added to the scene
            if (models.includes(object.parent)) break;
            object = object.parent;
        }
        
        // Ensure we select the main wrapper if it's in models array
        let target = models.includes(object) ? object : object.parent;
        if(models.includes(target)) {
            selectModel(target);
        } else {
             // Fallback if structure is flat
             selectModel(object);
        }
    } else {
        // Clicked on empty space
        selectModel(null);
    }
}

function selectModel(model) {
    selectedModel = model;
    if (model) {
        transformControls.attach(model);
        selectionPanel.style.display = 'block';
        
        // Highlight logic (optional, skip for performance or add basic bounding box)
    } else {
        transformControls.detach();
        selectionPanel.style.display = 'none';
    }
}

function setupUI() {
    document.getElementById('autoRotateToggle').addEventListener('change', (e) => {
        autoRotate = e.target.checked;
    });

    document.getElementById('wireframeToggle').addEventListener('change', (e) => {
        const isWireframe = e.target.checked;
        models.forEach(model => {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    if(Array.isArray(child.material)) {
                        child.material.forEach(m => m.wireframe = isWireframe);
                    } else {
                        child.material.wireframe = isWireframe;
                    }
                }
            });
        });
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
        camera.position.set(10, 10, 15);
        orbitControls.target.set(0, 0, 0);
    });

    // Transform Mode Controls
    document.getElementById('modeTranslate').addEventListener('click', () => transformControls.setMode('translate'));
    document.getElementById('modeRotate').addEventListener('click', () => transformControls.setMode('rotate'));
    document.getElementById('modeScale').addEventListener('click', () => transformControls.setMode('scale'));

    // Delete
    document.getElementById('btnDeleteObj').addEventListener('click', () => {
        if (selectedModel) {
            scene.remove(selectedModel);
            models = models.filter(m => m !== selectedModel);
            selectModel(null);
            recalculateLayout();
        }
    });

    // Exports
    document.getElementById('btnExportGLB').addEventListener('click', () => exportModel('glb'));
    document.getElementById('btnExportGLTF').addEventListener('click', () => exportModel('gltf'));
    document.getElementById('btnExportOBJ').addEventListener('click', () => exportModel('obj'));
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
            Array.from(e.dataTransfer.files).forEach(file => loadModel(file));
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            Array.from(e.target.files).forEach(file => loadModel(file));
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
            alert(`Gagal memuat model ${file.name}. Format file mungkin tidak valid atau rusak.`);
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
    // Wrap model in a group to easily manipulate its origin
    const wrapper = new THREE.Group();
    wrapper.add(model);
    
    // Auto-scale to a reasonable size
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const scale = 5 / (maxDim === 0 ? 1 : maxDim);
    model.scale.set(scale, scale, scale);
    
    // Recenter inner model to 0,0,0
    box.setFromObject(model);
    box.getCenter(center);
    model.position.sub(center); 

    const isWireframe = document.getElementById('wireframeToggle').checked;
    wrapper.traverse((child) => {
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

    models.push(wrapper);
    scene.add(wrapper);
    
    recalculateLayout();
    
    // Select newly loaded model
    selectModel(wrapper);
    
    loadingOverlay.classList.add('hidden');
}

function recalculateLayout() {
    const count = models.length;
    if (count === 0) return;

    if (count === 1) {
        models[0].position.set(0, 0, 0);
        return;
    }

    // Radial layout for multiple objects
    const radius = Math.max(5, count * 2);
    
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        models[i].position.set(x, 0, z);
    }
    
    // Adjust camera to fit all
    camera.position.set(radius * 1.5, radius, radius * 1.5);
    orbitControls.target.set(0, 0, 0);
}

function exportModel(format) {
    if (!selectedModel) {
        alert("Pilih model terlebih dahulu sebelum di-export.");
        return;
    }

    loadingOverlay.classList.remove('hidden');
    loadingText.innerText = `Menyimpan sebagai .${format.toUpperCase()}...`;

    setTimeout(() => {
        if (format === 'glb' || format === 'gltf') {
            const exporter = new GLTFExporter();
            const options = {
                binary: format === 'glb',
                trs: false,
                onlyVisible: true,
                truncateDrawRange: true
            };
            
            // Temporary reset position to 0,0,0 for export so it doesn't have an offset
            const oldPos = selectedModel.position.clone();
            selectedModel.position.set(0,0,0);

            exporter.parse(
                selectedModel,
                function (result) {
                    selectedModel.position.copy(oldPos); // restore position
                    if (result instanceof ArrayBuffer) {
                        saveArrayBuffer(result, `exported_model.${format}`);
                    } else {
                        const output = JSON.stringify(result, null, 2);
                        saveString(output, `exported_model.${format}`);
                    }
                    loadingOverlay.classList.add('hidden');
                },
                function (error) {
                    selectedModel.position.copy(oldPos);
                    console.error(error);
                    alert("Error saat export GLTF/GLB");
                    loadingOverlay.classList.add('hidden');
                },
                options
            );
        } else if (format === 'obj') {
            const exporter = new OBJExporter();
            
            const oldPos = selectedModel.position.clone();
            selectedModel.position.set(0,0,0);
            
            const result = exporter.parse(selectedModel);
            
            selectedModel.position.copy(oldPos);
            
            saveString(result, 'exported_model.obj');
            loadingOverlay.classList.add('hidden');
        }
    }, 100);
}

const link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link);

function save(blob, filename) {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function saveString(text, filename) {
    save(new Blob([text], { type: 'text/plain' }), filename);
}

function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (autoRotate && models.length > 0) {
        // Rotate the entire scene root holding the models, or just orbit controls
        // Usually autoRotate is handled by OrbitControls
        orbitControls.autoRotate = autoRotate;
    } else {
        orbitControls.autoRotate = false;
    }
    
    orbitControls.update();
    renderer.render(scene, camera);
}

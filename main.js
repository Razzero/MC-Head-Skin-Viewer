// Variables and Dom Elements
const defaultSkin = 'steveskin.png';
const ButtonDownload = document.getElementById('Button-Download');
const SliderFov = document.getElementById('slider-zoom');
const isOverlayChecked = document.getElementById('isOverlay');
const labelCheckbox = document.getElementById('textCheckbox');
const SkinUpload = document.getElementById('Skin-Upload');
const containerDiv = document.getElementById('container-3d');

// Three.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(containerDiv.offsetWidth, containerDiv.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio * 2 || 2);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.background = new THREE.Color(0xffffff);

containerDiv.style.display = "none";
containerDiv.appendChild(renderer.domElement);

// Lighting
const Dlight = new THREE.DirectionalLight(0xdddddd, 1.2);
Dlight.position.set(15, 5, 10);
scene.add(Dlight);

const AMlight = new THREE.AmbientLight(0xffffff, 1);
scene.add(AMlight);

// Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 1, 60);
camera.fov = 101 - 50 * 2;
camera.updateProjectionMatrix();

controls.enablePan = false;
controls.enableZoom = false;
controls.enableDamping = true;
controls.update();

// Variables for Models
let overlayModel = null;
let notOverlayModel = null;

// Texture Loader
const textureLoader = new THREE.TextureLoader();

/* === Model Loading === */
function loadModels() {
  const loader = new THREE.GLTFLoader();

  // Load Non-Overlay Model
  loader.load('./model/model.gltf', (gltf) => {
    notOverlayModel = gltf.scene;
    configureModelMaterial(notOverlayModel);
    scene.add(notOverlayModel);
    toggleModelVisibility();
  });

  // Load Overlay Model
  loader.load('./model/FinalHeadLayer.gltf', (gltf) => {
    overlayModel = gltf.scene;
    configureModelMaterial(overlayModel);
    overlayModel.visible = false;
    scene.add(overlayModel);
    toggleModelVisibility();
  });
}

// Configure Materials for Default Models
function configureModelMaterial(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0x808080,
        metalness: 0.1,
      });
      child.material.needsUpdate = true;
    }
  });
}

/* === Model Visibility Toggle === */
function toggleModelVisibility() {
  if (overlayModel && notOverlayModel) {
    overlayModel.visible = isOverlayChecked.checked;
    notOverlayModel.visible = !isOverlayChecked.checked;

    labelCheckbox.innerHTML = isOverlayChecked.checked
      ? 'Overlay On'
      : 'Overlay Off';
  }
}

/* === Texture Handling === */
function upscaleTexture(texture, scaleValue = 20) {
  const canvas = document.createElement('canvas');
  canvas.width = texture.image.width * scaleValue;
  canvas.height = texture.image.height * scaleValue;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);

  const upscaledTexture = new THREE.Texture(canvas);
  upscaledTexture.needsUpdate = true;

  return upscaledTexture;
}

function applySkin(file) {
  if (file.type !== 'image/png') {
    alert('Please upload a PNG file.');
    SkinUpload.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const texture = textureLoader.load(e.target.result, () => {
      const scaledTexture = upscaleTexture(texture);

      [overlayModel, notOverlayModel].forEach((model) => {
        if (model) {
          model.traverse((child) => {
            if (child.isMesh) {
              child.material.map = scaledTexture;
              child.material.transparent = true;
              child.material.alphaTest = 0.1;
              child.material.side = THREE.DoubleSide;
              child.material.receiveShadow = true;
              child.material.castShadow = true;
              child.material.needsUpdate = true;
            }
          });
        }
      });

      console.log('Skin has been successfully applied.');
    });
  };

  reader.readAsDataURL(file);
}

/* === Event Listeners === */
SkinUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) applySkin(file);
});

isOverlayChecked.addEventListener('change', toggleModelVisibility);

SliderFov.addEventListener('input', () => {
  const sliderValue = 101 - SliderFov.value * 2;
  camera.fov = sliderValue;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  const value = SliderFov.value;
  const max = SliderFov.max;
  const min = SliderFov.min;
  const percentage = ((value - min) / (max - min)) * 100;

  SliderFov.style.background = `linear-gradient(to right, #4CAF50 ${percentage}%, #ccc ${percentage}%)`;
});

// Initialize Default SliderStyle
SliderFov.style.background = `linear-gradient(to right, #4CAF50 100%, #ccc 100%)`;

ButtonDownload.addEventListener('click', () => {
  renderer.render(scene, camera);
  const imageData = renderer.domElement.toDataURL('image/jpeg', 1);

  const link = document.createElement('a');
  link.href = imageData;
  link.download = 'scene.png';
  link.click();
});

/* === Animation Loop === */
function animate() {
  requestAnimationFrame(animate);
  Dlight.position.copy(camera.position);
  controls.update();
  renderer.render(scene, camera);
}

/* === Initialization === */
function init() {
  loadModels();
  SliderFov.value = 90;
  containerDiv.style.display = 'block';
  animate();
}

// Start Application
init();

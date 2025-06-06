// Escena
const scene = new THREE.Scene();

// Cámara (perspectiva para VR)
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visión
    window.innerWidth / window.innerHeight, // Relación de aspecto
    0.1, // Plano cercano
    1000 // Plano lejano
);
camera.position.set(0, 1.6, 5); // Posición inicial (1.6m simula altura de ojos)

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // Habilitar WebXR
document.body.appendChild(renderer.domElement);

// Botón VR
document.body.appendChild(VRButton.createButton(renderer));

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Luz ambiental
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Luz direccional
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Cargar modelo 3D
const loader = new THREE.GLTFLoader();
loader.load(
    'assets/Models/GeneralPoli.glb', // Verifica que esta ruta sea correcta
    (gltf) => {
        scene.add(gltf.scene);
        console.log('Modelo cargado:', gltf.scene);
    },
    (progress) => {
        console.log(`Cargando: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
    },
    (error) => {
        console.error('Error al cargar el modelo:', error);
    }
);

// Animación
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Ajustar tamaño de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';

// Escena
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x010b22); // Azul claro

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

// Controles de movimiento (PointerLockControls)
const controls = new PointerLockControls(camera, renderer.domElement);

// Activar controles al hacer clic
document.addEventListener('click', () => {
    controls.lock();
});

// Manejar eventos de bloqueo/desbloqueo
controls.addEventListener('lock', () => {
    console.log('Controles bloqueados');
});
controls.addEventListener('unlock', () => {
    console.log('Controles desbloqueados');
});

// Variables para el movimiento
const moveSpeed = 0.1; // Velocidad de movimiento
const velocity = new THREE.Vector3(); // Vector para manejar la velocidad
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false; // Nueva variable para subir
let moveDown = false; // Nueva variable para bajar

// Escuchar teclas para el movimiento y posición de la cámara
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyS': moveForward = true; break;
        case 'KeyW': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': moveUp = true; break; // Subir con la barra espaciadora
        case 'ShiftLeft':
        case 'ShiftRight': moveDown = true; break; // Bajar con Shift
        case 'Enter':
            const pos = camera.position;
            console.log(`Posición de la cámara: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`);
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyS': moveForward = false; break;
        case 'KeyW': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
        case 'Space': moveUp = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveDown = false; break;
    }
});

// Cargar las texturas del skybox
const skyboxTextures = [

    '/assets/Texturas/ulukai/corona_ft.png', // Derecha (+X)
    '/assets/Texturas/ulukai/corona_bk.png', // Izquierda (-X)
    '/assets/Texturas/ulukai/corona_up.png', // Arriba (+Y)
    '/assets/Texturas/ulukai/corona_dn.png', // Abajo (-Y)
    '/assets/Texturas/ulukai/corona_rt.png', // Frente (+Z)
    '/assets/Texturas/ulukai/corona_lf.png', // Atrás (-Z)

];



// Cargar las texturas como un CubeTexture
const cubeTextureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeTextureLoader.load(skyboxTextures);

// Aplicar el skybox como fondo de la escena
scene.background = skyboxTexture;

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Luz ambiental suave
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 5, 1000); // Luz desde el Sol
sunLight.position.set(0, 0, 0);
scene.add(sunLight);


// Datos de los planetas (escalas y posiciones del cálculo anterior)
const planetsData = [
    { name: 'Sol', path: '/assets/Models/Sol.glb', rotationSpeed: 0.001 },
    { name: 'Mercurio', path: '/assets/Models/Mercurio.glb', rotationSpeed: 0.004, orbitSpeed: 0.004 },
    { name: 'Venus', path: '/assets/Models/Venus.glb', rotationSpeed: 0.002, orbitSpeed: 0.003 },
    { name: 'Tierra', path: '/assets/Models/Tierra.glb', rotationSpeed: 0.01, orbitSpeed: 0.002 },
    //{ name: 'Luna', path: '/assets/Models/Luna.glb', rotationSpeed: 0.005, orbitSpeed: 0.01, parent: 'Tierra' },
    { name: 'Marte', path: '/assets/Models/Marte.glb', rotationSpeed: 0.009, orbitSpeed: 0.0015 },
    { name: 'Jupiter', path: '/assets/Models/Jupiter.glb', rotationSpeed: 0.02, orbitSpeed: 0.0008 },
    { name: 'Saturno', path: '/assets/Models/Saturno.glb', rotationSpeed: 0.018, orbitSpeed: 0.0006 },
    { name: 'Urano', path: '/assets/Models/Urano.glb', rotationSpeed: 0.012, orbitSpeed: 0.0004 },
    { name: 'Neptuno', path: '/assets/Models/Neptuno.glb', rotationSpeed: 0.011, orbitSpeed: 0.0003 },
];

// Cargar modelo 3D
const loader = new GLTFLoader();

planetsData.forEach((planetData) => {
    loader.load(
        planetData.path, // Ruta relativa a public/
        (gltf) => {
            const planet = gltf.scene;
            planet.name = planetData.name;


            // Añadir rotación
            planet.rotationSpeed = planetData.rotationSpeed || 0.01;

            scene.add(planet);
            console.log(`Modelo ${planetData.name} cargado:`, planet);
        },
        (progress) => {
            console.log(`Cargando ${planetData.name}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        (error) => {
            console.error(`Error al cargar el modelo ${planetData.name}:`, error);
        }
    );
});


// Animación
function animate() {
    requestAnimationFrame(animate);

    // Actualizar movimiento
    velocity.x = 0;
    velocity.y = 0; // Nuevo: incluir el eje Y
    velocity.z = 0;

    if (moveForward) velocity.z -= moveSpeed;
    if (moveBackward) velocity.z += moveSpeed;
    if (moveLeft) velocity.x -= moveSpeed;
    if (moveRight) velocity.x += moveSpeed;
    if (moveUp) velocity.y += moveSpeed; // Subir
    if (moveDown) velocity.y -= moveSpeed; // Bajar

    // Mover en el plano XZ usando PointerLockControls
    controls.moveRight(velocity.x);
    controls.moveForward(velocity.z);

    // Mover en el eje Y directamente
    camera.position.y += velocity.y;

    // Rotar los planetas
    planetsData.forEach((planetData) => {
        const planet = scene.getObjectByName(planetData.name);

        //rotacion del planeta en el eje Y
        planet.rotation.y += planetData.rotationSpeed;

        if (planet) {
            planet.rotation.y += planet.rotationSpeed; // Rotación del planeta
            /*if (planetData.orbitSpeed) {
                // Simular órbita alrededor del Sol
                const orbitRadius = 10; // Distancia al Sol
                const angle = Date.now() * 0.0001 * planetData.orbitSpeed; // Velocidad de órbita
                planet.position.x = Math.cos(angle) * orbitRadius;
                planet.position.z = Math.sin(angle) * orbitRadius;
            }*/
        }
    }
    );

    renderer.render(scene, camera);
}
animate();

// Ajustar tamaño de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
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
camera.position.set(28.20, 16.80, 9.61); // Posición inicial
camera.rotation.set(-1.08, 0.75, 0.90); // Rotación inicial (en radianes)

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // Habilitar WebXR
document.body.appendChild(renderer.domElement);

// Botón VR
document.body.appendChild(VRButton.createButton(renderer));

// Controles de movimiento (PointerLockControls)
const controls = new PointerLockControls(camera, renderer.domElement);
let isManualControlEnabled = true; // Estado de los controles manuales

// Activar controles al hacer clic
document.addEventListener('click', () => {
    if (isManualControlEnabled) {
        controls.lock();
    }
});

// Manejar eventos de bloqueo/desbloqueo
controls.addEventListener('lock', () => {
    console.log('Controles bloqueados');
});
controls.addEventListener('unlock', () => {
    console.log('Controles desbloqueados');
});

// Variables para el movimiento manual
const moveSpeed = 0.1; // Velocidad de movimiento
const velocity = new THREE.Vector3(); // Vector para manejar la velocidad
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

// Definir la secuencia de movimientos de la cámara
const cameraPath = [
    {
        position: { x: 28.20, y: 16.80, z: 9.61 }, // Punto inicial
        rotation: { x: -1.08, y: 0.75, z: 0.90 },
        duration: 3000, // Duración del movimiento en ms
        wait: 2000 // Tiempo de espera en ms
    },
    {
        position: { x: 0, y: 0, z: 0 }, // Cerca del Sol (offset para visibilidad)
        duration: 3000,
        wait: 2000
    },
    {
        position: { x: 5, y: 5, z: 5 }, // Cerca de Marte (estimado)
        duration: 3000,
        wait: 2000
    }
];

// Función para iniciar la secuencia de movimientos
function startCameraSequence() {
    isManualControlEnabled = false; // Deshabilitar controles manuales
    if (controls.isLocked) controls.unlock(); // Desbloquear PointerLockControls

    console.log('Iniciando secuencia de cámara');

    // Obtener la posición del Sol
    const sun = scene.getObjectByName('Sol');
    const positionPlanet = sun.position;

    // Tween para mover la cámara a la posición del Sol
    const positionTween1 = new TWEEN.Tween(camera.position)
        .to({ x: positionPlanet.x, y: positionPlanet.y, z: positionPlanet.z}, 3000) // 3 segundos, offset para visibilidad
        .easing(TWEEN.Easing.Quadratic.InOut);


    // Ajustar orientación al llegar
    positionTween1.onComplete(() => {
        camera.lookAt(positionPlanet); // Apuntar al Sol
    });

    // Tween de espera después de la posición del Sol
    const waitTween1 = new TWEEN.Tween({})
        .to({}, 2000); // 2 segundos

    // Tween para mover la cámara a (5, 0, 5)
    const positionTween2 = new TWEEN.Tween(camera.position)
        .to({ x: 5, y: 0, z: 5 }, 3000) // 3 segundos
        .easing(TWEEN.Easing.Quadratic.InOut);


    // Tween de espera después de (5, 0, 5)
    const waitTween2 = new TWEEN.Tween({})
        .to({}, 2000)
        .onComplete(() => {
            isManualControlEnabled = true;
            console.log('Secuencia de cámara finalizada');
        });

    // Encadenar tweens
    positionTween1.chain(waitTween1);
    waitTween1.chain(positionTween2);
    positionTween2.chain(waitTween2);

    // Iniciar tweens
    positionTween1.start();

    
/*
    cameraPath.forEach((step, index) => {
        // Tween para la posición
        const positionTween = new TWEEN.Tween(camera.position)
            .to(step.position, step.duration)
            .easing(TWEEN.Easing.Quadratic.InOut);

        // Iniciar los tweens simultáneamente
        if (index === 0) {
            positionTween.start();
        } else {
            // Encadenar con el tween anterior
            previousTween.chain(positionTween);
        }

        // Crear un tween vacío para la espera
        const waitTween = new TWEEN.Tween({})
            .to({}, step.wait)
            .onComplete(() => {
                if (index === cameraPath.length - 1) {
                    // Rehabilitar controles manuales al final
                    isManualControlEnabled = true;
                    console.log('Secuencia de cámara finalizada');
                }
            });

        positionTween.chain(waitTween);
        previousTween = waitTween;
    });*/
}

// Escuchar teclas para el movimiento, posición y secuencia
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyS': moveForward = true; break;
        case 'KeyW': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': moveUp = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveDown = true; break;
        case 'Enter':
            const pos = camera.position;
            console.log(`Posición de la cámara: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`);
            console.log(`Rotación de la cámara: x=${camera.rotation.x.toFixed(2)}, y=${camera.rotation.y.toFixed(2)}, z=${camera.rotation.z.toFixed(2)}`);
            break;
        case 'KeyP':
            if (isManualControlEnabled) {
                console.log('Iniciando secuencia de cámara');
                startCameraSequence();
            }
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

const cubeTextureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeTextureLoader.load(skyboxTextures);
scene.background = skyboxTexture;

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 5, 1000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Datos de los planetas
const planetsData = [
    { name: 'Sol', path: '/assets/Models/Sol.glb', rotationSpeed: 0.001 },
    { name: 'Mercurio', path: '/assets/Models/Mercurio.glb', rotationSpeed: 0.004, orbitSpeed: 0.004 },
    { name: 'Venus', path: '/assets/Models/Venus.glb', rotationSpeed: 0.002, orbitSpeed: 0.003 },
    { name: 'Tierra', path: '/assets/Models/Tierra.glb', rotationSpeed: 0.01, orbitSpeed: 0.002 },
    { name: 'Marte', path: '/assets/Models/Marte.glb', rotationSpeed: 0.009, orbitSpeed: 0.0015 },
    { name: 'Jupiter', path: '/assets/Models/Jupiter.glb', rotationSpeed: 0.02, orbitSpeed: 0.0008 },
    { name: 'Saturno', path: '/assets/Models/Saturno.glb', rotationSpeed: 0.018, orbitSpeed: 0.0006 },
    { name: 'Urano', path: '/assets/Models/Urano.glb', rotationSpeed: 0.012, orbitSpeed: 0.0004 },
    { name: 'Neptuno', path: '/assets/Models/Neptuno.glb', rotationSpeed: 0.011, orbitSpeed: 0.0003 },
];

// Cargar modelos 3D
const loader = new GLTFLoader();
planetsData.forEach((planetData) => {
    loader.load(
        planetData.path,
        (gltf) => {
            const planet = gltf.scene;
            planet.name = planetData.name;
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

    // Actualizar TWEEN
    TWEEN.update();

    // Movimiento manual
    if (isManualControlEnabled) {
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;

        if (moveForward) velocity.z -= moveSpeed;
        if (moveBackward) velocity.z += moveSpeed;
        if (moveLeft) velocity.x -= moveSpeed;
        if (moveRight) velocity.x += moveSpeed;
        if (moveUp) velocity.y += moveSpeed;
        if (moveDown) velocity.y -= moveSpeed;

        controls.moveRight(velocity.x);
        controls.moveForward(velocity.z);
        camera.position.y += velocity.y;
    }

    // Rotar los planetas
    planetsData.forEach((planetData) => {
        const planet = scene.getObjectByName(planetData.name);
        if (planet) {
            planet.rotation.y += planetData.rotationSpeed;
        }
    });

    renderer.render(scene, camera);
}
animate();

// Ajustar tamaño de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
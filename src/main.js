import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';

// Escena
const scene = new THREE.Scene();

// Skybox
const skyboxTextures = [
    '/assets/Texturas/ulukai/corona_ft.png',
    '/assets/Texturas/ulukai/corona_bk.png',
    '/assets/Texturas/ulukai/corona_up.png',
    '/assets/Texturas/ulukai/corona_dn.png',
    '/assets/Texturas/ulukai/corona_rt.png',
    '/assets/Texturas/ulukai/corona_lf.png',
];
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load(skyboxTextures);

// Cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 400, 0);
camera.lookAt(0, 0, 0);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Botón VR
document.body.appendChild(VRButton.createButton(renderer));

// Controles
const controls = new PointerLockControls(camera, renderer.domElement);
let controlsEnabled = false;
document.addEventListener('click', () => {
    if (controlsEnabled) controls.lock();
});

// Movimiento
const moveSpeed = 0.1;
const velocity = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

document.addEventListener('keydown', (event) => {
    if (!controlsEnabled) return;
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': moveUp = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveDown = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    if (!controlsEnabled) return;
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
        case 'Space': moveUp = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveDown = false; break;
    }
});

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 5, 1000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Datos de los planetas con posiciones iniciales
const planetsData = [
    { name: 'Sol', path: '/assets/Models/Sol.glb', rotationSpeed: 0.001, initialPosition: { x: 0, y: 0, z: 0 }, info: "El Sol es una estrella de secuencia principal con un diámetro de 1.39 millones de km." },
    { name: 'Mercurio', path: '/assets/Models/Mercurio.glb', rotationSpeed: 0.004, orbitSpeed: 0.004, radius: 3.9, initialPosition: { x: 3.9, y: 0, z: 0 }, info: "Mercurio es el planeta más pequeño, con un diámetro de 4,880 km." },
    { name: 'Venus', path: '/assets/Models/Venus.glb', rotationSpeed: 0.002, orbitSpeed: 0.003, radius: 7.2, initialPosition: { x: 7.2, y: 0, z: 0 }, info: "Venus tiene un diámetro de 12,104 km." },
    { name: 'Tierra', path: '/assets/Models/Tierra.glb', rotationSpeed: 0.01, orbitSpeed: 0.002, radius: 10.0, initialPosition: { x: 10.0, y: 0, z: 0 }, info: "La Tierra tiene un diámetro de 12,742 km." },
    { name: 'Marte', path: '/assets/Models/Marte.glb', rotationSpeed: 0.009, orbitSpeed: 0.0015, radius: 15.2, initialPosition: { x: 15.2, y: 0, z: 0 }, info: "Marte tiene un diámetro de 6,792 km." },
    { name: 'Jupiter', path: '/assets/Models/Jupiter.glb', rotationSpeed: 0.02, orbitSpeed: 0.0008, radius: 52.0, initialPosition: { x: 52.0, y: 0, z: 0 }, info: "Júpiter es el planeta más grande, con un diámetro de 139,820 km." },
    { name: 'Saturno', path: '/assets/Models/Saturno.glb', rotationSpeed: 0.018, orbitSpeed: 0.0006, radius: 95.8, initialPosition: { x: 95.8, y: 0, z: 0 }, info: "Saturno tiene un diámetro de 116,460 km." },
    { name: 'Urano', path: '/assets/Models/Urano.glb', rotationSpeed: 0.012, orbitSpeed: 0.0004, radius: 191.8, initialPosition: { x: 191.8, y: 0, z: 0 }, info: "Urano tiene un diámetro de 50,724 km." },
    { name: 'Neptuno', path: '/assets/Models/Neptuno.glb', rotationSpeed: 0.011, orbitSpeed: 0.0003, radius: 300.7, initialPosition: { x: 300.7, y: 0, z: 0 }, info: "Neptuno tiene un diámetro de 49,244 km." },
];

// Objeto para almacenar los planetas cargados
const planets = {};

// Cargar modelos
const loader = new GLTFLoader();
planetsData.forEach((planetData) => {
    loader.load(
        planetData.path,
        (gltf) => {
            const planet = gltf.scene;
            planet.name = planetData.name;
            planet.position.set(planetData.initialPosition.x, planetData.initialPosition.y, planetData.initialPosition.z);
            planet.rotationSpeed = planetData.rotationSpeed || 0.01;
            planet.orbitSpeed = planetData.orbitSpeed || 0;
            planet.radius = planetData.radius || 0;
            planet.isOrbiting = true;
            planet.orbitAngle = 0;

            if (planetData.name === 'Sol') {
                planet.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissive = new THREE.Color(0xffff00);
                        child.material.emissiveIntensity = 1.5;
                    }
                });
            } else {
                planet.traverse((child) => {
                    if (child.isMesh) {
                        child.material.roughness = 0.7;
                        child.material.metalness = 0;
                        child.material.emissive = new THREE.Color(0x111111);
                        child.material.emissiveIntensity = 0.2;
                    }
                });
            }

            scene.add(planet);
            planets[planetData.name] = planet;

            if (Object.keys(planets).length === planetsData.length) {
                startTour();
            }
        },
        undefined,
        (error) => {
            console.error(`Error al cargar ${planetData.name}:`, error);
        }
    );
});

// Reloj para animaciones
const clock = new THREE.Clock();

// Elemento HTML para mostrar datos
const infoOverlay = document.createElement('div');
infoOverlay.style.position = 'absolute';
infoOverlay.style.top = '20px';
infoOverlay.style.left = '20px';
infoOverlay.style.color = 'white';
infoOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
infoOverlay.style.padding = '10px';
infoOverlay.style.borderRadius = '5px';
infoOverlay.style.fontFamily = 'Arial, sans-serif';
infoOverlay.style.fontSize = '16px';
infoOverlay.style.maxWidth = '300px';
infoOverlay.style.display = 'none';
document.body.appendChild(infoOverlay);

function showPlanetInfo(planetData) {
    infoOverlay.style.display = 'block';
    infoOverlay.innerHTML = `<strong>${planetData.name}</strong><br>${planetData.info}`;
}

function hidePlanetInfo() {
    infoOverlay.style.display = 'none';
}

// Recorrido
let tourPaused = false;
let currentPlanet = null;

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyP') {
        tourPaused = !tourPaused;
        if (tourPaused) {
            controlsEnabled = true;
            controls.lock();
        } else {
            controlsEnabled = false;
            controls.unlock();
            continueTour();
        }
    }
});

function startTour() {
    let currentIndex = -1;

    function moveToPosition(position, lookAt, duration, onComplete) {
        if (tourPaused) {
            setTimeout(() => moveToPosition(position, lookAt, duration, onComplete), 100);
            return;
        }

        const startPos = camera.position.clone();
        const targetPos = new THREE.Vector3(position.x, position.y, position.z);
        const targetLookAt = new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);

        new TWEEN.Tween(startPos)
            .to(targetPos, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(() => {
                camera.position.copy(startPos);
                camera.lookAt(targetLookAt);
            })
            .onComplete(() => {
                if (onComplete) onComplete();
            })
            .start();
    }

    function continueTour() {
        if (currentPlanet) {
            currentPlanet.isOrbiting = true;
        }

        currentIndex++;
        if (currentIndex >= planetsData.length) {
            controlsEnabled = true;
            controls.lock();
            hidePlanetInfo();
            return;
        }

        const planetData = planetsData[currentIndex];
        const planet = planets[planetData.name];
        if (!planet) {
            continueTour();
            return;
        }

        planet.isOrbiting = false;
        currentPlanet = planet;

        const planetPos = planet.position.clone();
        const distance = planetData.name === 'Sol' ? 5 : planetData.radius;
        const cameraPos = planetPos.clone().add(new THREE.Vector3(distance, 0, 0));

        moveToPosition(
            cameraPos,
            planetPos,
            3000,
            () => {
                showPlanetInfo(planetData);
                setTimeout(() => {
                    hidePlanetInfo();
                    continueTour();
                }, 5000);
            }
        );
    }

    moveToPosition(
        { x: 0, y: 400, z: 0 },
        { x: 0, y: 0, z: 0 },
        3000,
        () => {
            setTimeout(() => {
                continueTour();
            }, 2000);
        }
    );
}

// Animación
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    TWEEN.update();

    if (controlsEnabled) {
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

    planetsData.forEach((planetData) => {
        const planet = planets[planetData.name];
        if (planet) {
            planet.rotation.y += planetData.rotationSpeed * delta;

            if (planetData.orbitSpeed && planet.isOrbiting) {
                planet.orbitAngle += planetData.orbitSpeed * delta;
                const orbitX = Math.cos(planet.orbitAngle) * planetData.radius;
                const orbitZ = Math.sin(planet.orbitAngle) * planetData.radius;
                planet.position.set(orbitX, planetData.initialPosition.y, orbitZ);
            }
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
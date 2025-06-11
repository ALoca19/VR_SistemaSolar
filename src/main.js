import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010b22); // Azul oscuro

// Cámara (perspectiva para VR)
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visión
    window.innerWidth / window.innerHeight, // Relación de aspecto
    0.1, // Plano cercano
    1000 // Plano lejano
);
camera.position.set(28.20, 16.80, 9.61); // Posición inicial
camera.rotation.set(-1.08, 0.75, 0.90); // Rotación inicial (en radianes)

// Audio Listener
const listener = new THREE.AudioListener();
camera.add(listener); // Asociar el listener a la cámara

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // Habilitar WebXR
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
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

// Función de secuencia de cámara
function startCameraSequence() {
    isManualControlEnabled = false;
    if (controls.isLocked) controls.unlock();

    console.log('Iniciando secuencia de cámara');

    if (currentAudio && currentAudio.isPlaying) {
        currentAudio.stop();
        currentAudio = null;
    }

    // Tween inicial para esperar el audio de introducción
    const introTween = new TWEEN.Tween({})
        .to({}, sounds['inicioSound']?.duration || 2000)
        .onStart(() => {
            if (sounds['inicioSound']) {
                currentAudio = sounds['inicioSound'];
                currentAudio.play();
            }
        });

    // Resto del código...
    const planetPositions = [];
    planetsData.forEach((planetData) => {
        const planet = scene.getObjectByName(planetData.name);
        if (planet && planetData.name !== 'Sol') {
            planetData.rotationSpeedBak = planetData.rotationSpeed;
            planetData.isOrbiting = false;
            planetPositions.push({
                name: planetData.name,
                position: planet.position.clone()
            });
        } else if (planet && planetData.name === 'Sol') {
            planetPositions.push({
                name: 'Sol',
                position: planet.position.clone()
            });
        }
    });

    if (planetPositions.length === 0) {
        console.warn('No se encontraron planetas cargados para la secuencia');
        isManualControlEnabled = true;
        return;
    }

    let previousTween = introTween; // Comenzar la cadena con introTween
    let firstTween = null;
    planetPositions.forEach((planetInfo, index) => {
        let posicionXPlus = 0;
        if (planetInfo.name === 'Jupiter' || planetInfo.name === 'Saturno') {
            posicionXPlus = 10;
        } else if (planetInfo.name === 'Urano' || planetInfo.name === 'Neptuno') {
            posicionXPlus = 6;
        } else {
            posicionXPlus = 1;
        }

        const positionTween = new TWEEN.Tween(camera.position)
            .to({
                x: planetInfo.position.x + (planetInfo.name === 'Sol' ? 2 : posicionXPlus),
                y: planetInfo.position.y,
                z: planetInfo.position.z
            }, 3000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onStart(() => {
                if (currentAudio && currentAudio.isPlaying) {
                    currentAudio.stop();
                }
                if (sounds[planetInfo.name]) {
                    currentAudio = sounds[planetInfo.name];
                    currentAudio.play();
                } else {
                    console.warn(`No se encontró audio para ${planetInfo.name}`);
                }
            })
            .onComplete(() => {
                camera.lookAt(planetInfo.position);
            });

        if (index === 0) {
            firstTween = positionTween;
        }

        const waitTween = new TWEEN.Tween({})
            .to({}, sounds[planetInfo.name]?.duration || 2000);

        previousTween.chain(positionTween);
        positionTween.chain(waitTween);
        previousTween = waitTween;

        if (index === planetPositions.length - 1) {
            waitTween.onComplete(() => {
                if (currentAudio && currentAudio.isPlaying) {
                    currentAudio.stop();
                }
                if (sounds['terminoSound']) {
                    currentAudio = sounds['terminoSound'];
                    currentAudio.play();
                }
                planetsData.forEach((planetData) => {
                    if (planetData.name !== 'Sol') {
                        planetData.rotationSpeed = planetData.rotationSpeedBak || 0;
                        planetData.isOrbiting = true;
                    }
                });
                isManualControlEnabled = true;
                console.log('Secuencia de cámara finalizada');
            });
        }
    });

    introTween.start();
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
    './assets/Texturas/ulukai/corona_ft.png', // Derecha (+X)
    './assets/Texturas/ulukai/corona_bk.png', // Izquierda (-X)
    './assets/Texturas/ulukai/corona_up.png', // Arriba (+Y)
    './assets/Texturas/ulukai/corona_dn.png', // Abajo (-Y)
    './assets/Texturas/ulukai/corona_rt.png', // Frente (+Z)
    './assets/Texturas/ulukai/corona_lf.png', // Atrás (-Z)
];

const cubeTextureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeTextureLoader.load(skyboxTextures);
scene.background = skyboxTexture;

// Iluminación
const ambientLight = new THREE.AmbientLight(0x404040, 0.1); // Luz ambiental suave
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xfff8e1, 100, 5000, 2); // Luz del Sol, intensidad aumentada
sunLight.position.set(5, 0, 0); // Mover fuera del modelo del Sol (ajusta según el tamaño del modelo)
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 5000;
scene.add(sunLight);

// Efecto de brillo para el Sol
const textureLoader = new THREE.TextureLoader();
const glowTexture = textureLoader.load('./assets/Texturas/glow.png');
const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xfff8e1,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const glowSprite = new THREE.Sprite(glowMaterial);
glowSprite.scale.set(10, 10, 1); // Ajusta el tamaño
glowSprite.position.set(0, 0, 0); // Centro en el Sol
scene.add(glowSprite);

// Niebla para profundidad
scene.fog = new THREE.FogExp2(0x010b22, 0.0005);

// Datos de los planetas
const planetsData = [
    { 
        name: 'Sol', 
        path: './assets/Models/Sol.glb',
        audioPath: './assets/Audio/Sol.mp3', 
        rotationSpeed: 0.001, 
        info: "El Sol es una estrella de secuencia principal con un diámetro de 1.39 millones de km. Representa el 99.86% de la masa del sistema solar."
    },
    { 
        name: 'Mercurio', 
        path: './assets/Models/Mercurio.glb',
        audioPath: './assets/Audio/Mercurio.mp3', 
        rotationSpeed: 0.004, 
        orbitSpeed: 0.004, 
        radius: 3.9, 
        isOrbiting: true,
        info: "Mercurio es el planeta más pequeño, con un diámetro de 4,880 km. Tarda 88 días en orbitar el Sol."
    },
    { 
        name: 'Venus', 
        path: './assets/Models/Venus.glb',
        audioPath: './assets/Audio/Venus.mp3', 
        rotationSpeed: 0.002, 
        orbitSpeed: 0.003, 
        radius: 7.2, 
        isOrbiting: true,
        info: "Venus tiene un diámetro de 12,104 km. Es el planeta más caliente debido a su atmósfera densa."
    },
    { 
        name: 'Tierra', 
        path: './assets/Models/Tierra.glb',
        audioPath: './assets/Audio/Tierra.mp3', 
        rotationSpeed: 0.01, 
        orbitSpeed: 0.002, 
        radius: 10.0, 
        isOrbiting: true,
        info: "La Tierra tiene un diámetro de 12,742 km. Es el único planeta conocido con vida."
    },
    { 
        name: 'Marte', 
        path: './assets/Models/Marte.glb',
        audioPath: './assets/Audio/Marte.mp3', 
        rotationSpeed: 0.009, 
        orbitSpeed: 0.0015, 
        radius: 15.2, 
        isOrbiting: true,
        info: "Marte, el planeta rojo, tiene un diámetro de 6,792 km. Es conocido por su Monte Olimpo, el volcán más grande del sistema solar."
    },
    { 
        name: 'Jupiter', 
        path: './assets/Models/Jupiter.glb',
        audioPath: './assets/Audio/Jupiter.mp3', 
        rotationSpeed: 0.02, 
        orbitSpeed: 0.0008, 
        radius: 52.0, 
        isOrbiting: true,
        info: "Júpiter es el planeta más grande, con un diámetro de 139,820 km. Tiene una gran mancha roja, una tormenta gigante."
    },
    { 
        name: 'Saturno', 
        path: './assets/Models/Saturno.glb',
        audioPath: './assets/Audio/Saturno.mp3', 
        rotationSpeed: 0.018, 
        orbitSpeed: 0.0006, 
        radius: 95.8, 
        isOrbiting: true,
        info: "Saturno tiene un diámetro de 116,460 km. Es famoso por sus impresionantes anillos de hielo y roca."
    },
    { 
        name: 'Urano', 
        path: './assets/Models/Urano.glb',
        audioPath: './assets/Audio/Urano.mp3', 
        rotationSpeed: 0.012, 
        orbitSpeed: 0.0004, 
        radius: 191.8, 
        isOrbiting: true,
        info: "Urano tiene un diámetro de 50,724 km. Gira de lado debido a una inclinación extrema de su eje."
    },
    { 
        name: 'Neptuno', 
        path: './assets/Models/Neptuno.glb',
        audioPath: './assets/Audio/Neptuno.mp3',
        rotationSpeed: 0.011, 
        orbitSpeed: 0.0003, 
        radius: 300.7, 
        isOrbiting: true,
        info: "Neptuno tiene un diámetro de 49,244 km. Es conocido por sus fuertes vientos, los más rápidos del sistema solar."
    },
];

// Audios especiales
const introAudioPath = './assets/Audio/Intro.mp3';
const outroAudioPath = './assets/Audio/Termino.mp3';

// Cargar modelos 3D
const loader = new GLTFLoader();
planetsData.forEach((planetData, index) => {
    loader.load(
        planetData.path,
        (gltf) => {
            const planet = gltf.scene;
            planet.name = planetData.name;
            planet.rotationSpeed = planetData.rotationSpeed || 0.01;

            planet.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Hacer el Sol emisivo y no bloqueante
                    if (planetData.name === 'Sol') {
                        child.castShadow = false; // El Sol no proyecta sombras
                        if (child.material) {
                            child.material.emissive = new THREE.Color(0xfff8e1);
                            child.material.emissiveIntensity = 1.0;
                            child.material.transparent = true;
                            child.material.opacity = 0.8;
                            child.material.blending = THREE.AdditiveBlending;
                        }
                    }
                }
            });

            // Establecer posición inicial basada en el radio
            if (planetData.name !== 'Sol' && planetData.radius) {
                const angle = (index - 1) * Math.PI / 4;
                planet.position.set(
                    planetData.radius * Math.cos(angle),
                    0,
                    planetData.radius * Math.sin(angle)
                );
            } else {
                planet.position.set(0, 0, 0); // Sol en el origen
            }
            scene.add(planet);
            console.log(`Modelo ${planetData.name} cargado en posición:`, planet.position);
        },
        (progress) => {
            console.log(`Cargando ${planetData.name}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        (error) => {
            console.error(`Error al cargar el modelo ${planetData.name}:`, error);
        }
    );
});

// Objeto para almacenar los audios cargados
const audioBuffers = {};
const sounds = {};
let currentAudio = null;
const audioLoader = new THREE.AudioLoader();

// Función para cargar un audio y almacenarlo
function loadAudio(path, key) {
    return new Promise((resolve, reject) => {
        audioLoader.load(
            path,
            (buffer) => {
                audioBuffers[key] = buffer;
                console.log(`Audio ${key} cargado`);
                resolve();
            },
            (progress) => {
                console.log(`Cargando audio ${key}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
            },
            (error) => {
                console.error(`Error al cargar el audio ${key}:`, error);
                reject(error);
            }
        );
    });
}

// Cargar todos los audios
const audioLoadPromises = [];
planetsData.forEach((planetData) => {
    audioLoadPromises.push(loadAudio(planetData.audioPath, planetData.name));
});
audioLoadPromises.push(loadAudio(introAudioPath, 'inicioSound'));
audioLoadPromises.push(loadAudio(outroAudioPath, 'terminoSound'));

Promise.all(audioLoadPromises).then(() => {
    console.log('Todos los audios cargados');
    Object.keys(audioBuffers).forEach((key) => {
        const sound = new THREE.Audio(listener);
        sound.setBuffer(audioBuffers[key]);
        sound.setVolume(0.5);
        sound.duration = audioBuffers[key].duration * 1000;
        sounds[key] = sound;
    });
}).catch((error) => {
    console.error('Error al cargar algunos audios:', error);
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

    // Rotar los planetas, actualizar órbitas y ajustar emisión dinámica
    const time = Date.now();
    planetsData.forEach((planetData) => {
        const planet = scene.getObjectByName(planetData.name);
        if (planet) {
            // Rotación sobre su propio eje
            planet.rotation.y += planetData.rotationSpeed;
            // Órbita alrededor del Sol
            if (planetData.name !== 'Sol' && planetData.orbitSpeed && planetData.radius && planetData.isOrbiting) {
                const angle = time * planetData.orbitSpeed;
                planet.position.set(
                    planetData.radius * Math.cos(angle),
                    0,
                    planetData.radius * Math.sin(angle)
                );
            }
            // Iluminación dinámica para planetas
            if (planetData.name !== 'Sol') {
                const distance = planet.position.distanceTo(sunLight.position);
                const intensity = Math.max(0.1, 1000 / (distance * distance));
                planet.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.emissive.set(0xfff8e1);
                        child.material.emissiveIntensity = intensity * 0.05;
                    }
                });
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
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import TWEEN from '@tweenjs/tween.js';

// Datos de los planetas
const planetsData = [
  {
    name: 'Sol',
    path: './assets/Models/Sol.glb',
    audioPath: './assets/Audio/Sol.mp3',
    rotationSpeed: 0.001,
    info: 'El Sol es una estrella de secuencia principal con un diámetro de 1.39 millones de km. Representa el 99.86% de la masa del sistema solar.'
  },
  {
    name: 'Mercurio',
    path: './assets/Models/Mercurio.glb',
    audioPath: './assets/Audio/Mercurio.mp3',
    rotationSpeed: 0.004,
    orbitSpeed: 0.004,
    radius: 3.9,
    isOrbiting: true,
    info: 'Mercurio es el planeta más pequeño, con un diámetro de 4,880 km. Tarda 88 días en orbitar el Sol.'
  },
  {
    name: 'Venus',
    path: './assets/Models/Venus.glb',
    audioPath: './assets/Audio/Venus.mp3',
    rotationSpeed: 0.002,
    orbitSpeed: 0.003,
    radius: 7.2,
    isOrbiting: true,
    info: 'Venus tiene un diámetro de 12,104 km. Es el planeta más caliente debido a su atmósfera densa.'
  },
  {
    name: 'Tierra',
    path: './assets/Models/Tierra.glb',
    audioPath: './assets/Audio/Tierra.mp3',
    rotationSpeed: 0.01,
    orbitSpeed: 0.002,
    radius: 10.0,
    isOrbiting: true,
    info: 'La Tierra tiene un diámetro de 12,742 km. Es el único planeta conocido con vida.'
  },
  {
    name: 'Marte',
    path: './assets/Models/Marte.glb',
    audioPath: './assets/Audio/Marte.mp3',
    rotationSpeed: 0.009,
    orbitSpeed: 0.0015,
    radius: 15.2,
    isOrbiting: true,
    info: 'Marte, el planeta rojo, tiene un diámetro de 6,792 km. Es conocido por su Monte Olimpo, el volcán más grande del sistema solar.'
  },
  {
    name: 'Jupiter',
    path: './assets/Models/Jupiter.glb',
    audioPath: './assets/Audio/Jupiter.mp3',
    rotationSpeed: 0.02,
    orbitSpeed: 0.0008,
    radius: 52.0,
    isOrbiting: true,
    info: 'Júpiter es el planeta más grande, con un diámetro de 139,820 km. Tiene una gran mancha roja, una tormenta gigante.'
  },
  {
    name: 'Saturno',
    path: './assets/Models/Saturno.glb',
    audioPath: './assets/Audio/Saturno.mp3',
    rotationSpeed: 0.018,
    orbitSpeed: 0.0006,
    radius: 95.8,
    isOrbiting: true,
    info: 'Saturno tiene un diámetro de 116,460 km. Es famoso por sus impresionantes anillos de hielo y roca.'
  },
  {
    name: 'Urano',
    path: './assets/Models/Urano.glb',
    audioPath: './assets/Audio/Urano.mp3',
    rotationSpeed: 0.012,
    orbitSpeed: 0.0004,
    radius: 191.8,
    isOrbiting: true,
    info: 'Urano tiene un diámetro de 50,724 km. Gira de lado debido a una inclinación extrema de su eje.'
  },
  {
    name: 'Neptuno',
    path: './assets/Models/Neptuno.glb',
    audioPath: './assets/Audio/Neptuno.mp3',
    rotationSpeed: 0.011,
    orbitSpeed: 0.0003,
    radius: 300.7,
    isOrbiting: true,
    info: 'Neptuno tiene un diámetro de 49,244 km. Es conocido por sus fuertes vientos, los más rápidos del sistema solar.'
  }
];

// Audios especiales
const introAudioPath = './assets/Audio/Intro.mp3';
const outroAudioPath = './assets/Audio/Termino.mp3';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010b22); // Azul claro

    // Configurar cámara
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(28.20, 16.80, 9.61);
    this.camera.rotation.set(-1.08, 0.75, 0.90);

    // Audio Listener
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    // Configurar renderizador
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Botón VR
    document.body.appendChild(VRButton.createButton(this.renderer));

    // Controles
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.isManualControlEnabled = true;

    // Variables de movimiento
    this.moveSpeed = 0.1;
    this.velocity = new THREE.Vector3();
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;

    // Objetos para audios
    this.audioBuffers = {};
    this.sounds = {};
    this.currentAudio = null;
    this.audiosLoaded = false; // Nueva bandera

    // Cargar audios al inicio
    this.loadAudios();

    // Configurar eventos
    this.setupEvents();
    this.initScene();

    // Bucle de animación
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  setupEvents() {
    // Activar controles al hacer clic
    document.addEventListener('click', () => {
      if (this.isManualControlEnabled) {
        this.controls.lock();
      }
    });

    // Manejar bloqueo/desbloqueo
    this.controls.addEventListener('lock', () => {
      console.log('Controles bloqueados');
    });
    this.controls.addEventListener('unlock', () => {
      console.log('Controles desbloqueados');
    });

    // Controles de movimiento y secuencia
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyS':
          this.moveForward = true;
          break;
        case 'KeyW':
          this.moveBackward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          this.moveUp = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.moveDown = true;
          break;
        case 'Enter':
          const pos = this.camera.position;
          console.log(
            `Posición de la cámara: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}`
          );
          console.log(
            `Rotación de la cámara: x=${this.camera.rotation.x.toFixed(2)}, y=${this.camera.rotation.y.toFixed(
              2
            )}, z=${this.camera.rotation.z.toFixed(2)}`
          );
          break;
        case 'KeyP':
          if (this.isManualControlEnabled) {
            console.log('Iniciando secuencia de cámara');
            this.startCameraSequence();
          }
          break;
      }
    });

    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'KeyS':
          this.moveForward = false;
          break;
        case 'KeyW':
          this.moveBackward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
        case 'Space':
          this.moveUp = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.moveDown = false;
          break;
      }
    });

    // Redimensionamiento
    window.addEventListener('resize', this.resize.bind(this));
  }

  startCameraSequence() {
    if (!this.audiosLoaded) {
      console.warn('Los audios aún no están cargados. Intenta de nuevo.');
      return;
    }

    this.isManualControlEnabled = false;
    if (this.controls.isLocked) this.controls.unlock();

    console.log('Iniciando secuencia de cámara');

    if (this.currentAudio && this.currentAudio.isPlaying) {
      this.currentAudio.stop();
      this.currentAudio = null;
    }

    const introTween = new TWEEN.Tween({})
      .to({}, this.sounds['inicioSound']?.duration || 2000)
      .onStart(() => {
        console.log('Iniciando introTween');
        if (this.sounds['inicioSound']) {
          this.currentAudio = this.sounds['inicioSound'];
          this.currentAudio.play();
        }
      });

    const planetPositions = [];
    planetsData.forEach((planetData) => {
      const planet = this.scene.getObjectByName(planetData.name);
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
      this.isManualControlEnabled = true;
      return;
    }

    let previousTween = introTween;
    planetPositions.forEach((planetInfo, index) => {
      let posicionXPlus = 0;
      if (planetInfo.name === 'Jupiter' || planetInfo.name === 'Saturno') {
        posicionXPlus = 10;
      } else if (planetInfo.name === 'Urano' || planetInfo.name === 'Neptuno') {
        posicionXPlus = 6;
      } else {
        posicionXPlus = 1;
      }

      const positionTween = new TWEEN.Tween(this.camera.position)
        .to(
          {
            x: planetInfo.position.x + (planetInfo.name === 'Sol' ? 2 : posicionXPlus),
            y: planetInfo.position.y,
            z: planetInfo.position.z
          },
          3000
        )
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onStart(() => {
          console.log(`Iniciando movimiento hacia ${planetInfo.name}`);
          if (this.currentAudio && this.currentAudio.isPlaying) {
            this.currentAudio.stop();
          }
          if (this.sounds[planetInfo.name]) {
            this.currentAudio = this.sounds[planetInfo.name];
            this.currentAudio.play();
          } else {
            console.warn(`No se encontró audio para ${planetInfo.name}`);
          }
        })
        .onComplete(() => {
          console.log(`Completado movimiento hacia ${planetInfo.name}`);
          this.camera.lookAt(planetInfo.position);
        });

      const waitTween = new TWEEN.Tween({})
        .to({}, this.sounds[planetInfo.name]?.duration || 2000);

      previousTween.chain(positionTween);
      positionTween.chain(waitTween);
      previousTween = waitTween;

      if (index === planetPositions.length - 1) {
        waitTween.onComplete(() => {
          if (this.currentAudio && this.currentAudio.isPlaying) {
            this.currentAudio.stop();
          }
          if (this.sounds['terminoSound']) {
            this.currentAudio = this.sounds['terminoSound'];
            this.currentAudio.play();
          }
          planetsData.forEach((planetData) => {
            if (planetData.name !== 'Sol') {
              planetData.rotationSpeed = planetData.rotationSpeedBak || 0;
              planetData.isOrbiting = true;
            }
          });
          this.isManualControlEnabled = true;
          console.log('Secuencia de cámara finalizada');
        });
      }
    });

    introTween.start();
  }

  initScene() {
    // Skybox
    const skyboxTextures = [
      './assets/Texturas/ulukai/corona_ft.png', // Derecha (+X)
      './assets/Texturas/ulukai/corona_bk.png', // Izquierda (-X)
      './assets/Texturas/ulukai/corona_up.png', // Arriba (+Y)
      './assets/Texturas/ulukai/corona_dn.png', // Abajo (-Y)
      './assets/Texturas/ulukai/corona_rt.png', // Frente (+Z)
      './assets/Texturas/ulukai/corona_lf.png' // Atrás (-Z)
    ];
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = cubeTextureLoader.load(skyboxTextures);
    this.scene.background = skyboxTexture;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 5);
    this.scene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xfff8e1, 80, 5000, 2);
    sunLight.position.set(0, 0, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 5000;
    this.scene.add(sunLight);

    // Cargar modelos
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
            }
          });

          if (planetData.name !== 'Sol' && planetData.radius) {
            const angle = (index - 1) * Math.PI / 4;
            planet.position.set(
              planetData.radius * Math.cos(angle),
              0,
              planetData.radius * Math.sin(angle)
            );
          } else {
            planet.position.set(0, 0, 0);
          }
          this.scene.add(planet);
          console.log(
            `Modelo ${planetData.name} cargado en posición:`,
            planet.position
          );
        },
        (progress) => {
          console.log(
            `Cargando ${planetData.name}: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`
          );
        },
        (error) => {
          console.error(
            `Error al cargar el modelo ${planetData.name}:`,
            error
          );
        }
      );
    });
  }

  loadAudios() {
    const audioLoader = new THREE.AudioLoader();
    const audioLoadPromises = [];

    const loadAudio = (path, key) => {
      return new Promise((resolve, reject) => {
        audioLoader.load(
          path,
          (buffer) => {
            this.audioBuffers[key] = buffer;
            console.log(`Audio ${key} cargado`);
            resolve();
          },
          (progress) => {
            console.log(
              `Cargando audio ${key}: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`
            );
          },
          (error) => {
            console.error(`Error al cargar el audio ${key}:`, error);
            reject(error);
          }
        );
      });
    };

    planetsData.forEach((planetData) => {
      audioLoadPromises.push(loadAudio(planetData.audioPath, planetData.name));
    });
    audioLoadPromises.push(loadAudio(introAudioPath, 'inicioSound'));
    audioLoadPromises.push(loadAudio(outroAudioPath, 'terminoSound'));

    Promise.all(audioLoadPromises)
      .then(() => {
        console.log('Todos los audios cargados');
        Object.keys(this.audioBuffers).forEach((key) => {
          const sound = new THREE.Audio(this.listener);
          sound.setBuffer(this.audioBuffers[key]);
          sound.setVolume(0.5);
          sound.duration = this.audioBuffers[key].duration * 1000;
          this.sounds[key] = sound;
        });
        this.audiosLoaded = true; // Marcar como cargados
        console.log('Contenido de this.sounds:', this.sounds); // Depuración
      })
      .catch((error) => {
        console.error('Error al cargar algunos audios:', error);
      });
  }

  animate() {
    TWEEN.update();

    if (this.isManualControlEnabled) {
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.velocity.z = 0;

      if (this.moveForward) this.velocity.z -= this.moveSpeed;
      if (this.moveBackward) this.velocity.z += this.moveSpeed;
      if (this.moveLeft) this.velocity.x -= this.moveSpeed;
      if (this.moveRight) this.velocity.x += this.moveSpeed;
      if (this.moveUp) this.velocity.y += this.moveSpeed;
      if (this.moveDown) this.velocity.y -= this.moveSpeed;

      this.controls.moveRight(this.velocity.x);
      this.controls.moveForward(this.velocity.z);
      this.camera.position.y += this.velocity.y;
    }

    const time = Date.now();
    planetsData.forEach((planetData) => {
      const planet = this.scene.getObjectByName(planetData.name);
      if (planet) {
        planet.rotation.y += planetData.rotationSpeed;
        if (
          planetData.name !== 'Sol' &&
          planetData.orbitSpeed &&
          planetData.radius &&
          planetData.isOrbiting
        ) {
          const angle = time * planetData.orbitSpeed;
          planet.position.set(
            planetData.radius * Math.cos(angle),
            0,
            planetData.radius * Math.sin(angle)
          );
        }
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

export { App };
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createCharacter, CharacterRig } from './characterModel';
import { buildLobby, buildStage, WorldBuildResult } from './worldBuilder';
import { PlayerState, TrailItem, SkinItem } from '../types/game';
import { sound } from '../utils/audio';
import { BOT_NAMES, TRAILS } from '../data/gameData';

export interface SceneCallbacks {
  onSpeedGain: (amount: number) => void;
  onWinStage: (stage: number, wins: number) => void;
  onHeartLost: (currentHearts: number) => void;
  onOpenWorldSelect: () => void;
  onOpenStageSelect: () => void;
  onLobbyEntered: () => void;
}

export class ThreeGameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animationFrameId: number = 0;
  private isDestroyed: boolean = false;
  private isSoftwareGl: boolean = false;

  // Player & Character
  private playerRig: CharacterRig;
  private playerPos = new THREE.Vector3(0, 0.5, 18);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private isGrounded = true;
  private moveInput = new THREE.Vector2(0, 0);
  private jumpRequested = false;

  // Game world
  private currentWorldId: number = 1;
  private currentStageNum: number = 0; // 0 = Lobby, 1+ = Stage
  private currentWorldData: WorldBuildResult | null = null;
  private stageGroup = new THREE.Group();

  // Trail Particles
  private trailParticles: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];
  private trailGroup = new THREE.Group();
  private equippedTrail: TrailItem = TRAILS[0];

  // Bots
  private bots: { rig: CharacterRig; pos: THREE.Vector3; targetZ: number; speed: number }[] = [];

  // Key tracking
  private keysDown: { [key: string]: boolean } = {};

  // External Callbacks
  private callbacks: SceneCallbacks;

  // Cached math helpers
  private _camTarget = new THREE.Vector3();
  private _playerBox = new THREE.Box3();
  private _playerBoxSize = new THREE.Vector3(0.6, 1.6, 0.6);

  // Speed multiplier tracking
  private activeTreadmillMult: number = 0;
  private stepSoundTimer: number = 0;

  constructor(container: HTMLElement, initialState: PlayerState, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Detect software GL
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } else {
      this.isSoftwareGl = true;
    }

    // 2. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1e1b4b');
    this.scene.fog = new THREE.FogExp2('#1e1b4b', 0.015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );

    // 4. Lighting & Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight('#c084fc', '#1e1b4b', 0.85);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.8);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = !this.isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    const d = 30;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Add trail group
    this.scene.add(this.trailGroup);
    this.scene.add(this.stageGroup);

    // 5. Create Player
    this.playerRig = createCharacter(initialState.name, initialState.level);
    this.playerRig.root.position.copy(this.playerPos);
    this.scene.add(this.playerRig.root);

    // 6. Spawn simulated bots in lobby
    this.spawnLobbyBots();

    // 7. Load World / Stage
    this.loadWorldOrStage(initialState.currentWorld, initialState.currentStage);

    // 8. Bind Input Listeners
    this.setupInputs();

    // 9. Resize Listener
    window.addEventListener('resize', this.onResize);

    // 10. Start Loop
    this.tick();
  }

  private spawnLobbyBots() {
    for (let i = 0; i < 4; i++) {
      const botName = BOT_NAMES[i % BOT_NAMES.length];
      const botRig = createCharacter(botName, 150 + i * 40);
      const startX = (i - 1.5) * 5;
      const startZ = 4 + (i % 3) * 6;
      const pos = new THREE.Vector3(startX, 0.5, startZ);
      botRig.root.position.copy(pos);
      this.scene.add(botRig.root);
      this.bots.push({
        rig: botRig,
        pos,
        targetZ: startZ + (i % 2 === 0 ? 8 : -8),
        speed: 3 + i * 1.5,
      });
    }
  }

  public loadWorldOrStage(worldId: number, stageNum: number) {
    this.currentWorldId = worldId;
    this.currentStageNum = stageNum;

    // Clear previous world group
    while (this.stageGroup.children.length > 0) {
      this.stageGroup.remove(this.stageGroup.children[0]);
    }

    if (stageNum === 0) {
      // Build Lobby
      this.currentWorldData = buildLobby(100, 1);
      this.scene.background = new THREE.Color('#1e1b4b');
      this.scene.fog = new THREE.FogExp2('#1e1b4b', 0.015);
      this.callbacks.onLobbyEntered();
    } else {
      // Build Stage
      this.currentWorldData = buildStage(worldId, stageNum);
      const bgColors = ['#1e1b4b', '#0284c7', '#450a0a', '#052e16', '#17052c'];
      const bgCol = bgColors[(worldId - 1) % bgColors.length];
      this.scene.background = new THREE.Color(bgCol);
      this.scene.fog = new THREE.FogExp2(bgCol, 0.018);
    }

    this.stageGroup.add(this.currentWorldData.group);
    this.respawnPlayer();
  }

  public respawnPlayer() {
    if (this.currentWorldData) {
      this.playerPos.copy(this.currentWorldData.spawnPosition);
      this.playerVel.set(0, 0, 0);
      this.isGrounded = true;
      this.playerRig.root.position.copy(this.playerPos);
      this.playerRig.root.rotation.y = Math.PI; // Face forward
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keysDown[e.code] = true;
      if (e.code === 'Space') {
        this.jumpRequested = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown[e.code] = false;
    });
  }

  public setJoystick(dx: number, dy: number) {
    this.moveInput.set(dx, dy);
  }

  public requestJump() {
    this.jumpRequested = true;
  }

  public setTrail(trail: TrailItem) {
    this.equippedTrail = trail;
  }

  public updatePlayerInfo(name: string, level: number, skin?: SkinItem) {
    this.playerRig.updateNameplate(name, level);
    if (skin) {
      this.playerRig.updateSkin(skin);
    }
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private tick = () => {
    if (this.isDestroyed) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);

    this.updatePhysics(dt);
    this.updateBots(dt);
    this.updateAnimatedObjects(dt);
    this.updateTrail(dt);
    this.updateCamera(dt);

    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private updatePhysics(dt: number) {
    // 1. Gather Directional Input
    let ix = this.moveInput.x;
    let iz = this.moveInput.y;

    if (this.keysDown['KeyW'] || this.keysDown['ArrowUp']) iz -= 1;
    if (this.keysDown['KeyS'] || this.keysDown['ArrowDown']) iz += 1;
    if (this.keysDown['KeyA'] || this.keysDown['ArrowLeft']) ix -= 1;
    if (this.keysDown['KeyD'] || this.keysDown['ArrowRight']) ix += 1;

    const inputLen = Math.sqrt(ix * ix + iz * iz);
    if (inputLen > 1) {
      ix /= inputLen;
      iz /= inputLen;
    }

    // 2. Base & Multiplied Speed
    const trailMult = this.equippedTrail.multiplier || 1;
    // Walk speed dynamically scales for high-adrenaline fun
    const baseWalkSpeed = 12 + Math.min(trailMult, 100) * 0.4;
    const isMoving = inputLen > 0.05;

    if (isMoving) {
      this.playerVel.x = ix * baseWalkSpeed;
      this.playerVel.z = iz * baseWalkSpeed;

      // Rotate player towards movement direction
      const angle = Math.atan2(ix, iz);
      this.playerRig.root.rotation.y = angle;

      // Emit speed gain while running!
      const gained = dt * 15 * trailMult * (this.activeTreadmillMult > 0 ? this.activeTreadmillMult : 1);
      this.callbacks.onSpeedGain(gained);

      // Step sound cadence
      this.stepSoundTimer += dt;
      if (this.stepSoundTimer > 0.32) {
        if (this.activeTreadmillMult > 0) {
          sound.playTreadmillStep();
        }
        this.stepSoundTimer = 0;
      }
    } else {
      this.playerVel.x = 0;
      this.playerVel.z = 0;
    }

    // 3. Jump and Gravity
    if (this.jumpRequested && this.isGrounded) {
      this.playerVel.y = 15;
      this.isGrounded = false;
      this.jumpRequested = false;
      sound.playJump();
    } else {
      this.jumpRequested = false;
    }

    // Gravity
    const gravity = 32;
    this.playerVel.y -= gravity * dt;

    // Apply Velocity to Position
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;
    this.playerPos.z += this.playerVel.z * dt;

    // 4. Collision Detection with World Colliders
    this.updatePlayerBox();

    this.isGrounded = false;
    this.activeTreadmillMult = 0;

    if (this.currentWorldData) {
      for (const col of this.currentWorldData.colliders) {
        if (this._playerBox.intersectsBox(col)) {
          // Check if landing on top of collider
          const playerBottom = this.playerPos.y;
          const colTop = col.max.y;

          if (playerBottom >= colTop - 0.45 && this.playerVel.y <= 0) {
            this.playerPos.y = colTop;
            this.playerVel.y = 0;
            this.isGrounded = true;
            this.updatePlayerBox();
          }
        }
      }

      // Check Triggers (Jump pads, Speed pads, Treadmills, Portals, Hazards)
      for (const trig of this.currentWorldData.triggers) {
        if (this._playerBox.intersectsBox(trig.box)) {
          if (trig.type === 'jump_pad') {
            this.playerVel.y = trig.bounceForce || 24;
            this.playerVel.z = -18; // propel forward along the stage!
            this.isGrounded = false;
            sound.playBounce();
          } else if (trig.type === 'treadmill') {
            this.activeTreadmillMult = trig.multiplier || 1;
            const boost = dt * 100 * (trig.multiplier || 1) * trailMult;
            this.callbacks.onSpeedGain(boost);
          } else if (trig.type === 'speed_pad' && trig.bonusSpeed) {
            this.callbacks.onSpeedGain(trig.bonusSpeed);
            sound.playBounce();
          } else if (trig.type === 'stage_portal') {
            this.callbacks.onOpenStageSelect();
          } else if (trig.type === 'world_portal') {
            this.callbacks.onOpenWorldSelect();
          } else if (trig.type === 'win_pad') {
            this.callbacks.onWinStage(this.currentStageNum, trig.bonusWins || 10);
            sound.playWin();
            // Advance to next stage or back to lobby
            this.loadWorldOrStage(this.currentWorldId, this.currentStageNum + 1);
            return;
          } else if (trig.type === 'hazard') {
            sound.playWrong();
            this.callbacks.onHeartLost(1);
            this.respawnPlayer();
            return;
          }
        }
      }
    }

    // 5. Void Fall Detection
    if (this.playerPos.y < -12) {
      sound.playWrong();
      this.callbacks.onHeartLost(1);
      this.respawnPlayer();
      return;
    }

    // 6. Update Rig Position & Animation
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.animate(isMoving ? 1 : 0, this.isGrounded, dt);
  }

  private updatePlayerBox() {
    this._playerBox.min.set(
      this.playerPos.x - this._playerBoxSize.x / 2,
      this.playerPos.y,
      this.playerPos.z - this._playerBoxSize.z / 2
    );
    this._playerBox.max.set(
      this.playerPos.x + this._playerBoxSize.x / 2,
      this.playerPos.y + this._playerBoxSize.y,
      this.playerPos.z + this._playerBoxSize.z / 2
    );
  }

  private updateBots(dt: number) {
    if (this.currentStageNum !== 0) return; // Bots are in lobby

    for (const bot of this.bots) {
      const dz = bot.targetZ - bot.pos.z;
      if (Math.abs(dz) < 0.5) {
        bot.targetZ = bot.pos.z > 10 ? 2 : 18;
      } else {
        const dir = Math.sign(dz);
        bot.pos.z += dir * bot.speed * dt;
        bot.rig.root.rotation.y = dir > 0 ? 0 : Math.PI;
      }
      bot.rig.root.position.copy(bot.pos);
      bot.rig.animate(1, true, dt);
    }
  }

  private updateAnimatedObjects(dt: number) {
    if (!this.currentWorldData) return;
    const time = this.clock.getElapsedTime();
    for (const obj of this.currentWorldData.animatedObjects) {
      if (obj.update) {
        obj.update(dt, time);
      }
    }
  }

  private updateTrail(dt: number) {
    // Spawn particle if moving and grounded
    const isMoving = this.playerVel.lengthSq() > 0.5;

    if (isMoving && Math.random() < 0.6) {
      const pGeo = new THREE.SphereGeometry(0.18, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({
        color: this.equippedTrail.particleColor || '#f43f5e',
        transparent: true,
        opacity: 0.85,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(
        this.playerPos.x + (Math.random() - 0.5) * 0.4,
        this.playerPos.y + 0.15,
        this.playerPos.z + (Math.random() - 0.5) * 0.4
      );
      this.trailGroup.add(pMesh);
      this.trailParticles.push({ mesh: pMesh, life: 0.6, maxLife: 0.6 });
    }

    // Update existing particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.trailGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.trailParticles.splice(i, 1);
      } else {
        const ratio = p.life / p.maxLife;
        p.mesh.scale.setScalar(ratio);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = ratio * 0.85;
      }
    }
  }

  private updateCamera(dt: number) {
    // Third-person smooth follow
    const camOffset = new THREE.Vector3(0, 5.5, 9.5);
    const targetCamPos = this.playerPos.clone().add(camOffset);

    this.camera.position.lerp(targetCamPos, Math.min(dt * 8, 1));
    this._camTarget.copy(this.playerPos).add(new THREE.Vector3(0, 1.8, 0));
    this.camera.lookAt(this._camTarget);
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}

import * as THREE from 'three';
import { createNumberTileTexture, createPumpkinFaceTexture, createTreadmillTexture } from './proceduralTextures';

export interface InteractiveTrigger {
  id: string;
  type: 'treadmill' | 'speed_pad' | 'jump_pad' | 'world_portal' | 'stage_portal' | 'win_pad' | 'hazard';
  box: THREE.Box3;
  mesh?: THREE.Object3D;
  multiplier?: number;
  bonusSpeed?: number;
  bonusWins?: number;
  targetWorld?: number;
  targetStage?: number;
  bounceForce?: number;
}

export interface WorldBuildResult {
  group: THREE.Group;
  colliders: THREE.Box3[];
  triggers: InteractiveTrigger[];
  animatedObjects: {
    mesh: THREE.Object3D;
    type: 'spin' | 'float' | 'treadmill' | 'flicker';
    speed?: number;
    axis?: 'x' | 'y' | 'z';
    update?: (dt: number, time: number) => void;
  }[];
  spawnPosition: THREE.Vector3;
}

/**
 * Builds the Main 3D Lobby matching the screenshots
 */
export function buildLobby(playerLevel: number, currentStage: number): WorldBuildResult {
  const group = new THREE.Group();
  const colliders: THREE.Box3[] = [];
  const triggers: InteractiveTrigger[] = [];
  const animatedObjects: WorldBuildResult['animatedObjects'] = [];

  // Reusable materials
  const wallMat = new THREE.MeshStandardMaterial({
    color: '#312e81', // deep purple
    roughness: 0.8,
  });

  const borderMat = new THREE.MeshStandardMaterial({
    color: '#f97316', // neon orange
    roughness: 0.4,
  });

  // 1. FLOOR: 3x3 Number Blocks Arena (Alternating Orange and Purple cubes with digits 0-9)
  const floorGroup = new THREE.Group();
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const blockGeo = new THREE.BoxGeometry(1.4, 0.6, 1.4);

  // Cache materials for 0-9 in orange and purple
  const orangeMats: THREE.MeshStandardMaterial[] = [];
  const purpleMats: THREE.MeshStandardMaterial[] = [];

  digits.forEach((d) => {
    orangeMats.push(
      new THREE.MeshStandardMaterial({
        map: createNumberTileTexture(d, '#ea580c', '#ffffff'),
        roughness: 0.5,
      })
    );
    purpleMats.push(
      new THREE.MeshStandardMaterial({
        map: createNumberTileTexture(d, '#4338ca', '#ffffff'),
        roughness: 0.5,
      })
    );
  });

  // Grid from x = -16 to 16, z = -12 to 24
  for (let x = -14; x <= 14; x += 1.5) {
    for (let z = -8; z <= 26; z += 1.5) {
      const idx = Math.abs(Math.floor((x * 3 + z * 7))) % 10;
      const isOrange = (Math.floor(x / 1.5) + Math.floor(z / 1.5)) % 2 === 0;
      const mat = isOrange ? orangeMats[idx] : purpleMats[idx];
      const cube = new THREE.Mesh(blockGeo, mat);
      cube.position.set(x, -0.3, z);
      cube.receiveShadow = true;
      floorGroup.add(cube);
    }
  }
  group.add(floorGroup);

  // Big solid floor collider
  const floorBox = new THREE.Box3(
    new THREE.Vector3(-18, -1, -10),
    new THREE.Vector3(18, 0, 30)
  );
  colliders.push(floorBox);

  // 2. SURROUNDING WALLS (Purple with warm lights)
  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 12, 1), wallMat);
  backWall.position.set(0, 5.5, -9);
  backWall.receiveShadow = true;
  group.add(backWall);
  colliders.push(new THREE.Box3().setFromObject(backWall));

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 40), wallMat);
  leftWall.position.set(-16, 5.5, 9);
  leftWall.receiveShadow = true;
  group.add(leftWall);
  colliders.push(new THREE.Box3().setFromObject(leftWall));

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 40), wallMat);
  rightWall.position.set(16, 5.5, 9);
  rightWall.receiveShadow = true;
  group.add(rightWall);
  colliders.push(new THREE.Box3().setFromObject(rightWall));

  // 3. CENTRAL STAGE ENTRANCE PORTAL (Orange arch with "Stage X")
  const portalFrame = new THREE.Group();
  portalFrame.position.set(0, 0, -8);

  const portalArchMat = new THREE.MeshStandardMaterial({
    color: '#ea580c',
    roughness: 0.3,
  });

  const pLeftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 0.8), portalArchMat);
  pLeftPillar.position.set(-3.5, 3, 0);
  portalFrame.add(pLeftPillar);

  const pRightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 0.8), portalArchMat);
  pRightPillar.position.set(3.5, 3, 0);
  portalFrame.add(pRightPillar);

  const pTopBeam = new THREE.Mesh(new THREE.BoxGeometry(8, 0.9, 0.8), portalArchMat);
  pTopBeam.position.set(0, 6.2, 0);
  portalFrame.add(pTopBeam);

  // Portal sign canvas
  const portalSignCanvas = document.createElement('canvas');
  portalSignCanvas.width = 512;
  portalSignCanvas.height = 160;
  const psCtx = portalSignCanvas.getContext('2d')!;
  psCtx.fillStyle = '#1e1b4b';
  psCtx.fillRect(0, 0, 512, 160);
  psCtx.lineWidth = 10;
  psCtx.strokeStyle = '#f97316';
  psCtx.strokeRect(6, 6, 500, 148);
  psCtx.font = '900 64px "Lilita One", sans-serif';
  psCtx.textAlign = 'center';
  psCtx.fillStyle = '#fde047';
  psCtx.fillText(`Stage ${currentStage}`, 256, 75);
  psCtx.font = 'bold 30px "Fredoka", sans-serif';
  psCtx.fillStyle = '#4ade80';
  psCtx.fillText('ENTER PORTAL', 256, 125);

  const portalSignTex = new THREE.CanvasTexture(portalSignCanvas);
  portalSignTex.colorSpace = THREE.SRGBColorSpace;
  const portalSignMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 1.8),
    new THREE.MeshBasicMaterial({ map: portalSignTex, side: THREE.DoubleSide })
  );
  portalSignMesh.position.set(0, 5.2, 0.45);
  portalFrame.add(portalSignMesh);

  // Glowing portal void
  const portalVoid = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 5),
    new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    })
  );
  portalVoid.position.set(0, 2.5, 0);
  portalFrame.add(portalVoid);

  group.add(portalFrame);

  // Trigger for entering the stage
  triggers.push({
    id: 'stage_portal_trigger',
    type: 'stage_portal',
    box: new THREE.Box3(new THREE.Vector3(-3, 0, -8.5), new THREE.Vector3(3, 4, -7.5)),
    targetStage: currentStage,
  });

  // 4. "WORLDS" ARCH PORTAL (Left side arch with glowing colored bulbs)
  const worldsPortal = new THREE.Group();
  worldsPortal.position.set(-10, 0, -8);

  const archBodyMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.4 });
  const wLeft = new THREE.Mesh(new THREE.BoxGeometry(0.7, 5, 0.7), archBodyMat);
  wLeft.position.set(-2.2, 2.5, 0);
  worldsPortal.add(wLeft);

  const wRight = new THREE.Mesh(new THREE.BoxGeometry(0.7, 5, 0.7), archBodyMat);
  wRight.position.set(2.2, 2.5, 0);
  worldsPortal.add(wRight);

  const wTop = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.7, 16, 1, false, 0, Math.PI), archBodyMat);
  wTop.rotation.z = Math.PI;
  wTop.rotation.y = Math.PI / 2;
  wTop.position.set(0, 4.5, 0);
  worldsPortal.add(wTop);

  // Glowing colored bulbs around the arch (yellow, pink, green, cyan)
  const bulbColors = ['#fde047', '#ec4899', '#22c55e', '#06b6d4', '#f97316'];
  for (let i = 0; i < 9; i++) {
    const angle = (i / 8) * Math.PI;
    const bx = Math.cos(angle) * 2.3;
    const by = 2.5 + Math.sin(angle) * 2.3;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: bulbColors[i % bulbColors.length] })
    );
    bulb.position.set(bx, by, 0.35);
    worldsPortal.add(bulb);
  }

  // Worlds sign canvas
  const worldsCanvas = document.createElement('canvas');
  worldsCanvas.width = 384;
  worldsCanvas.height = 128;
  const wCtx = worldsCanvas.getContext('2d')!;
  wCtx.fillStyle = '#1e1b4b';
  wCtx.fillRect(0, 0, 384, 128);
  wCtx.font = '900 48px "Lilita One", sans-serif';
  wCtx.textAlign = 'center';
  wCtx.fillStyle = '#ffffff';
  wCtx.fillText('WORLDS', 192, 54);
  wCtx.font = 'bold 22px "Fredoka", sans-serif';
  wCtx.fillStyle = '#38bdf8';
  wCtx.fillText('SELECT WORLD', 192, 94);

  const worldsSignTex = new THREE.CanvasTexture(worldsCanvas);
  worldsSignTex.colorSpace = THREE.SRGBColorSpace;
  const worldsSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.2),
    new THREE.MeshBasicMaterial({ map: worldsSignTex, side: THREE.DoubleSide })
  );
  worldsSign.position.set(0, 3.2, 0.4);
  worldsPortal.add(worldsSign);

  group.add(worldsPortal);

  // Worlds trigger
  triggers.push({
    id: 'world_portal_trigger',
    type: 'world_portal',
    box: new THREE.Box3(new THREE.Vector3(-12.5, 0, -8.5), new THREE.Vector3(-7.5, 4, -7.5)),
  });

  // 5. BILLBOARD: "TOP SPEED" LEADERBOARD (Right side)
  const lbBoardGroup = new THREE.Group();
  lbBoardGroup.position.set(10.5, 0, -8);

  const lbFrameMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.3 });
  const lbFrame = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6, 0.4), lbFrameMat);
  lbFrame.position.set(0, 3.2, 0);
  lbBoardGroup.add(lbFrame);

  // Leaderboard Canvas Texture
  const lbCanvas = document.createElement('canvas');
  lbCanvas.width = 512;
  lbCanvas.height = 512;
  const lbCtx = lbCanvas.getContext('2d')!;
  lbCtx.fillStyle = '#0f172a';
  lbCtx.fillRect(0, 0, 512, 512);

  lbCtx.fillStyle = '#f97316';
  lbCtx.font = '900 42px "Lilita One", sans-serif';
  lbCtx.textAlign = 'center';
  lbCtx.fillText('TOP SPEED', 256, 50);

  lbCtx.font = 'bold 18px "Fredoka", sans-serif';
  lbCtx.fillStyle = '#94a3b8';
  lbCtx.textAlign = 'left';
  lbCtx.fillText('PLAYER', 40, 85);
  lbCtx.textAlign = 'right';
  lbCtx.fillText('SPEED', 470, 85);

  const topScores = [
    { p: 'FlamePilot90', s: '942.26dc' },
    { p: 'AlphaSpy08', s: '508.27no' },
    { p: 'CocoaSpell39', s: '104.61no' },
    { p: 'ChocoGhost05', s: '27.5no' },
    { p: 'BananaPilot50', s: '311.4oc' },
    { p: 'SpinNugget61', s: '85.03oc' },
    { p: 'CupcakeFairy27', s: '56.85oc' },
    { p: 'GroeneElf65', s: '1.15sp' },
  ];

  topScores.forEach((row, i) => {
    const y = 120 + i * 44;
    lbCtx.fillStyle = i < 3 ? '#fde047' : '#e2e8f0';
    lbCtx.font = 'bold 22px "Fredoka", sans-serif';
    lbCtx.textAlign = 'left';
    lbCtx.fillText(`${i + 1}. ${row.p}`, 40, y);
    lbCtx.textAlign = 'right';
    lbCtx.fillText(row.s, 470, y);
  });

  const lbTex = new THREE.CanvasTexture(lbCanvas);
  lbTex.colorSpace = THREE.SRGBColorSpace;
  const lbScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 5.2),
    new THREE.MeshBasicMaterial({ map: lbTex, side: THREE.DoubleSide })
  );
  lbScreen.position.set(0, 3.2, 0.22);
  lbBoardGroup.add(lbScreen);

  group.add(lbBoardGroup);

  // 6. RUNNING TREADMILL MACHINES (x1, x200, x500 speed)
  const treadmillDefs = [
    { x: -11, mult: 1, label: 'x1 Speed' },
    { x: -5, mult: 50, label: 'x50 Speed' },
    { x: 5, mult: 200, label: 'x200 Speed' },
    { x: 11, mult: 500, label: 'x500 Speed' },
  ];

  treadmillDefs.forEach((td) => {
    const tmGroup = new THREE.Group();
    tmGroup.position.set(td.x, 0, 10);

    // Treadmill frame
    const baseMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 6), baseMat);
    base.position.y = 0.17;
    base.receiveShadow = true;
    tmGroup.add(base);

    // Animated belt
    const { texture: beltTex, update: updateBelt } = createTreadmillTexture();
    const beltMat = new THREE.MeshStandardMaterial({
      map: beltTex,
      roughness: 0.8,
    });
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 5.2), beltMat);
    belt.rotation.x = -Math.PI / 2;
    belt.position.y = 0.36;
    tmGroup.add(belt);

    // Side handrails
    const railMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3 });
    const leftRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5), railMat);
    leftRail.position.set(-1.1, 1.25, -2);
    tmGroup.add(leftRail);

    const rightRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5), railMat);
    rightRail.position.set(1.1, 1.25, -2);
    tmGroup.add(rightRail);

    // Top Bar
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.12), railMat);
    topBar.position.set(0, 2.5, -2);
    tmGroup.add(topBar);

    // Floating Label
    const lblCanvas = document.createElement('canvas');
    lblCanvas.width = 256;
    lblCanvas.height = 96;
    const lCtx = lblCanvas.getContext('2d')!;
    lCtx.fillStyle = '#0284c7';
    lCtx.fillRect(0, 0, 256, 96);
    lCtx.font = '900 40px "Lilita One", sans-serif';
    lCtx.textAlign = 'center';
    lCtx.fillStyle = '#ffffff';
    lCtx.fillText(td.label, 128, 60);

    const lblTex = new THREE.CanvasTexture(lblCanvas);
    lblTex.colorSpace = THREE.SRGBColorSpace;
    const lblMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.7),
      new THREE.MeshBasicMaterial({ map: lblTex, side: THREE.DoubleSide })
    );
    lblMesh.position.set(0, 2.8, -2);
    tmGroup.add(lblMesh);

    group.add(tmGroup);

    // Animate belt
    let beltOffset = 0;
    animatedObjects.push({
      mesh: belt,
      type: 'treadmill',
      update: (dt) => {
        beltOffset += dt * 300 * Math.min(td.mult, 10);
        updateBelt(beltOffset);
      },
    });

    // Trigger box for treadmill zone
    const triggerBox = new THREE.Box3(
      new THREE.Vector3(td.x - 1, 0, 7),
      new THREE.Vector3(td.x + 1, 1.5, 13)
    );
    triggers.push({
      id: `treadmill_${td.mult}`,
      type: 'treadmill',
      box: triggerBox,
      multiplier: td.mult,
    });
  });

  // 7. SPEED FLOOR MULTIPLIER PADS (Scattered on the floor)
  const padData = [
    { x: -2, z: 2, label: '+10k Speed', bonus: 10000, color: '#10b981' },
    { x: 2, z: 2, label: '+100k Speed', bonus: 100000, color: '#3b82f6' },
    { x: 0, z: -3, label: 'LAUNCH PAD', bounce: 22, color: '#f59e0b' },
  ];

  padData.forEach((p, idx) => {
    const padMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.15, 2),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.3 })
    );
    padMesh.position.set(p.x, 0.08, p.z);
    group.add(padMesh);

    if (p.bounce) {
      triggers.push({
        id: `launch_pad_${idx}`,
        type: 'jump_pad',
        box: new THREE.Box3().setFromObject(padMesh),
        bounceForce: p.bounce,
      });
    } else {
      triggers.push({
        id: `speed_pad_${idx}`,
        type: 'speed_pad',
        box: new THREE.Box3().setFromObject(padMesh),
        bonusSpeed: p.bonus,
      });
    }
  });

  // 8. JACK-O'-LANTERN PUMPKINS & CANDLE FLICKER
  const pumpkinTex = createPumpkinFaceTexture();
  const pMat = new THREE.MeshStandardMaterial({
    map: pumpkinTex,
    roughness: 0.4,
  });

  const pumpkinPositions = [
    { x: -6.5, z: -7.5, scale: 0.8 },
    { x: 6.5, z: -7.5, scale: 1.1 },
    { x: -14, z: 2, scale: 0.9 },
    { x: 14, z: 2, scale: 0.9 },
  ];

  pumpkinPositions.forEach((pos) => {
    const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(pos.scale, 16, 16), pMat);
    pumpkin.position.set(pos.x, pos.scale * 0.9, pos.z);
    pumpkin.rotation.y = Math.PI / 4;
    pumpkin.castShadow = true;
    group.add(pumpkin);

    // Warm flickering light inside pumpkin
    const pLight = new THREE.PointLight('#f97316', 3.5, 6);
    pLight.position.set(pos.x, pos.scale * 1.1, pos.z + 0.2);
    group.add(pLight);

    animatedObjects.push({
      mesh: pumpkin,
      type: 'flicker',
      update: () => {
        pLight.intensity = 2.5 + Math.sin(Date.now() * 0.015) * 1.0;
      },
    });
  });

  // 9. BARE SPOOKY TREES ALONG PERIMETER
  const treePositions = [
    { x: -14.5, z: -6 },
    { x: -14.5, z: 8 },
    { x: 14.5, z: -6 },
    { x: 14.5, z: 8 },
  ];

  const woodMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9 });
  treePositions.forEach((tp) => {
    const tree = new THREE.Group();
    tree.position.set(tp.x, 0, tp.z);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 6, 8), woodMat);
    trunk.position.y = 3;
    tree.add(trunk);

    // Branches
    const branch1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.5, 6), woodMat);
    branch1.position.set(0.6, 4.5, 0);
    branch1.rotation.z = -Math.PI / 3;
    tree.add(branch1);

    const branch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 2, 6), woodMat);
    branch2.position.set(-0.5, 5.2, 0);
    branch2.rotation.z = Math.PI / 3.5;
    tree.add(branch2);

    group.add(tree);
  });

  return {
    group,
    colliders,
    triggers,
    animatedObjects,
    spawnPosition: new THREE.Vector3(0, 0.5, 18),
  };
}

/**
 * Builds an Action-Packed Stage Obstacle Course for the selected World and Stage
 */
export function buildStage(worldId: number, stageNumber: number): WorldBuildResult {
  const group = new THREE.Group();
  const colliders: THREE.Box3[] = [];
  const triggers: InteractiveTrigger[] = [];
  const animatedObjects: WorldBuildResult['animatedObjects'] = [];

  // Theme configuration
  const isCloudWorld = worldId === 2;
  const isLavaWorld = worldId === 3;
  const isCyberWorld = worldId === 4;
  const isGalaxyWorld = worldId === 5;

  // Colors
  const primaryColor = isCloudWorld
    ? '#ffffff'
    : isLavaWorld
    ? '#b91c1c'
    : isCyberWorld
    ? '#06b6d4'
    : isGalaxyWorld
    ? '#8b5cf6'
    : '#f97316';

  const secondaryColor = isCloudWorld
    ? '#e0f2fe'
    : isLavaWorld
    ? '#ea580c'
    : isCyberWorld
    ? '#10b981'
    : isGalaxyWorld
    ? '#c084fc'
    : '#7c3aed';

  // 1. START PLATFORM
  const startPlatMat = new THREE.MeshStandardMaterial({
    color: '#22c55e', // Green start zone
    roughness: 0.4,
  });
  const startPlat = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 8), startPlatMat);
  startPlat.position.set(0, -0.4, 0);
  startPlat.receiveShadow = true;
  group.add(startPlat);
  colliders.push(new THREE.Box3().setFromObject(startPlat));

  // Stage Banner at Start
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 160;
  const bCtx = bannerCanvas.getContext('2d')!;
  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(0, 0, 512, 160);
  bCtx.strokeStyle = primaryColor;
  bCtx.lineWidth = 8;
  bCtx.strokeRect(6, 6, 500, 148);
  bCtx.font = '900 64px "Lilita One", sans-serif';
  bCtx.fillStyle = '#fde047';
  bCtx.textAlign = 'center';
  bCtx.fillText(`Stage ${stageNumber}`, 256, 75);
  bCtx.font = 'bold 28px "Fredoka", sans-serif';
  bCtx.fillStyle = '#ffffff';
  bCtx.fillText(isCloudWorld ? 'Cloud Hopping' : isLavaWorld ? 'Lava Escape' : '3x3 Obby', 256, 125);

  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.6),
    new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide })
  );
  bannerMesh.position.set(0, 3.2, -3.8);
  group.add(bannerMesh);

  // 2. OBSTACLE RUNWAY (Z from -5 to -80)
  // Segments depending on stage
  let currentZ = -6;

  // Runway section 1: Stepping Stones / Numbered Blocks
  const section1Length = 10;
  const digits = ['3', '6', '9', '2', '5', '8', '1', '4', '7'];

  for (let i = 0; i < section1Length; i++) {
    const zPos = currentZ - i * 3.5;
    // 3 lane blocks
    for (let lane = -1; lane <= 1; lane++) {
      const xPos = lane * 2.8;
      const digit = digits[(i * 3 + lane + 10) % digits.length];
      const isSafe = (i + lane) % 2 === 0;

      // In Cloud World, create fluffy clouds!
      if (isCloudWorld) {
        const cloudGroup = new THREE.Group();
        cloudGroup.position.set(xPos, 0, zPos);
        const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });

        // Cloud composite: 3 intersecting flattened spheres
        const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), cloudMat);
        c1.scale.set(1.4, 0.45, 1.2);
        cloudGroup.add(c1);

        const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), cloudMat);
        c2.scale.set(1.2, 0.4, 1.1);
        c2.position.set(0.7, 0.1, 0.3);
        cloudGroup.add(c2);

        const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), cloudMat);
        c3.scale.set(1.1, 0.35, 1.0);
        c3.position.set(-0.6, 0.08, -0.2);
        cloudGroup.add(c3);

        group.add(cloudGroup);
        colliders.push(new THREE.Box3(
          new THREE.Vector3(xPos - 1.5, -0.4, zPos - 1.5),
          new THREE.Vector3(xPos + 1.5, 0.25, zPos + 1.5)
        ));
      } else {
        // Numbered 3x3 block
        const blockTex = createNumberTileTexture(
          digit,
          isSafe ? primaryColor : secondaryColor,
          '#ffffff'
        );
        const blockMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.7, 2.4),
          new THREE.MeshStandardMaterial({ map: blockTex, roughness: 0.5 })
        );
        blockMesh.position.set(xPos, -0.35, zPos);
        blockMesh.receiveShadow = true;
        group.add(blockMesh);

        colliders.push(new THREE.Box3().setFromObject(blockMesh));
      }
    }
  }

  currentZ -= section1Length * 3.5;

  // JUMP PAD TRAMPOLINE SECTION
  const jumpPadMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.25, 3.5),
    new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.3 })
  );
  jumpPadMesh.position.set(0, 0, currentZ);
  group.add(jumpPadMesh);
  colliders.push(new THREE.Box3().setFromObject(jumpPadMesh));

  triggers.push({
    id: `stage_jumppad_${stageNumber}`,
    type: 'jump_pad',
    box: new THREE.Box3(
      new THREE.Vector3(-2, 0, currentZ - 2),
      new THREE.Vector3(2, 1.5, currentZ + 2)
    ),
    bounceForce: 26,
  });

  // Long chasm gap over the void/lava!
  currentZ -= 16;

  // ROTATING HAZARD OBSTACLE
  const spinnerGroup = new THREE.Group();
  spinnerGroup.position.set(0, 0.6, currentZ);

  const spinBarMesh = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.4, 0.4),
    new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.2 })
  );
  spinnerGroup.add(spinBarMesh);
  group.add(spinnerGroup);

  animatedObjects.push({
    mesh: spinnerGroup,
    type: 'spin',
    axis: 'y',
    speed: 1.8 + (stageNumber % 5) * 0.4,
    update: (dt) => {
      spinnerGroup.rotation.y += dt * 2.2;
    },
  });

  // Mid platform underneath spinner
  const midPlat = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.8, 6),
    new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.5 })
  );
  midPlat.position.set(0, -0.4, currentZ);
  group.add(midPlat);
  colliders.push(new THREE.Box3().setFromObject(midPlat));

  currentZ -= 10;

  // LASER BEAM HAZARD SECTION
  for (let l = 0; l < 3; l++) {
    const lz = currentZ - l * 4;
    const laserBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 6, 8),
      new THREE.MeshBasicMaterial({ color: '#ef4444' })
    );
    laserBeam.rotation.z = Math.PI / 2;
    laserBeam.position.set(0, 0.45 + (l % 2) * 0.2, lz);
    group.add(laserBeam);

    // Hazard trigger
    triggers.push({
      id: `laser_${l}`,
      type: 'hazard',
      box: new THREE.Box3(
        new THREE.Vector3(-3, 0.2, lz - 0.4),
        new THREE.Vector3(3, 0.8, lz + 0.4)
      ),
    });

    // Floor runway beneath laser
    const laserPlat = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.8, 3.5),
      new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.5 })
    );
    laserPlat.position.set(0, -0.4, lz);
    group.add(laserPlat);
    colliders.push(new THREE.Box3().setFromObject(laserPlat));
  }

  currentZ -= 16;

  // 3. FINAL WIN PLATFORM ("STAGE COMPLETE")
  const winPlat = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.8, 10),
    new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.4 })
  );
  winPlat.position.set(0, -0.4, currentZ);
  winPlat.receiveShadow = true;
  group.add(winPlat);
  colliders.push(new THREE.Box3().setFromObject(winPlat));

  // Big Glowing Victory Ring / Arch
  const winArch = new THREE.Mesh(
    new THREE.TorusGeometry(3, 0.4, 16, 32),
    new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8, roughness: 0.1 })
  );
  winArch.position.set(0, 3.2, currentZ);
  group.add(winArch);

  animatedObjects.push({
    mesh: winArch,
    type: 'spin',
    update: (dt) => {
      winArch.rotation.y += dt * 1.5;
    },
  });

  // Stage Complete Trigger
  triggers.push({
    id: `stage_win_${stageNumber}`,
    type: 'win_pad',
    box: new THREE.Box3(
      new THREE.Vector3(-3.5, 0, currentZ - 3.5),
      new THREE.Vector3(3.5, 4, currentZ + 3.5)
    ),
    bonusWins: 5 + stageNumber * 2,
    targetStage: stageNumber + 1,
  });

  // 4. WATER OR LAVA PLANE BENEATH
  if (isCloudWorld) {
    // Sparkling Ocean water plane
    const waterGeo = new THREE.PlaneGeometry(120, 240);
    const waterMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      roughness: 0.15,
      metalness: 0.2,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -10;
    group.add(water);
  } else if (isLavaWorld) {
    // Sizzling Lava plane
    const lavaGeo = new THREE.PlaneGeometry(120, 240);
    const lavaMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.rotation.x = -Math.PI / 2;
    lava.position.y = -8;
    group.add(lava);
  }

  return {
    group,
    colliders,
    triggers,
    animatedObjects,
    spawnPosition: new THREE.Vector3(0, 0.5, 2),
  };
}

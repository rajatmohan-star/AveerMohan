import * as THREE from 'three';
import { createStripedTexture, createRainbowTexture } from './proceduralTextures';
import { SkinItem } from '../types/game';

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Mesh;
  hatGroup: THREE.Group;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  nameSprite: THREE.Sprite;
  animate: (speedRatio: number, isGrounded: boolean, dt: number) => void;
  updateNameplate: (name: string, level: number) => void;
  updateSkin: (skin: SkinItem) => void;
}

export function createCharacter(name: string, level: number, skin?: SkinItem): CharacterRig {
  const root = new THREE.Group();

  // Reusable materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: '#ffddb3',
    roughness: 0.5,
    metalness: 0.05,
  });

  const hoodieMaterial = new THREE.MeshStandardMaterial({
    color: skin?.bodyColor || '#ef4444',
    roughness: 0.6,
  });

  const pantsMaterial = new THREE.MeshStandardMaterial({
    map: createStripedTexture(),
    roughness: 0.6,
  });

  const shoeMaterial = new THREE.MeshStandardMaterial({
    color: '#3b82f6',
    roughness: 0.4,
  });

  // 1. Torso
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.8, 0.45);
  const torso = new THREE.Mesh(torsoGeo, hoodieMaterial);
  torso.position.y = 1.1;
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  // 2. Head
  const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  const head = new THREE.Mesh(headGeo, skinMaterial);
  head.position.set(0, 0.68, 0);
  head.castShadow = true;
  torso.add(head);

  // Eyes and smile on head front (+Z)
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#111827' });
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.04), eyeMat);
  leftEye.position.set(-0.14, 0.05, 0.28);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.04), eyeMat);
  rightEye.position.set(0.14, 0.05, 0.28);
  head.add(rightEye);

  // 3. Hat Group
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.35, 0);
  head.add(hatGroup);

  const buildHat = (type: string, color: string) => {
    while (hatGroup.children.length > 0) {
      hatGroup.remove(hatGroup.children[0]);
    }

    if (type === 'tophat') {
      // Brim
      const brimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.06, 16);
      const brimMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3 });
      const brim = new THREE.Mesh(brimGeo, brimMat);
      hatGroup.add(brim);

      // Crown with rainbow texture
      const crownGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.55, 16);
      const crownMat = new THREE.MeshStandardMaterial({
        map: createRainbowTexture(),
        roughness: 0.4,
      });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 0.28;
      hatGroup.add(crown);
    } else if (type === 'wizard') {
      const coneGeo = new THREE.ConeGeometry(0.38, 0.8, 16);
      const coneMat = new THREE.MeshStandardMaterial({ color: color || '#7c3aed', roughness: 0.4 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 0.4;
      hatGroup.add(cone);
    } else if (type === 'crown') {
      const crownGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.3, 8);
      const crownMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8, roughness: 0.2 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 0.18;
      hatGroup.add(crown);
    } else if (type === 'pumpkin') {
      const pGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const pMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.5 });
      const pumpkin = new THREE.Mesh(pGeo, pMat);
      pumpkin.position.y = 0.25;
      hatGroup.add(pumpkin);
    } else {
      // Cap
      const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: color || '#0891b2' });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.1;
      hatGroup.add(cap);
    }
  };

  buildHat(skin?.hatType || 'tophat', skin?.hatColor || '#ec4899');

  // 4. Arms
  const armGeo = new THREE.BoxGeometry(0.2, 0.65, 0.2);
  armGeo.translate(0, -0.3, 0); // Pivot at shoulder

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 0.35, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, hoodieMaterial);
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  torso.add(leftArm);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 0.35, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, hoodieMaterial);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);
  torso.add(rightArm);

  // Lollipop / Wand in right hand
  const stickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
  const stickMat = new THREE.MeshStandardMaterial({ color: '#fef08a' });
  const stick = new THREE.Mesh(stickGeo, stickMat);
  stick.position.set(0.02, -0.5, 0.18);
  stick.rotation.x = Math.PI / 4;
  rightArm.add(stick);

  const candyGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16);
  const candyMat = new THREE.MeshStandardMaterial({ map: createRainbowTexture() });
  const candy = new THREE.Mesh(candyGeo, candyMat);
  candy.position.set(0, 0.2, 0);
  candy.rotation.z = Math.PI / 2;
  stick.add(candy);

  // 5. Legs
  const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.24);
  legGeo.translate(0, -0.32, 0); // Pivot at hip

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.19, -0.4, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMaterial);
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);

  // Left shoe
  const shoeGeo = new THREE.BoxGeometry(0.25, 0.14, 0.35);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  leftShoe.position.set(0, -0.6, 0.05);
  leftLeg.add(leftShoe);
  torso.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.19, -0.4, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMaterial);
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);

  // Right shoe
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMaterial);
  rightShoe.position.set(0, -0.6, 0.05);
  rightLeg.add(rightShoe);
  torso.add(rightLeg);

  // 6. Nameplate Sprite
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const nameTexture = new THREE.CanvasTexture(canvas);
  nameTexture.colorSpace = THREE.SRGBColorSpace;
  const nameSpriteMat = new THREE.SpriteMaterial({
    map: nameTexture,
    transparent: true,
    depthTest: false,
  });
  const nameSprite = new THREE.Sprite(nameSpriteMat);
  nameSprite.position.set(0, 2.2, 0);
  nameSprite.scale.set(2.4, 0.6, 1);
  root.add(nameSprite);

  const drawNameplate = (currentName: string, currentLevel: number) => {
    ctx.clearRect(0, 0, 512, 128);

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(40, 24, 432, 80, 40);
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Name text
    ctx.font = 'bold 36px "Lilita One", "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${currentName}`, 256, 52);

    ctx.font = 'bold 24px "Fredoka", sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`Lv. ${currentLevel}`, 256, 84);

    nameTexture.needsUpdate = true;
  };

  drawNameplate(name, level);

  // Running animation variables
  let walkTime = 0;

  const animate = (speedRatio: number, isGrounded: boolean, dt: number) => {
    if (!isGrounded) {
      // In air jump pose
      leftLeg.rotation.x = -0.5;
      rightLeg.rotation.x = 0.4;
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      torso.position.y = 1.1 + Math.sin(Date.now() * 0.005) * 0.05;
      return;
    }

    if (speedRatio > 0.05) {
      walkTime += dt * Math.min(speedRatio * 14, 28);
      const angle = Math.sin(walkTime) * 0.75;

      leftLeg.rotation.x = angle;
      rightLeg.rotation.x = -angle;

      leftArm.rotation.x = -angle * 0.8;
      rightArm.rotation.x = angle * 0.8;

      // Subtle torso bob
      torso.position.y = 1.1 + Math.abs(Math.sin(walkTime * 2)) * 0.08;
    } else {
      // Idle breathing
      const idle = Math.sin(Date.now() * 0.003) * 0.04;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftArm.rotation.x = idle;
      rightArm.rotation.x = -idle;
      torso.position.y = 1.1 + idle * 0.5;
    }
  };

  const updateNameplate = (newName: string, newLevel: number) => {
    drawNameplate(newName, newLevel);
  };

  const updateSkin = (newSkin: SkinItem) => {
    hoodieMaterial.color.set(newSkin.bodyColor);
    buildHat(newSkin.hatType, newSkin.hatColor);
  };

  return {
    root,
    head,
    hatGroup,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    nameSprite,
    animate,
    updateNameplate,
    updateSkin,
  };
}

import * as THREE from 'three';

/**
 * Creates procedural canvas textures for numbered obby tiles, treadmills,
 * portals, billboards, and pumpkin faces.
 */

// Number tile texture (e.g. "3", "7", "0", etc.)
export function createNumberTileTexture(numberStr: string, bgColor: string, textColor: string = '#ffffff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 256);

  // Inner beveled border
  ctx.lineWidth = 14;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.strokeRect(10, 10, 236, 236);

  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.strokeRect(18, 18, 220, 220);

  // Big number in center with cartoon drop shadow
  ctx.font = '900 130px "Lilita One", "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillText(numberStr, 128 + 6, 128 + 8);

  // Number stroke
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#0f172a';
  ctx.strokeText(numberStr, 128, 128);

  // Number fill
  ctx.fillStyle = textColor;
  ctx.fillText(numberStr, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Treadmill belt texture with animated arrows
export function createTreadmillTexture(): { texture: THREE.CanvasTexture; canvas: HTMLCanvasElement; update: (offset: number) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const draw = (offset: number) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 512);

    // Tread lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    // Glowing chevron arrows pointing forward
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = '#0284c7';
    ctx.lineWidth = 12;

    const spacing = 128;
    for (let y = -spacing; y < 512 + spacing; y += spacing) {
      const cy = ((y + offset) % (512 + spacing));
      ctx.beginPath();
      ctx.moveTo(60, cy + 40);
      ctx.lineTo(128, cy - 20);
      ctx.lineTo(196, cy + 40);
      ctx.stroke();
    }
  };

  draw(0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  return {
    texture,
    canvas,
    update: (offset: number) => {
      draw(offset);
      texture.needsUpdate = true;
    },
  };
}

// Pumpkin face texture
export function createPumpkinFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Orange skin
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(1, '#c2410c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Carved glowing eyes & mouth
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 15;

  // Left eye (triangle)
  ctx.beginPath();
  ctx.moveTo(60, 70);
  ctx.lineTo(95, 120);
  ctx.lineTo(60, 120);
  ctx.closePath();
  ctx.fill();

  // Right eye
  ctx.beginPath();
  ctx.moveTo(196, 70);
  ctx.lineTo(196, 120);
  ctx.lineTo(161, 120);
  ctx.closePath();
  ctx.fill();

  // Nose (triangle)
  ctx.beginPath();
  ctx.moveTo(128, 115);
  ctx.lineTo(142, 145);
  ctx.lineTo(114, 145);
  ctx.closePath();
  ctx.fill();

  // Jagged Jack-O-Lantern mouth
  ctx.beginPath();
  ctx.moveTo(50, 175);
  ctx.lineTo(75, 195);
  ctx.lineTo(95, 175);
  ctx.lineTo(128, 205);
  ctx.lineTo(160, 175);
  ctx.lineTo(180, 195);
  ctx.lineTo(205, 175);
  ctx.lineTo(190, 220);
  ctx.lineTo(160, 210);
  ctx.lineTo(128, 225);
  ctx.lineTo(95, 210);
  ctx.lineTo(65, 220);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Striped texture for character pants (red & white stripes)
export function createStripedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#e11d48'; // vibrant red
  for (let x = 0; x < 128; x += 32) {
    ctx.fillRect(x, 0, 16, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Rainbow gradient texture for the top hat
export function createRainbowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];
  const stripeH = 128 / colors.length;

  colors.forEach((col, idx) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, idx * stripeH, 128, stripeH);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

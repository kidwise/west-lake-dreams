import * as Phaser from 'phaser';
import { W, H } from '../core/config';
import { petal, rng } from '../art/paint';
import { drawPerson, type Look } from '../art/Cyclist';

type G = Phaser.GameObjects.Graphics;
type Ctx = CanvasRenderingContext2D;

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

// ---- the three of us in winter clothes ----------------------------------------------

export type Kid = 'me' | 'gogo' | 'koko';

export const WINTER: Record<Kid, Look & { scarf: number; hat?: number }> = {
  me: { shirt: 0x3b6ea5, pants: 0x2c3e50, bike: 0, hair: 'short', scarf: 0xe8e4da, hat: 0xc0392b },
  gogo: { shirt: 0x2e8b57, pants: 0x2c3e50, bike: 0, hair: 'cap', cap: 0xf4d03f, scarf: 0x1f618d },
  koko: { shirt: 0xe05a6a, pants: 0x5b4b8a, bike: 0, hair: 'ponytail', scarf: 0xf7a8c4 },
};

/** A kid in a down jacket, scarf (and GOGO's bobble hat). Ground at y = 0. */
export function drawKid(g: G, who: Kid, opts: { facing?: 1 | -1; armUp?: boolean } = {}): void {
  const look = WINTER[who];
  const f = opts.facing ?? 1;
  drawPerson(g, look, { facing: f, armUp: opts.armUp });
  // puffy jacket seams
  g.lineStyle(1.5, 0x000000, 0.12);
  for (const y of [-90, -78, -66]) g.lineBetween(-13, y, 13, y);
  // scarf, with a tail blowing behind
  g.fillStyle(look.scarf, 1);
  g.fillRoundedRect(-13, -106, 26, 9, 4);
  g.fillRoundedRect(-f * 10 - 4, -102, 8, 22, 3);
  if (who === 'gogo') {
    // bobble on top of the hat
    g.fillStyle(0xffffff, 1);
    g.fillCircle(0, -131, 5);
  }
  if (look.hat !== undefined) {
    g.fillStyle(look.hat, 1);
    g.slice(0, -117, 12.5, Math.PI, Math.PI * 2, false);
    g.fillPath();
    g.fillStyle(0xf6f1e7, 1);
    g.fillRect(-13, -119, 26, 4);
    g.fillCircle(0, -130, 4);
  }
}

// ---- snowfall --------------------------------------------------------------------------

interface Flake {
  img: Phaser.GameObjects.Image;
  vy: number;
  sway: number;
  ph: number;
}

/** Falling snow in three layers (small and far, medium, big and blurry up front). */
export class Snowfall {
  private flakes: Flake[] = [];
  wind = 20;
  /** 0..1, how heavily it is snowing. */
  amount = 1;

  constructor(scene: Phaser.Scene, opts: { count?: number; depth?: number; front?: number } = {}) {
    const count = opts.count ?? 160;
    const depth = opts.depth ?? 400;
    for (let i = 0; i < count; i++) {
      const layer = i < count * 0.55 ? 0 : i < count * 0.9 ? 1 : 2;
      const img = scene.add
        .image(Math.random() * W, Math.random() * H, 'dqFlake')
        .setScrollFactor(0)
        .setDepth(layer === 2 ? (opts.front ?? depth + 50) : depth)
        .setScale(layer === 0 ? 0.25 + Math.random() * 0.2 : layer === 1 ? 0.5 + Math.random() * 0.3 : 1.2 + Math.random() * 0.8)
        .setAlpha(layer === 0 ? 0.6 : layer === 1 ? 0.85 : 0.35);
      this.flakes.push({ img, vy: [30, 60, 110][layer] * (0.7 + Math.random() * 0.6), sway: [10, 18, 30][layer], ph: Math.random() * 6 });
    }
  }

  update(dt: number, time: number): void {
    const sec = dt / 1000;
    this.flakes.forEach((f, i) => {
      f.img.setVisible(i / this.flakes.length < this.amount);
      f.img.y += f.vy * sec;
      f.img.x += (this.wind * (f.vy / 60) + Math.sin(time * 0.001 + f.ph) * f.sway) * sec;
      if (f.img.y > H + 20) {
        f.img.y = -20;
        f.img.x = Math.random() * W;
      }
      if (f.img.x > W + 20) f.img.x = -20;
      if (f.img.x < -20) f.img.x = W + 20;
    });
  }
}

// ---- umbrellas and hats seen from above --------------------------------------------

export type Pattern = 'solid' | 'panels' | 'dots' | 'ring' | 'clear' | 'check';

/** A top-down umbrella (8 panels) with a dusting of snow. */
export function umbrellaTexture(scene: Phaser.Scene, key: string, color: string, pattern: Pattern, seed: number, r = 34): string {
  canvas(scene, key, r * 2 + 6, r * 2 + 6, (ctx) => {
    const c = r + 3;
    const rr = rng(seed);
    // shadow
    ctx.fillStyle = 'rgba(30,40,50,0.25)';
    ctx.beginPath();
    ctx.arc(c + 2, c + 3, r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2;
      const a1 = ((i + 1) / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a0) * r, c + Math.sin(a0) * r);
      ctx.quadraticCurveTo(c + Math.cos((a0 + a1) / 2) * r * 0.9, c + Math.sin((a0 + a1) / 2) * r * 0.9, c + Math.cos(a1) * r, c + Math.sin(a1) * r);
      ctx.closePath();
      if (pattern === 'clear') ctx.fillStyle = 'rgba(230,240,245,0.55)';
      else if (pattern === 'panels') ctx.fillStyle = i % 2 ? color : '#f6f1e7';
      else ctx.fillStyle = color;
      ctx.fill();
      // light on one side of each panel
      ctx.fillStyle = i < 4 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
      ctx.fill();
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.clip();
    if (pattern === 'dots') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.arc(c + (rr() - 0.5) * r * 1.8, c + (rr() - 0.5) * r * 1.8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pattern === 'ring') {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(c, c, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    } else if (pattern === 'check') {
      ctx.fillStyle = 'rgba(30,30,40,0.35)';
      for (let x = -r; x < r; x += 10) for (let y = -r; y < r; y += 10) if (((x + y) / 10) % 2 === 0) ctx.fillRect(c + x, c + y, 5, 5);
    } else if (pattern === 'clear') {
      // a head seen through the plastic
      ctx.fillStyle = 'rgba(43,37,34,0.6)';
      ctx.beginPath();
      ctx.arc(c + 3, c + 4, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    // snow settling on the canopy
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.arc(c + (rr() - 0.5) * r * 1.7, c + (rr() - 0.5) * r * 1.7, 1 + rr() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(c, c, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  return key;
}

/** Someone without an umbrella, seen from above: shoulders and a hat. */
export function hatTexture(scene: Phaser.Scene, key: string, coat: string, hat: string, bobble: boolean, seed: number): string {
  canvas(scene, key, 64, 50, (ctx) => {
    const rr = rng(seed);
    ctx.fillStyle = 'rgba(30,40,50,0.25)';
    ctx.beginPath();
    ctx.ellipse(34, 28, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.ellipse(32, 26, 28, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hat;
    ctx.beginPath();
    ctx.arc(32, 24, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(32, 24, 4 + i * 1.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (bobble) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32, 24, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.arc(34, 26, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(12 + rr() * 40, 14 + rr() * 22, 1 + rr() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  return key;
}

/** 西湖绸伞: silk over bamboo ribs, painted with blossoms. */
function silkUmbrella(ctx: Ctx, r: number): void {
  const c = r + 3;
  ctx.fillStyle = 'rgba(30,40,50,0.25)';
  ctx.beginPath();
  ctx.arc(c + 2, c + 3, r, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(c, c, 4, c, c, r);
  g.addColorStop(0, '#fbf3e6');
  g.addColorStop(1, '#efdcc4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();
  // many fine bamboo ribs
  ctx.strokeStyle = 'rgba(140,100,60,0.45)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
    ctx.stroke();
  }
  // a painted branch of plum blossom (梅)
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c - r * 0.8, c + r * 0.3);
  ctx.quadraticCurveTo(c - r * 0.1, c + r * 0.1, c + r * 0.5, c - r * 0.5);
  ctx.moveTo(c - r * 0.2, c + r * 0.15);
  ctx.lineTo(c - r * 0.05, c + r * 0.55);
  ctx.stroke();
  for (const [x, y] of [[-0.55, 0.22], [-0.2, 0.12], [0.1, -0.08], [0.35, -0.35], [-0.08, 0.45], [0.5, -0.52]]) {
    ctx.fillStyle = '#e8506a';
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(c + x * r + Math.cos(a) * 3, c + y * r + Math.sin(a) * 3, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd36a';
    ctx.beginPath();
    ctx.arc(c + x * r, c + y * r, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c, c, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#5a4030';
  ctx.beginPath();
  ctx.arc(c, c, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ---- textures ----------------------------------------------------------------------------

export function generateDuanqiaoTextures(scene: Phaser.Scene): void {
  canvas(scene, 'dqFlake', 24, 24, (ctx) => {
    const g = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 24, 24);
  });
  bake(scene, 'dqSnowball', 22, 22, (g) => {
    g.fillStyle(0xb9c8d6, 1);
    g.fillCircle(11.5, 12, 9);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(10.5, 10.5, 8.5);
    g.fillStyle(0xe2eaf2, 1);
    g.fillCircle(13, 13, 4);
  });
  bake(scene, 'dqPuff', 60, 60, (g) => {
    g.fillStyle(0xffffff, 0.95);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.fillCircle(30 + Math.cos(a) * 14, 30 + Math.sin(a) * 14, 8);
    }
    g.fillCircle(30, 30, 14);
  });
  canvas(scene, 'dqBrush', 90, 90, (ctx) => {
    const g = ctx.createRadialGradient(45, 45, 0, 45, 45, 45);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 90, 90);
  });
  canvas(scene, 'dqSilk', 92, 92, (ctx) => silkUmbrella(ctx, 43));
  umbrellaTexture(scene, 'dqUmbMine', '#2e6f9e', 'ring', 5, 34);

  // a plane tree (法国梧桐) in winter: mottled trunk, bare branches lined with snow
  bake(scene, 'dqPlane', 300, 460, (g) => {
    const r = rng(14);
    g.fillStyle(0x8a8676, 1);
    g.fillRect(138, 200, 26, 260);
    for (let i = 0; i < 18; i++) {
      g.fillStyle([0xb8b49a, 0x6f6b5c, 0xc9c4ad][i % 3], 1);
      g.fillEllipse(140 + r() * 22, 210 + r() * 240, 10 + r() * 10, 14 + r() * 18);
    }
    const branch = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      g.lineStyle(w, 0x6f6b5c, 1);
      g.lineBetween(x, y, x2, y2);
      // snow along the top of the branch
      g.lineStyle(Math.max(1.5, w * 0.5), 0xffffff, 0.95);
      g.lineBetween(x, y - w * 0.4, x2, y2 - w * 0.4);
      if (depth > 0) {
        branch(x2, y2, a - 0.4 - r() * 0.3, len * 0.72, w * 0.68, depth - 1);
        branch(x2, y2, a + 0.4 + r() * 0.3, len * 0.72, w * 0.68, depth - 1);
      }
    };
    branch(151, 210, -Math.PI / 2 - 0.5, 80, 12, 4);
    branch(151, 210, -Math.PI / 2 + 0.5, 80, 12, 4);
    branch(151, 230, -Math.PI / 2, 60, 9, 3);
    // a few seed balls still hanging
    g.fillStyle(0x6b5a3a, 1);
    for (let i = 0; i < 6; i++) g.fillCircle(60 + r() * 180, 60 + r() * 120, 4);
  });
  // a snowy willow (top-down, for the causeway)
  bake(scene, 'dqWillowTop', 90, 90, (g) => {
    const r = rng(8);
    g.fillStyle(0x203a30, 0.25);
    g.fillCircle(48, 50, 38);
    for (let i = 0; i < 26; i++) {
      g.fillStyle([0x5b7a4a, 0x6f8f5a, 0x4f6a40][i % 3], 1);
      g.fillCircle(45 + (r() - 0.5) * 56, 45 + (r() - 0.5) * 56, 8 + r() * 6);
    }
    g.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 30; i++) g.fillCircle(45 + (r() - 0.5) * 56, 40 + (r() - 0.5) * 50, 3 + r() * 4);
  });
  // a roast sweet-potato cart (烤红薯)
  bake(scene, 'dqCart', 140, 150, (g) => {
    g.fillStyle(0x3a3a3a, 1);
    g.fillCircle(30, 132, 14);
    g.fillCircle(110, 132, 14);
    g.fillStyle(0x6b4a2a, 1);
    g.fillRect(10, 100, 120, 24);
    g.fillStyle(0x4a4a4a, 1);
    g.fillRoundedRect(36, 40, 70, 64, 10);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(64, 6, 12, 36);
    g.fillStyle(0xb5562a, 1);
    for (let i = 0; i < 4; i++) g.fillEllipse(48 + i * 16, 40, 16, 9);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(36, 36, 70, 6, 3);
  });

  // snowman decorations
  bake(scene, 'dqStone', 16, 16, (g) => {
    g.fillStyle(0x2b2b30, 1);
    g.fillEllipse(8, 8, 12, 11);
    g.fillStyle(0x55555c, 1);
    g.fillEllipse(6, 6, 4, 3);
  });
  bake(scene, 'dqBerry', 18, 18, (g) => {
    g.fillStyle(0xc0182a, 1);
    g.fillCircle(9, 10, 6);
    g.fillStyle(0xff6a6a, 1);
    g.fillCircle(7, 8, 2);
    g.fillStyle(0x2f6a3a, 1);
    g.fillTriangle(9, 4, 13, 0, 15, 4);
  });
  bake(scene, 'dqLeaf', 60, 20, (g) => {
    g.fillStyle(0x3f7a3a, 1);
    g.fillPoints(petal(4, 10, 54, 8, Math.PI / 2, 10), true);
    g.lineStyle(1, 0x2a5a2a, 1);
    g.lineBetween(4, 10, 56, 10);
  });
  bake(scene, 'dqTwig', 64, 20, (g) => {
    g.lineStyle(3, 0x5a4030, 1);
    g.lineBetween(2, 12, 62, 8);
    g.lineBetween(36, 10, 50, 2);
    g.lineBetween(20, 11, 28, 18);
  });
  bake(scene, 'dqNeedle', 34, 12, (g) => {
    g.lineStyle(2, 0x2f5a3a, 1);
    g.beginPath();
    g.arc(17, -6, 16, Math.PI * 0.25, Math.PI * 0.75, false);
    g.strokePath();
  });
  bake(scene, 'dqYarn', 70, 26, (g) => {
    g.fillStyle(0xe8506a, 1);
    g.fillRoundedRect(2, 4, 66, 10, 5);
    g.fillRoundedRect(44, 8, 10, 18, 4);
    g.lineStyle(1, 0xffffff, 0.5);
    for (let x = 6; x < 66; x += 6) g.lineBetween(x, 5, x + 3, 13);
  });
  bake(scene, 'dqTeaHat', 50, 30, (g) => {
    for (let i = 0; i < 6; i++) {
      g.fillStyle(i % 2 ? 0x6f9a3a : 0x5a8a2a, 1);
      g.fillPoints(petal(25, 28, 24, 6, -0.8 + i * 0.32, 8), true);
    }
  });
  bake(scene, 'dqPersimmon', 30, 26, (g) => {
    g.fillStyle(0xf08a24, 1);
    g.fillEllipse(15, 16, 26, 18);
    g.fillStyle(0x3f6a2a, 1);
    for (let i = 0; i < 4; i++) g.fillPoints(petal(15, 8, 8, 3, -1.2 + i * 0.8, 6), true);
  });
}

/** A parked car seen from the side (no snow; the snow cap is drawn separately so it can be scraped). */
export function drawCar(g: G, x: number, y: number, color: number): void {
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(x, y + 4, 230, 16);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - 110, y - 52, 220, 40, 14);
  g.fillRoundedRect(x - 66, y - 90, 130, 46, 16);
  g.fillStyle(0xbcd4e6, 1);
  g.fillRoundedRect(x - 56, y - 82, 54, 32, 6);
  g.fillRoundedRect(x + 6, y - 82, 50, 32, 6);
  g.fillStyle(0x2a2a2a, 1);
  g.fillCircle(x - 64, y - 10, 20);
  g.fillCircle(x + 64, y - 10, 20);
  g.fillStyle(0x9a9a9a, 1);
  g.fillCircle(x - 64, y - 10, 9);
  g.fillCircle(x + 64, y - 10, 9);
  g.fillStyle(0xffe08a, 1);
  g.fillRect(x + 100, y - 44, 10, 8);
}

/** A park bench seen from the side. */
export function drawBench(g: G, x: number, y: number): void {
  g.fillStyle(0x3a3a3a, 1);
  g.fillRect(x - 70, y - 40, 8, 40);
  g.fillRect(x + 62, y - 40, 8, 40);
  g.fillStyle(0x8a5a3a, 1);
  g.fillRect(x - 80, y - 46, 160, 10);
  g.fillRect(x - 80, y - 82, 160, 8);
  g.fillRect(x - 80, y - 66, 160, 8);
}

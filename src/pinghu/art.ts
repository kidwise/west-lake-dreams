import * as Phaser from 'phaser';
import { rng } from '../art/paint';

type G = Phaser.GameObjects.Graphics;
type Ctx = CanvasRenderingContext2D;

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export const MOON = 240;

/** The full moon: pale gold with soft grey 'seas'. */
function paintMoon(ctx: Ctx): void {
  const c = MOON / 2;
  const r = c - 6;
  const g = ctx.createRadialGradient(c - 20, c - 24, 10, c, c, r);
  g.addColorStop(0, '#fffbe8');
  g.addColorStop(0.7, '#fbeec2');
  g.addColorStop(1, '#efd99a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();
  const rr = rng(4);
  for (const [x, y, w, h] of [[0.38, 0.36, 0.3, 0.2], [0.62, 0.5, 0.26, 0.3], [0.45, 0.66, 0.24, 0.16], [0.3, 0.55, 0.12, 0.1]]) {
    ctx.fillStyle = 'rgba(190,175,140,0.35)';
    ctx.beginPath();
    ctx.ellipse(MOON * x, MOON * y, MOON * w * 0.5, MOON * h * 0.5, rr() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = 'rgba(200,185,150,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(30 + rr() * 180, 30 + rr() * 180, 3 + rr() * 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** The moon, broken into three jagged pieces (each on a full-size canvas so they line up). */
const CUTS = [
  [[0.5, 0.5], [0.42, 0.34], [0.5, 0.2], [0.44, 0.0]],
  [[0.5, 0.5], [0.66, 0.56], [0.78, 0.7], [1.0, 0.76]],
  [[0.5, 0.5], [0.36, 0.6], [0.3, 0.78], [0.12, 1.0]],
];

function shardPath(ctx: Ctx, i: number): void {
  const a = CUTS[i];
  const b = CUTS[(i + 1) % 3];
  ctx.beginPath();
  for (const [x, y] of a) ctx.lineTo(x * MOON, y * MOON);
  // go round the outside from the end of cut a to the end of cut b
  const ea = Math.atan2(a[a.length - 1][1] - 0.5, a[a.length - 1][0] - 0.5);
  let eb = Math.atan2(b[b.length - 1][1] - 0.5, b[b.length - 1][0] - 0.5);
  if (eb < ea) eb += Math.PI * 2;
  for (let k = 0; k <= 24; k++) {
    const t = ea + ((eb - ea) * k) / 24;
    ctx.lineTo(MOON / 2 + Math.cos(t) * MOON, MOON / 2 + Math.sin(t) * MOON);
  }
  for (let k = b.length - 1; k >= 0; k--) ctx.lineTo(b[k][0] * MOON, b[k][1] * MOON);
  ctx.closePath();
}

/** A side-view kid's lantern: rabbit (KOKO), revolving (GOGO) or lotus (me). */
export function drawLantern(g: G, kind: 'rabbit' | 'turn' | 'lotus', x: number, y: number, phase = 0): void {
  g.lineStyle(2, 0x5a4030, 1);
  g.lineBetween(x, y - 40, x, y - 4);
  if (kind === 'rabbit') {
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(x, y + 14, 34, 24);
    g.fillEllipse(x + 14, y + 4, 18, 16);
    g.fillEllipse(x + 12, y - 8, 6, 16);
    g.fillEllipse(x + 18, y - 8, 6, 16);
    g.fillStyle(0xe8506a, 1);
    g.fillCircle(x + 18, y + 3, 2);
    g.fillStyle(0xffd27a, 0.5);
    g.fillEllipse(x - 2, y + 14, 22, 14);
    g.fillStyle(0x3a3a3a, 1);
    g.fillCircle(x - 8, y + 27, 3);
    g.fillCircle(x + 8, y + 27, 3);
  } else if (kind === 'turn') {
    g.fillStyle(0xc0392b, 1);
    g.fillRect(x - 15, y - 4, 30, 6);
    g.fillRect(x - 15, y + 30, 30, 6);
    g.fillStyle(0xffe6a8, 1);
    g.fillRect(x - 13, y + 2, 26, 28);
    // silhouettes turning round inside
    g.fillStyle(0x3a2a20, 0.7);
    for (let i = 0; i < 2; i++) {
      const px = x + Math.sin(phase + i * Math.PI) * 9;
      g.fillCircle(px, y + 12, 3);
      g.fillTriangle(px - 4, y + 26, px + 4, y + 26, px, y + 14);
    }
    g.fillStyle(0xf1c40f, 1);
    g.fillRect(x - 2, y + 36, 4, 8);
  } else {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      g.fillStyle(i % 2 ? 0xf6a8c4 : 0xe86a9a, 1);
      g.fillEllipse(x + Math.cos(a) * 12, y + 16 + Math.sin(a) * 10, 14, 22);
    }
    g.fillStyle(0xffe6a8, 1);
    g.fillCircle(x, y + 14, 6);
    g.fillStyle(0x4f8f4a, 1);
    g.fillEllipse(x, y + 26, 34, 8);
  }
}

export function generatePinghuTextures(scene: Phaser.Scene): void {
  canvas(scene, 'phMoon', MOON, MOON, paintMoon);
  for (let i = 0; i < 3; i++) {
    canvas(scene, `phShard${i}`, MOON, MOON, (ctx) => {
      ctx.save();
      shardPath(ctx, i);
      ctx.clip();
      paintMoon(ctx);
      ctx.restore();
    });
  }
  canvas(scene, 'phHalo', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,240,190,0.7)');
    g.addColorStop(0.5, 'rgba(255,230,170,0.18)');
    g.addColorStop(1, 'rgba(255,230,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  // the Jade Rabbit, glowing faintly
  bake(scene, 'phRabbit', 80, 70, (g) => {
    g.fillStyle(0xfff6d6, 0.25);
    g.fillCircle(40, 40, 32);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(36, 48, 40, 28);
    g.fillEllipse(54, 34, 22, 20);
    g.fillEllipse(50, 14, 8, 24);
    g.fillEllipse(58, 14, 8, 24);
    g.fillStyle(0xf7c6d6, 1);
    g.fillEllipse(50, 14, 3, 16);
    g.fillEllipse(58, 14, 3, 16);
    g.fillStyle(0xe8506a, 1);
    g.fillCircle(60, 32, 2.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(17, 46, 6);
  });
  // an octagonal pavilion roof seen from above
  bake(scene, 'phPavTop', 160, 160, (g) => {
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      return V(80 + Math.cos(a) * 72, 80 + Math.sin(a) * 72);
    });
    g.fillStyle(0x000000, 0.3);
    g.fillPoints(pts.map((p) => V(p.x + 6, p.y + 8)), true);
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % 8];
      g.fillStyle(i % 2 ? 0x3d4a4f : 0x4b5a60, 1);
      g.fillTriangle(80, 80, p.x, p.y, q.x, q.y);
    });
    g.lineStyle(3, 0x2a3236, 1);
    g.strokePoints(pts, true);
    for (const p of pts) g.lineBetween(80, 80, p.x, p.y);
    // upturned corners
    for (const p of pts) {
      g.fillStyle(0x2a3236, 1);
      g.fillCircle(80 + (p.x - 80) * 1.1, 80 + (p.y - 80) * 1.1, 4);
    }
    g.fillStyle(0xd9b45a, 1);
    g.fillCircle(80, 80, 7);
  });
  // a fish's shadow under the water
  bake(scene, 'phFish', 90, 40, (g) => {
    g.fillStyle(0x05121c, 0.55);
    g.fillEllipse(40, 20, 64, 22);
    g.fillTriangle(66, 20, 88, 6, 88, 34);
  });
  bake(scene, 'phStar', 8, 8, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 1.6);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(4, 4, 3.5);
  });
}

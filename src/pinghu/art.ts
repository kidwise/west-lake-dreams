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

function lg(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** An upturned eave seen from the front: a curved roof band with lifted tips. */
function eaveFront(ctx: Ctx, cx: number, y: number, w: number, h: number, top: string, bottom: string): void {
  ctx.fillStyle = lg(ctx, 0, y - h, 0, y + 4, [[0, top], [1, bottom]]);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 12, y - 14);
  ctx.quadraticCurveTo(cx - w / 2 + w * 0.1, y + 3, cx - w * 0.32, y + 3);
  ctx.lineTo(cx + w * 0.32, y + 3);
  ctx.quadraticCurveTo(cx + w / 2 - w * 0.1, y + 3, cx + w / 2 + 12, y - 14);
  ctx.quadraticCurveTo(cx + w * 0.34, y - h * 0.45, cx + w * 0.26, y - h);
  ctx.lineTo(cx - w * 0.26, y - h);
  ctx.quadraticCurveTo(cx - w * 0.34, y - h * 0.45, cx - w / 2 - 12, y - 14);
  ctx.closePath();
  ctx.fill();
  // tile lines
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let k = -12; k <= 12; k++) {
    ctx.beginPath();
    ctx.moveTo(cx + (k / 12) * (w / 2), y + 2);
    ctx.lineTo(cx + (k / 12) * (w * 0.26), y - h + 1);
    ctx.stroke();
  }
  // moonlit rim along the eave
  ctx.strokeStyle = 'rgba(200,215,255,0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 12, y - 14);
  ctx.quadraticCurveTo(cx - w / 2 + w * 0.1, y + 3, cx - w * 0.32, y + 3);
  ctx.lineTo(cx + w * 0.32, y + 3);
  ctx.quadraticCurveTo(cx + w / 2 - w * 0.1, y + 3, cx + w / 2 + 12, y - 14);
  ctx.stroke();
}

/** 御书楼 at night: two storeys, red columns, glowing lattice windows, a name board. */
function paintLibrary(ctx: Ctx): void {
  const W2 = 360;
  const cx = W2 / 2;
  // stone base
  ctx.fillStyle = lg(ctx, 0, 296, 0, 330, [[0, '#4a5068'], [1, '#2a3048']]);
  ctx.fillRect(10, 296, W2 - 20, 34);
  ctx.fillStyle = 'rgba(200,210,240,0.25)';
  ctx.fillRect(10, 296, W2 - 20, 2);
  // ground floor: columns and five lit bays
  ctx.fillStyle = '#1e2238';
  ctx.fillRect(34, 190, W2 - 68, 106);
  for (let i = 0; i < 5; i++) {
    const x = 44 + i * 56;
    const glow = ctx.createLinearGradient(0, 200, 0, 290);
    glow.addColorStop(0, '#ffd890');
    glow.addColorStop(1, '#e09040');
    ctx.fillStyle = glow;
    ctx.fillRect(x, 204, 44, 86);
    ctx.strokeStyle = 'rgba(110,50,20,0.85)';
    ctx.lineWidth = 1.4;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 11, 204);
      ctx.lineTo(x + k * 11, 290);
      ctx.stroke();
    }
    for (let y = 214; y < 290; y += 12) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 44, y);
      ctx.stroke();
    }
  }
  for (let i = 0; i <= 5; i++) {
    ctx.fillStyle = lg(ctx, 36 + i * 56, 0, 44 + i * 56, 0, [[0, '#5a1a1a'], [1, '#8a2a24']]);
    ctx.fillRect(36 + i * 56, 190, 8, 106);
  }
  // first-floor eave with a balcony railing above it
  eaveFront(ctx, cx, 192, W2 - 30, 30, '#202638', '#3a425a');
  ctx.fillStyle = '#2a2e44';
  ctx.fillRect(50, 150, W2 - 100, 12);
  for (let x = 54; x < W2 - 50; x += 10) ctx.fillRect(x, 140, 3, 12);
  ctx.fillRect(50, 138, W2 - 100, 3);
  // upper floor
  ctx.fillStyle = '#1e2238';
  ctx.fillRect(64, 82, W2 - 128, 58);
  for (let i = 0; i < 4; i++) {
    const x = 74 + i * 56;
    ctx.fillStyle = lg(ctx, 0, 90, 0, 136, [[0, '#ffe0a0'], [1, '#e89a48']]);
    ctx.fillRect(x, 92, 40, 42);
    ctx.strokeStyle = 'rgba(110,50,20,0.85)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 4, 96, 32, 34);
    ctx.beginPath();
    ctx.moveTo(x + 20, 92);
    ctx.lineTo(x + 20, 134);
    ctx.moveTo(x, 113);
    ctx.lineTo(x + 40, 113);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    ctx.fillStyle = '#7a2420';
    ctx.fillRect(66 + i * 56, 82, 6, 58);
  }
  // the top roof: a hip-and-gable with ridge ornaments
  eaveFront(ctx, cx, 84, W2 - 70, 56, '#1a2032', '#363e56');
  ctx.fillStyle = '#141826';
  ctx.fillRect(cx - 74, 24, 148, 8);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 74, 30);
    ctx.quadraticCurveTo(cx + s * 86, 14, cx + s * 78, 6);
    ctx.lineTo(cx + s * 70, 26);
    ctx.fill();
  }
  // the name board, gold on black
  ctx.fillStyle = '#141018';
  ctx.fillRect(cx - 40, 150, 80, 26);
  ctx.strokeStyle = '#c8a048';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 38, 152, 76, 22);
  ctx.fillStyle = '#e8c870';
  ctx.font = 'bold 15px "Songti SC", "STSong", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('御 书 楼', cx, 164);
  // warm light spilling from the windows
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(cx, 240, 20, cx, 240, 200);
  halo.addColorStop(0, 'rgba(255,190,110,0.18)');
  halo.addColorStop(1, 'rgba(255,170,90,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 60, W2, 280);
  ctx.restore();
}

/** 月波亭: a hexagonal pavilion on the water, a lantern glowing under its eaves. */
function paintPavilion(ctx: Ctx): void {
  const cx = 90;
  // stilts and the deck
  ctx.fillStyle = '#20263a';
  for (const x of [30, 60, 120, 150]) ctx.fillRect(x, 120, 5, 26);
  ctx.fillStyle = lg(ctx, 0, 112, 0, 124, [[0, '#6a7088'], [1, '#3a4058']]);
  ctx.fillRect(18, 112, 144, 12);
  // the railing round the deck
  ctx.fillStyle = '#b8bed0';
  ctx.fillRect(22, 100, 136, 3);
  for (let x = 24; x < 158; x += 9) ctx.fillRect(x, 100, 2.4, 12);
  // columns, with the lantern glowing between them
  const glow = ctx.createRadialGradient(cx, 84, 2, cx, 84, 50);
  glow.addColorStop(0, 'rgba(255,210,130,0.7)');
  glow.addColorStop(1, 'rgba(255,190,100,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(30, 40, 120, 80);
  for (const x of [34, 74, 102, 142]) {
    ctx.fillStyle = '#6a1e1a';
    ctx.fillRect(x, 58, 5, 44);
  }
  ctx.strokeStyle = '#3a2a20';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, 58);
  ctx.lineTo(cx, 72);
  ctx.stroke();
  ctx.fillStyle = lg(ctx, cx - 7, 0, cx + 7, 0, [[0, '#d0402a'], [0.5, '#ff8a5a'], [1, '#c0301e']]);
  ctx.beginPath();
  ctx.ellipse(cx, 82, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c060';
  ctx.fillRect(cx - 5, 71, 10, 2);
  ctx.fillRect(cx - 5, 91, 10, 2);
  // the roof: steep, with upturned corners and a finial
  eaveFront(ctx, cx, 60, 130, 44, '#1a2032', '#363e56');
  ctx.fillStyle = '#c8a048';
  ctx.beginPath();
  ctx.arc(cx, 12, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 1.5, 12, 3, 6);
}

/** One stone railing post with a carved lotus-bud cap, lit softly from above. */
function paintPost(ctx: Ctx): void {
  ctx.fillStyle = lg(ctx, 0, 0, 40, 0, [[0, '#7a7e8c'], [0.45, '#c4c8d4'], [1, '#6a6e7c']]);
  ctx.fillRect(8, 22, 24, 62);
  ctx.strokeStyle = 'rgba(40,44,60,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 32, 16, 40);
  // the cap: a lotus bud on a cushion
  ctx.fillStyle = lg(ctx, 0, 14, 0, 24, [[0, '#d4d8e2'], [1, '#8a8e9c']]);
  ctx.fillRect(4, 16, 32, 8);
  ctx.fillStyle = lg(ctx, 6, 0, 34, 0, [[0, '#8a8e9c'], [0.5, '#e4e8f0'], [1, '#7a7e8c']]);
  ctx.beginPath();
  ctx.moveTo(10, 16);
  ctx.quadraticCurveTo(12, 2, 20, 0);
  ctx.quadraticCurveTo(28, 2, 30, 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,64,80,0.6)';
  ctx.beginPath();
  ctx.moveTo(20, 2);
  ctx.lineTo(20, 15);
  ctx.moveTo(14, 8);
  ctx.quadraticCurveTo(17, 12, 20, 15);
  ctx.moveTo(26, 8);
  ctx.quadraticCurveTo(23, 12, 20, 15);
  ctx.stroke();
}

/** A carved stone rail panel between two posts. */
function paintPanel(ctx: Ctx): void {
  ctx.fillStyle = lg(ctx, 0, 0, 0, 40, [[0, '#c8ccd6'], [0.2, '#9ea2b0'], [1, '#6a6e7c']]);
  ctx.fillRect(0, 0, 160, 40);
  ctx.fillStyle = 'rgba(230,236,250,0.5)';
  ctx.fillRect(0, 0, 160, 3);
  // a recessed panel with a cloud scroll carved in it
  ctx.fillStyle = 'rgba(40,44,60,0.25)';
  ctx.fillRect(14, 10, 132, 22);
  ctx.strokeStyle = 'rgba(220,226,240,0.55)';
  ctx.lineWidth = 1.4;
  for (const x of [50, 110]) {
    ctx.beginPath();
    ctx.arc(x, 21, 7, Math.PI * 0.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 4, 21, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(57, 21);
  ctx.quadraticCurveTo(80, 12, 103, 21);
  ctx.stroke();
}

/**
 * A West Lake rowing boat (手划船) at night: a dark hull with a gold rim, a
 * curved awning, a lantern on the bow, and the three of us sitting inside.
 */
function paintBoat(ctx: Ctx): void {
  // the hull
  ctx.fillStyle = lg(ctx, 0, 100, 0, 150, [[0, '#4a3628'], [1, '#1e140e']]);
  ctx.beginPath();
  ctx.moveTo(10, 104);
  ctx.quadraticCurveTo(40, 112, 120, 112);
  ctx.lineTo(300, 112);
  ctx.quadraticCurveTo(360, 110, 384, 96);
  ctx.quadraticCurveTo(360, 140, 300, 146);
  ctx.lineTo(90, 146);
  ctx.quadraticCurveTo(40, 140, 10, 104);
  ctx.fill();
  ctx.strokeStyle = '#c8a050';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(12, 105);
  ctx.quadraticCurveTo(40, 113, 120, 113);
  ctx.lineTo(300, 113);
  ctx.quadraticCurveTo(360, 111, 382, 97);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,215,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 126);
  ctx.lineTo(340, 126);
  ctx.stroke();
  // the arched awning over the middle
  ctx.fillStyle = lg(ctx, 0, 40, 0, 110, [[0, '#2a2e42'], [1, '#3e4460']]);
  ctx.beginPath();
  ctx.moveTo(110, 112);
  ctx.lineTo(110, 70);
  ctx.quadraticCurveTo(170, 36, 230, 70);
  ctx.lineTo(230, 112);
  ctx.lineTo(220, 112);
  ctx.lineTo(220, 74);
  ctx.quadraticCurveTo(170, 48, 120, 74);
  ctx.lineTo(120, 112);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lg(ctx, 0, 40, 0, 80, [[0, '#4a5068'], [1, '#2a2e42']]);
  ctx.beginPath();
  ctx.moveTo(104, 72);
  ctx.quadraticCurveTo(170, 30, 236, 72);
  ctx.quadraticCurveTo(170, 48, 104, 72);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,215,255,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(104, 72);
  ctx.quadraticCurveTo(170, 30, 236, 72);
  ctx.stroke();
  // warm light inside the awning
  ctx.fillStyle = 'rgba(255,190,110,0.25)';
  ctx.fillRect(122, 76, 96, 36);
  // the three of us, sitting: KOKO, GOGO, me
  const kid = (x: number, shirt: string, hair: string, cap: boolean, pony: boolean) => {
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.roundRect(x - 9, 92, 18, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#f1c7a5';
    ctx.beginPath();
    ctx.arc(x, 84, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, 83, 8.4, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    if (pony) {
      ctx.beginPath();
      ctx.ellipse(x - 9, 88, 3.4, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (cap) {
      ctx.fillStyle = '#f4d03f';
      ctx.beginPath();
      ctx.arc(x, 82, 9, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x, 80, 13, 3);
    }
    ctx.fillStyle = 'rgba(255,200,140,0.5)';
    ctx.beginPath();
    ctx.arc(x + 4, 84, 3, 0, Math.PI * 2);
    ctx.fill();
  };
  kid(140, '#f1948a', '#2b2522', false, true);
  kid(170, '#5dade2', '#2b2522', true, false);
  kid(200, '#f5f0e1', '#2b2522', false, false);
  // the boatman at the stern with his long oar
  ctx.fillStyle = '#262a3c';
  ctx.beginPath();
  ctx.roundRect(46, 68, 18, 42, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(55, 60, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3e52';
  ctx.beginPath();
  ctx.ellipse(55, 54, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 80);
  ctx.lineTo(4, 150);
  ctx.stroke();
  // the lantern hanging from a pole at the bow
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(330, 108);
  ctx.quadraticCurveTo(350, 60, 366, 50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(366, 50);
  ctx.lineTo(366, 60);
  ctx.stroke();
  ctx.fillStyle = lg(ctx, 356, 0, 376, 0, [[0, '#c0301e'], [0.5, '#ff9a5a'], [1, '#b0281a']]);
  ctx.beginPath();
  ctx.ellipse(366, 72, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c060';
  ctx.fillRect(360, 59, 12, 3);
  ctx.fillRect(360, 82, 12, 3);
}

export function generatePinghuTextures(scene: Phaser.Scene): void {
  canvas(scene, 'phBoatSide', 390, 160, paintBoat);
  canvas(scene, 'phLibrary', 360, 332, paintLibrary);
  canvas(scene, 'phPavilion', 180, 150, paintPavilion);
  canvas(scene, 'phPost', 40, 84, paintPost);
  canvas(scene, 'phPanel', 160, 40, paintPanel);
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

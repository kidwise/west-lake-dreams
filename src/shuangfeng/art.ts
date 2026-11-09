import * as Phaser from 'phaser';
import { rng } from '../art/paint';
import { FONT_SERIF } from '../core/config';
import { baseStyle } from '../ui/text';

type G = Phaser.GameObjects.Graphics;
type Ctx = CanvasRenderingContext2D;
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

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

function blob(ctx: Ctx, x: number, y: number, r: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A cow made of cloud, facing left: puffy body, pale blue-grey patches,
 * cream horns, a pink muzzle and a brass bell. Granny cow wears spectacles.
 */
function paintCow(ctx: Ctx, w: number, granny: boolean): void {
  const s = w / 300;
  ctx.save();
  ctx.scale(s, s);
  const shade = 'rgba(150,170,195,0.55)';
  // soft shadow underneath (the cloud's grey belly)
  for (const [x, y, r] of [[150, 128, 50], [110, 130, 42], [195, 128, 44]]) blob(ctx, x, y + 8, r, shade);
  // legs: short puffs
  for (const x of [98, 128, 186, 214]) {
    blob(ctx, x, 160, 16, '#e9eef6');
    blob(ctx, x, 172, 12, '#dfe6f0');
  }
  // tail with a tuft
  ctx.strokeStyle = '#e4eaf3';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(244, 96);
  ctx.quadraticCurveTo(272, 92, 270, 128);
  ctx.stroke();
  blob(ctx, 270, 134, 10, '#ffffff');
  // body: a cluster of puffs
  const r = rng(granny ? 5 : 9);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    blob(ctx, 160 + Math.cos(a) * 62, 108 + Math.sin(a) * 30, 30 + r() * 10, '#ffffff');
  }
  blob(ctx, 160, 108, 60, '#ffffff');
  // patches, like a dairy cow's, but the colour of rain clouds
  ctx.fillStyle = 'rgba(160,178,204,0.6)';
  for (const [x, y, rx, ry, a] of [[178, 92, 26, 18, 0.3], [128, 120, 18, 13, -0.4], [214, 118, 16, 12, 0.6]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
    ctx.fill();
  }
  // head
  blob(ctx, 70, 84, 34, '#ffffff');
  blob(ctx, 88, 70, 22, '#ffffff');
  // ears
  ctx.fillStyle = '#eef2f8';
  ctx.beginPath();
  ctx.ellipse(96, 56, 16, 8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f6c9d4';
  ctx.beginPath();
  ctx.ellipse(98, 56, 9, 4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // horns
  ctx.fillStyle = '#f3e3b8';
  ctx.beginPath();
  ctx.moveTo(62, 56);
  ctx.quadraticCurveTo(48, 30, 60, 22);
  ctx.quadraticCurveTo(62, 40, 74, 52);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(82, 52);
  ctx.quadraticCurveTo(84, 26, 98, 22);
  ctx.quadraticCurveTo(92, 38, 92, 54);
  ctx.closePath();
  ctx.fill();
  // muzzle
  ctx.fillStyle = '#f7c6cf';
  ctx.beginPath();
  ctx.ellipse(48, 100, 24, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a96';
  for (const x of [40, 56]) {
    ctx.beginPath();
    ctx.ellipse(x, 98, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // eyes: happy, sleepy arcs
  ctx.strokeStyle = '#3a3a48';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const x of [62, 86]) {
    ctx.beginPath();
    ctx.arc(x, 76, 6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  if (granny) {
    // round spectacles
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 2.5;
    for (const x of [62, 86]) {
      ctx.beginPath();
      ctx.arc(x, 76, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(72, 76);
    ctx.lineTo(76, 76);
    ctx.stroke();
  }
  // cheeks
  blob(ctx, 54, 84, 5, 'rgba(240,150,160,0.45)');
  // the bell on a red collar
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(96, 96, 26, Math.PI * 0.45, Math.PI * 0.95);
  ctx.stroke();
  ctx.fillStyle = '#d9a93a';
  ctx.beginPath();
  ctx.moveTo(84, 122);
  ctx.quadraticCurveTo(80, 140, 72, 142);
  ctx.lineTo(100, 142);
  ctx.quadraticCurveTo(92, 140, 90, 122);
  ctx.closePath();
  ctx.fill();
  blob(ctx, 86, 144, 4, '#8a6a20');
  ctx.restore();
}

/** A glass bottle of milk with a paper cap and a hand-drawn label (two little hills). */
function paintBottle(ctx: Ctx): void {
  const w = 64;
  ctx.fillStyle = 'rgba(220,235,240,0.55)';
  ctx.beginPath();
  ctx.moveTo(20, 10);
  ctx.lineTo(44, 10);
  ctx.lineTo(44, 34);
  ctx.quadraticCurveTo(58, 44, 58, 62);
  ctx.lineTo(58, 124);
  ctx.quadraticCurveTo(58, 132, 50, 132);
  ctx.lineTo(14, 132);
  ctx.quadraticCurveTo(6, 132, 6, 124);
  ctx.lineTo(6, 62);
  ctx.quadraticCurveTo(6, 44, 20, 34);
  ctx.closePath();
  ctx.fill();
  // milk inside
  ctx.fillStyle = '#fbfaf4';
  ctx.beginPath();
  ctx.moveTo(22, 22);
  ctx.lineTo(42, 22);
  ctx.lineTo(42, 36);
  ctx.quadraticCurveTo(54, 46, 54, 62);
  ctx.lineTo(54, 122);
  ctx.quadraticCurveTo(54, 128, 48, 128);
  ctx.lineTo(16, 128);
  ctx.quadraticCurveTo(10, 128, 10, 122);
  ctx.lineTo(10, 62);
  ctx.quadraticCurveTo(10, 46, 22, 36);
  ctx.closePath();
  ctx.fill();
  // paper cap, tied with string
  ctx.fillStyle = '#4f86c6';
  ctx.fillRect(17, 4, 30, 12);
  ctx.fillStyle = '#3a6aa6';
  ctx.fillRect(15, 14, 34, 4);
  // label: two little hills, a cloud between them
  ctx.fillStyle = '#e8f1fa';
  ctx.fillRect(10, 70, w - 20, 40);
  ctx.fillStyle = '#5a9a6a';
  ctx.beginPath();
  ctx.moveTo(12, 106);
  ctx.lineTo(24, 80);
  ctx.lineTo(34, 106);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3f7f56';
  ctx.beginPath();
  ctx.moveTo(28, 106);
  ctx.lineTo(42, 76);
  ctx.lineTo(54, 106);
  ctx.closePath();
  ctx.fill();
  blob(ctx, 32, 96, 6, '#ffffff');
  blob(ctx, 40, 97, 5, '#ffffff');
  blob(ctx, 25, 98, 4, '#ffffff');
  // glass highlight
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(13, 50, 4, 64);
}

/**
 * One storey of a pagoda (side view), centred on x with its floor at y:
 * a whitewashed wall with red columns, a doorway, and dark eaves with upturned corners.
 */
export function drawStorey(g: G, x: number, y: number, w: number, h: number, opts: { lit?: number; alpha?: number } = {}): void {
  const a = opts.alpha ?? 1;
  const wall = w * 0.78;
  const eaveH = Math.max(6, h * 0.26);
  // wall
  g.fillStyle(0xf1e6d0, a);
  g.fillRect(x - wall / 2, y - h + eaveH - 2, wall, h - eaveH + 2);
  g.fillStyle(0xa8432f, a);
  const cols = Math.max(2, Math.round(wall / 22));
  for (let i = 0; i <= cols; i++) g.fillRect(x - wall / 2 + (wall * i) / cols - 2, y - h + eaveH, 4, h - eaveH);
  // doorway (lit from inside once the pagoda is finished)
  const lit = opts.lit ?? 0;
  g.fillStyle(lit > 0 ? 0xffc75a : 0x3a2a24, a);
  const dw = Math.min(16, wall * 0.22);
  g.fillRect(x - dw / 2, y - (h - eaveH) * 0.78, dw, (h - eaveH) * 0.78);
  g.fillCircle(x, y - (h - eaveH) * 0.78, dw / 2);
  // balcony rail at the floor
  g.fillStyle(0x7a3a2a, a);
  g.fillRect(x - wall / 2 - 4, y - 4, wall + 8, 4);
  // eaves: a wide dark band with upturned tips
  const top = y - h;
  g.fillStyle(0x3d4a4f, a);
  g.fillPoints([V(x - w / 2, top + eaveH), V(x - w * 0.36, top), V(x + w * 0.36, top), V(x + w / 2, top + eaveH)], true);
  g.fillTriangle(x - w / 2 - 6, top + eaveH - 6, x - w / 2 + 10, top + eaveH, x - w / 2, top + eaveH + 2);
  g.fillTriangle(x + w / 2 + 6, top + eaveH - 6, x + w / 2 - 10, top + eaveH, x + w / 2, top + eaveH + 2);
  g.fillStyle(0x5b6a70, a);
  g.fillRect(x - w * 0.36, top, w * 0.72, 2.5);
}

/** A whole pagoda: `storeys` storeys tapering upward, plus the finial (塔刹). Returns the tip's y. */
export function drawPagoda(g: G, x: number, groundY: number, height: number, opts: { storeys?: number; waist?: number; lit?: number; alpha?: number } = {}): number {
  const n = opts.storeys ?? 7;
  const a = opts.alpha ?? 1;
  const spire = height * 0.12;
  const body = height - spire;
  const sh = body / n;
  const baseW = height * (opts.waist ?? 0.3);
  // stone plinth
  g.fillStyle(0xb9b0a0, a);
  g.fillRect(x - baseW * 0.62, groundY - sh * 0.2, baseW * 1.24, sh * 0.2);
  let y = groundY - sh * 0.2;
  for (let i = 0; i < n; i++) {
    const w = baseW * (1 - i * 0.075);
    drawStorey(g, x, y, w, sh * (1 - i * 0.03), { lit: opts.lit, alpha: a });
    y -= sh * (1 - i * 0.03);
  }
  // finial: a mast with rings and a pearl
  g.fillStyle(0x6b5a3a, a);
  g.fillRect(x - 1.5, y - spire, 3, spire);
  g.fillStyle(0xd9b45a, a);
  for (let k = 0; k < 4; k++) g.fillEllipse(x, y - spire * (0.25 + k * 0.15), 10 - k * 1.5, 3.5);
  g.fillCircle(x, y - spire, 4);
  return y - spire;
}

/**
 * The two peaks as seen from the east, from 洪春桥: the South Peak on the left,
 * the taller North Peak on the right, with lower ridges between. Returns their tops.
 */
export function drawTwinPeaks(g: G, baseY: number, opts: { far?: number; near?: number; ridge?: number } = {}): { south: Phaser.Math.Vector2; north: Phaser.Math.Vector2 } {
  const south = V(360, baseY - 250);
  const north = V(930, baseY - 300);
  const ridge = opts.ridge ?? 0x9fb4b0;
  // distant ridges between and behind
  g.fillStyle(ridge, 1);
  g.fillPoints([V(0, baseY), V(0, baseY - 120), V(160, baseY - 150), V(560, baseY - 130), V(700, baseY - 160), V(1100, baseY - 140), V(1280, baseY - 170), V(1280, baseY)], true);
  const peak = (p: Phaser.Math.Vector2, half: number, col: number, shade: number) => {
    // a soft, rounded hill: a bell curve with a little wobble along the ridge
    const r = rng(Math.round(p.x));
    const h = baseY - p.y;
    const n = 48;
    const pts: Phaser.Math.Vector2[] = [];
    const wob = Array.from({ length: 4 }, () => ({ f: 2 + r() * 5, ph: r() * 6 }));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const dx = (k - 0.5) * 2;
      let y = baseY - h * Math.exp(-dx * dx * 3.2);
      for (const w of wob) y += Math.sin(dx * w.f + w.ph) * 3 * (1 - Math.abs(dx));
      pts.push(V(p.x - half + k * half * 2, Math.min(baseY, y)));
    }
    g.fillStyle(col, 1);
    g.fillPoints([V(p.x - half, baseY), ...pts, V(p.x + half, baseY)], true);
    // the shaded flank, away from the morning sun
    g.fillStyle(shade, 0.45);
    const mid = Math.round(n / 2);
    g.fillPoints([...pts.slice(mid), V(p.x + half, baseY), V(p.x + half * 0.15, baseY)], true);
    // a few darker tree clumps
    for (let i = 0; i < 14; i++) {
      const k = 0.15 + r() * 0.7;
      const x = p.x - half + k * half * 2;
      const dx = (k - 0.5) * 2;
      const top = baseY - h * Math.exp(-dx * dx * 3.2);
      g.fillStyle(shade, 0.35);
      g.fillCircle(x, top + 14 + r() * (baseY - top - 20), 8 + r() * 10);
    }
  };
  peak(south, 300, opts.far ?? 0x7f9e8c, 0x5f7e6c);
  peak(north, 340, opts.near ?? 0x6f907c, 0x4f705c);
  return { south, north };
}

/** A small seated porter's load: two baskets on a shoulder pole (挑山工). */
export function drawPorter(g: G, phase: number): void {
  g.clear();
  const bob = Math.sin(phase * 2) * 2;
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(0, 2, 40, 7);
  // legs mid-stride
  g.lineStyle(8, 0x3a4a5a, 1);
  g.lineBetween(-3, -44, -3 + Math.sin(phase) * 8, -2);
  g.lineBetween(3, -44, 3 - Math.sin(phase) * 8, -2);
  // body, leaning into the slope
  g.fillStyle(0x6a8aa0, 1);
  g.fillRoundedRect(-11, -84 + bob, 22, 42, 7);
  // shoulder pole with two baskets swinging
  g.lineStyle(4, 0x8a6a3a, 1);
  g.lineBetween(-44, -84 + bob, 44, -82 + bob);
  for (const sx of [-40, 40]) {
    const sw = Math.sin(phase * 2 + sx) * 3;
    g.lineStyle(1.5, 0x5a4a2a, 1);
    g.lineBetween(sx, -84 + bob, sx - 10 + sw, -54 + bob);
    g.lineBetween(sx, -84 + bob, sx + 10 + sw, -54 + bob);
    g.fillStyle(0xb08a4a, 1);
    g.fillRoundedRect(sx - 14 + sw, -56 + bob, 28, 22, 5);
    g.lineStyle(1.5, 0x8a6a3a, 1);
    g.lineBetween(sx - 12 + sw, -48 + bob, sx + 12 + sw, -48 + bob);
  }
  // head with a towel round the neck
  g.fillStyle(0xf1c7a5, 1);
  g.fillCircle(2, -96 + bob, 10);
  g.fillStyle(0x2b2522, 1);
  g.slice(2, -96 + bob, 10.5, Math.PI, Math.PI * 2, false);
  g.fillPath();
  g.fillStyle(0xffffff, 1);
  g.fillRect(-9, -88 + bob, 20, 4);
}

/** The square stele pavilion by 洪春桥, with Kangxi's tablet inside. */
export function drawStelePavilion(scene: Phaser.Scene, g: G, x: number, ground: number): Phaser.GameObjects.Text {
  g.fillStyle(0xb9b0a0, 1);
  g.fillRect(x - 120, ground - 16, 240, 20);
  // columns
  g.fillStyle(0x8a3b2e, 1);
  for (const dx of [-96, 84]) g.fillRect(x + dx, ground - 210, 12, 196);
  // the stele: a tall stone tablet on a base
  g.fillStyle(0x8f8a80, 1);
  g.fillRect(x - 40, ground - 40, 80, 26);
  g.fillStyle(0xa9a398, 1);
  g.fillRoundedRect(x - 32, ground - 190, 64, 152, 8);
  g.fillStyle(0x7f7a70, 1);
  g.fillRect(x - 32, ground - 190, 64, 14);
  const txt = scene.add.text(x, ground - 112, '双\n峰\n插\n云', baseStyle({ fontFamily: FONT_SERIF, fontSize: '22px', color: '#3a3430', align: 'center', lineSpacing: 0 })).setOrigin(0.5);
  // hipped roof with upturned corners
  g.fillStyle(0x3d4a4f, 1);
  g.fillPoints([new Phaser.Math.Vector2(x - 150, ground - 200), new Phaser.Math.Vector2(x - 70, ground - 268), new Phaser.Math.Vector2(x + 70, ground - 268), new Phaser.Math.Vector2(x + 150, ground - 200)], true);
  g.fillTriangle(x - 166, ground - 216, x - 130, ground - 200, x - 150, ground - 196);
  g.fillTriangle(x + 166, ground - 216, x + 130, ground - 200, x + 150, ground - 196);
  g.fillStyle(0x2a3236, 1);
  g.fillRect(x - 74, ground - 272, 148, 6);
  g.fillStyle(0x8a3b2e, 1);
  g.fillRect(x - 130, ground - 210, 260, 10);
  return txt;
}

function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function lgr(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** A Masson pine: a crooked trunk and flat, layered tufts of needles, lit from the upper left. */
function paintPine(ctx: Ctx): void {
  ctx.strokeStyle = '#4a3024';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(40, 160);
  ctx.quadraticCurveTo(36, 110, 44, 70);
  ctx.quadraticCurveTo(48, 40, 40, 14);
  ctx.stroke();
  ctx.strokeStyle = '#7a5440';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(38, 158);
  ctx.quadraticCurveTo(34, 110, 42, 70);
  ctx.stroke();
  // branches and tufts
  const tufts: [number, number, number][] = [[40, 18, 22], [24, 46, 26], [58, 60, 26], [20, 84, 30], [60, 100, 28], [38, 76, 20]];
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4a3024';
  for (const [x, y] of tufts) {
    ctx.beginPath();
    ctx.moveTo(42, y + 8);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  }
  for (const [x, y, w] of tufts) {
    ell(ctx, x, y + 3, w, 9, '#1e3a2a');
    ell(ctx, x, y, w * 0.95, 8, '#2f5a3e');
    ell(ctx, x - w * 0.2, y - 3, w * 0.65, 4.5, '#4f8a5a');
    // needle texture
    ctx.strokeStyle = 'rgba(140,200,140,0.45)';
    ctx.lineWidth = 1;
    for (let k = -w + 4; k < w - 4; k += 4) {
      ctx.beginPath();
      ctx.moveTo(x + k, y - 4);
      ctx.lineTo(x + k + 2, y - 8);
      ctx.stroke();
    }
  }
}

/** A clump of bamboo: slender jointed culms, and drooping sprays of narrow leaves. */
function paintBamboo(ctx: Ctx): void {
  const culms: [number, number, string][] = [[16, 0.08, '#5f9a4a'], [34, -0.04, '#4a8a3a'], [52, 0.05, '#6aa85a']];
  for (const [x0, lean, col] of culms) {
    const top = 6;
    const x1 = x0 + lean * 200;
    ctx.strokeStyle = col;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, 220);
    ctx.lineTo(x1, top);
    ctx.stroke();
    // a lit edge
    ctx.strokeStyle = 'rgba(220,255,200,0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0 - 1.6, 220);
    ctx.lineTo(x1 - 1.6, top);
    ctx.stroke();
    // nodes: a thin dark ring and a pale band
    for (let y = 196; y > 20; y -= 30) {
      const x = x0 + (x1 - x0) * ((220 - y) / (220 - top));
      ctx.strokeStyle = '#2e5a24';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 3.2, y);
      ctx.lineTo(x + 3.2, y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(230,240,200,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 2);
      ctx.lineTo(x + 3, y - 2);
      ctx.stroke();
    }
  }
  // leaf sprays: little fans of narrow leaves hanging from the upper nodes
  const leaf = (x: number, y: number, a: number, len: number, c: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -3, len, 0.5);
    ctx.quadraticCurveTo(len * 0.5, 3, 0, 0);
    ctx.fill();
    ctx.restore();
  };
  const r = rng(77);
  for (let i = 0; i < 16; i++) {
    const cx = 10 + r() * 50;
    const cy = 10 + r() * 130;
    for (let k = 0; k < 4; k++) leaf(cx, cy, 0.3 + k * 0.35 + (r() - 0.5) * 0.2 + (r() < 0.5 ? Math.PI * 0.6 : 0), 18 + r() * 8, ['#3a7a2e', '#5a9a42', '#7ab858'][(i + k) % 3]);
  }
}

/**
 * 北高峰 summit: hazy blue sky with clouds, the lake far below to the east,
 * the bare South Peak across the valley, and the grassy summit with old
 * foundation stones, framed by a pine and a corner of the temple.
 */
function paintSummit(ctx: Ctx): void {
  const W2 = 1280;
  const H2 = 720;
  const GROUND = 600;
  ctx.fillStyle = lgr(ctx, 0, 0, 0, 470, [[0, '#9cc8e4'], [0.6, '#d4e6ee'], [1, '#f6ecd8']]);
  ctx.fillRect(0, 0, W2, 470);
  for (const [x, y, sc] of [[260, 110, 1.2], [760, 70, 0.9], [1080, 150, 1.1]] as const) {
    for (let i = 0; i < 7; i++) {
      const cx = x + (i - 3) * 26 * sc;
      const cy = y - Math.sin((i / 6) * Math.PI) * 18 * sc;
      ell(ctx, cx, cy + 6 * sc, 30 * sc, 14 * sc, 'rgba(170,190,210,0.35)');
      ell(ctx, cx, cy, 28 * sc, 20 * sc, 'rgba(255,255,255,0.95)');
    }
  }
  // the lake, the city shore and Su Causeway, far below to the east
  ctx.fillStyle = lgr(ctx, 0, 440, 0, 520, [[0, '#cfe2e4'], [1, '#b0ccd0']]);
  ctx.fillRect(0, 440, W2, 90);
  ctx.fillStyle = 'rgba(90,120,110,0.55)';
  ctx.fillRect(420, 474, 560, 2.4);
  for (let x = 424; x < 980; x += 7) ell(ctx, x, 472, 3.4, 2.4, 'rgba(90,120,110,0.55)');
  // the far city shore: a soft, hazy band of rooftops
  ctx.fillStyle = 'rgba(160,170,180,0.45)';
  ctx.beginPath();
  ctx.moveTo(0, 444);
  for (let x = 0; x <= W2; x += 6) ctx.lineTo(x, 438 - Math.abs(Math.sin(x * 0.07)) * 4 - Math.abs(Math.sin(x * 0.013)) * 5);
  ctx.lineTo(W2, 444);
  ctx.fill();
  // the near ridges, layered and hazy
  const ridge = (base: number, amp: number, seed: number, col: string) => {
    const q = rng(seed);
    const w = [0, 1, 2].map((i) => ({ f: (0.003 + q() * 0.004) * (i + 1), p: q() * 7, a: amp / (i + 1.2) }));
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, H2);
    for (let x = 0; x <= W2; x += 8) ctx.lineTo(x, base - w.reduce((s2, v) => s2 + (Math.sin(x * v.f + v.p) * 0.5 + 0.5) * v.a, 0));
    ctx.lineTo(W2, H2);
    ctx.fill();
  };
  ridge(520, 40, 72, '#a9c1bb');
  // the South Peak across the valley, bare on top
  ctx.fillStyle = '#8fae9c';
  ctx.beginPath();
  ctx.moveTo(-40, 560);
  ctx.quadraticCurveTo(60, 380, 110, 376);
  ctx.quadraticCurveTo(170, 380, 330, 560);
  ctx.fill();
  ctx.fillStyle = 'rgba(70,100,80,0.25)';
  ctx.beginPath();
  ctx.moveTo(110, 376);
  ctx.quadraticCurveTo(170, 380, 330, 560);
  ctx.lineTo(150, 560);
  ctx.fill();
  // mist in the valley
  for (let i = 0; i < 9; i++) {
    const g = ctx.createRadialGradient(80 + i * 150, 520, 10, 80 + i * 150, 520, 140);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(i * 150 - 80, 440, 320, 160);
  }
  // the summit: grass, a worn path, scattered stones
  ctx.fillStyle = lgr(ctx, 0, GROUND - 10, 0, H2, [[0, '#86a66e'], [1, '#5a7a4a']]);
  ctx.beginPath();
  ctx.moveTo(0, H2);
  ctx.lineTo(0, GROUND + 30);
  ctx.quadraticCurveTo(150, GROUND - 10, 300, GROUND - 4);
  ctx.lineTo(980, GROUND - 4);
  ctx.quadraticCurveTo(1150, GROUND + 6, W2, GROUND + 40);
  ctx.lineTo(W2, H2);
  ctx.fill();
  const r = rng(5);
  for (let i = 0; i < 900; i++) {
    const x = r() * W2;
    const y = GROUND + r() * (H2 - GROUND);
    ctx.strokeStyle = r() < 0.5 ? 'rgba(60,90,40,0.5)' : 'rgba(170,200,120,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 3, y - 4 - r() * 6);
    ctx.stroke();
  }
  ctx.fillStyle = lgr(ctx, 0, GROUND, 0, GROUND + 14, [[0, '#c8bca0'], [1, '#a89a7e']]);
  ctx.fillRect(380, GROUND - 4, 520, 10);
  // the old pagoda's foundation stones, where the new storeys will stand
  ctx.fillStyle = lgr(ctx, 0, GROUND - 16, 0, GROUND + 2, [[0, '#d8d0c0'], [1, '#9a9282']]);
  ctx.fillRect(490, GROUND - 14, 300, 16);
  ctx.strokeStyle = 'rgba(90,80,64,0.6)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(490, GROUND - 14, 300, 16);
  for (let x = 540; x < 790; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 14);
    ctx.lineTo(x, GROUND + 2);
    ctx.stroke();
  }
  ell(ctx, 520, GROUND - 12, 10, 3, 'rgba(110,150,80,0.7)');
  ell(ctx, 740, GROUND - 13, 14, 3, 'rgba(110,150,80,0.7)');
  for (let i = 0; i < 14; i++) {
    const x = 120 + r() * 1040;
    const y = GROUND + 30 + r() * 80;
    ell(ctx, x, y + 3, 14 + r() * 10, 5, 'rgba(0,0,0,0.15)');
    ell(ctx, x, y, 12 + r() * 10, 7 + r() * 3, '#b8b0a0');
    ell(ctx, x - 3, y - 2, 6 + r() * 5, 3, '#d8d0c0');
  }
  // the temple at the top of the hill: yellow wall, red pillars, a big tiled roof
  ctx.fillStyle = lgr(ctx, 0, 480, 0, 600, [[0, '#e8b850'], [1, '#c08a2e']]);
  ctx.fillRect(1060, 478, 220, 124);
  ctx.fillStyle = '#7a2a20';
  for (const x of [1080, 1170, 1260]) ctx.fillRect(x, 478, 10, 124);
  ctx.fillStyle = lgr(ctx, 0, 496, 0, 580, [[0, '#ffe8a8'], [1, '#e8b060']]);
  ctx.fillRect(1100, 500, 60, 80);
  ctx.strokeStyle = 'rgba(120,60,20,0.8)';
  ctx.lineWidth = 1.4;
  for (let k = 1; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(1100 + k * 15, 500);
    ctx.lineTo(1100 + k * 15, 580);
    ctx.stroke();
  }
  ctx.fillStyle = lgr(ctx, 0, 410, 0, 486, [[0, '#2e3840'], [1, '#4e5a62']]);
  ctx.beginPath();
  ctx.moveTo(1018, 478);
  ctx.quadraticCurveTo(1040, 490, 1080, 490);
  ctx.lineTo(W2, 490);
  ctx.lineTo(W2, 418);
  ctx.lineTo(1130, 418);
  ctx.quadraticCurveTo(1080, 440, 1018, 478);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.2;
  for (let x = 1060; x < W2; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, 490);
    ctx.lineTo(x + 30, 420);
    ctx.stroke();
  }
  ctx.fillStyle = '#c8a048';
  ctx.fillRect(1040, 488, 240, 3);
  ctx.fillStyle = '#1e262c';
  ctx.fillRect(1128, 410, 152, 9);
  ctx.beginPath();
  ctx.moveTo(1018, 478);
  ctx.quadraticCurveTo(1004, 470, 1000, 458);
  ctx.quadraticCurveTo(1012, 470, 1030, 478);
  ctx.fill();
  // a pine framing the left edge
  ctx.save();
  ctx.translate(-20, 300);
  ctx.scale(2.6, 2.6);
  paintPine(ctx);
  ctx.restore();
}

export function generateShuangfengTextures(scene: Phaser.Scene): void {
  canvas(scene, 'sfPuff', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  // a long, soft band of mist
  canvas(scene, 'sfMist', 512, 128, (ctx) => {
    const r = rng(13);
    for (let i = 0; i < 40; i++) {
      const x = r() * 512;
      const y = 64 + (r() - 0.5) * 40;
      const rad = 30 + r() * 40;
      const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,0.5)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  });
  canvas(scene, 'sfCow', 300, 200, (ctx) => paintCow(ctx, 300, true));
  canvas(scene, 'sfCalf', 150, 100, (ctx) => paintCow(ctx, 150, false));
  canvas(scene, 'sfBottle', 64, 136, paintBottle);
  // a rounded tea bush, as on the terraces of Longjing
  bake(scene, 'sfTea', 64, 34, (g) => {
    g.fillStyle(0x2f6a3a, 1);
    g.fillEllipse(32, 22, 62, 26);
    g.fillStyle(0x4f9a4a, 1);
    g.fillEllipse(32, 17, 54, 20);
    g.fillStyle(0x8acb6a, 1);
    for (let i = 0; i < 7; i++) g.fillCircle(10 + i * 7.5, 10 + (i % 2) * 3, 3);
  });
  canvas(scene, 'sfPine', 80, 160, paintPine);
  canvas(scene, 'sfBamboo', 70, 220, paintBamboo);
  canvas(scene, 'sfSummit', 1280, 720, paintSummit);
  bake(scene, 'sfSpark', 16, 16, (g) => {
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 3);
  });
}

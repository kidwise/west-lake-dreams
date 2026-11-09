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
  bake(scene, 'sfPine', 80, 160, (g) => {
    g.fillStyle(0x5a3a2a, 1);
    g.fillRect(37, 60, 6, 100);
    for (let i = 0; i < 4; i++) {
      g.fillStyle(i % 2 ? 0x2f5a3e : 0x3a6a48, 1);
      g.fillEllipse(40 + (i % 2 ? 10 : -10), 30 + i * 26, 70 - i * 6, 26);
    }
  });
  bake(scene, 'sfBamboo', 60, 220, (g) => {
    for (const [x, c] of [[14, 0x5f9a4a], [32, 0x4a8a3a], [48, 0x6aa85a]] as const) {
      g.fillStyle(c, 1);
      g.fillRect(x, 10, 6, 210);
      g.fillStyle(0x3a6a2a, 1);
      for (let y = 30; y < 220; y += 34) g.fillRect(x - 1, y, 8, 3);
      g.fillStyle(0x7ab86a, 1);
      for (let y = 20; y < 200; y += 50) {
        g.fillEllipse(x + 12, y, 22, 6);
        g.fillEllipse(x - 6, y + 14, 20, 5);
      }
    }
  });
  bake(scene, 'sfSpark', 16, 16, (g) => {
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 3);
  });
}

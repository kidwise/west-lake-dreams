import * as Phaser from 'phaser';
import { rng } from '../art/paint';
import { FONT_SERIF } from '../core/config';
import { paintJigong, JIGONG_TEX } from './jigong';

type Ctx = CanvasRenderingContext2D;
const W = 1280;
const H = 720;

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function rad(ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, rot = 0): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** A dusk sky from deep blue-violet to warm rose at the horizon. */
function duskSky(ctx: Ctx, h: number): void {
  ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#26244e'], [0.45, '#5e3e6e'], [0.78, '#c46a6a'], [1, '#f0a070']]);
  ctx.fillRect(0, 0, W, h);
  const r = rng(2);
  for (let i = 0; i < 6; i++) {
    const y = h * (0.3 + r() * 0.45);
    ell(ctx, r() * W, y, 140 + r() * 200, 5 + r() * 6, `rgba(255,${150 + Math.round(r() * 50)},140,0.35)`);
  }
}

/** A ridge line as a function of x. */
function ridgeFn(base: number, amp: number, seed: number): (x: number) => number {
  const r = rng(seed);
  const waves = [0, 1, 2, 3].map((i) => ({ f: (0.002 + r() * 0.003) * (i + 1), p: r() * 7, a: amp / (i + 1.1) }));
  return (x: number) => base - waves.reduce((s, w) => s + (Math.sin(x * w.f + w.p) * 0.5 + 0.5) * w.a, 0);
}

/** One tree crown: a cluster of soft lobes, with an optional rim of sky-light on top. */
function crown(ctx: Ctx, x: number, y: number, r: number, body: string, rim: string | null, shade: string, seed = 0): void {
  const q = rng(Math.floor(x * 7 + y * 13 + seed));
  ell(ctx, x, y + r * 0.3, r * 1.1, r * 0.75, shade);
  const lobes = 5 + Math.floor(q() * 3);
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + q();
    ell(ctx, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.35, r * (0.5 + q() * 0.2), r * (0.45 + q() * 0.15), body);
  }
  ell(ctx, x, y, r * 0.7, r * 0.6, body);
  if (rim) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.1, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
    ctx.clip();
    ell(ctx, x - r * 0.15, y - r * 0.75, r * 0.85, r * 0.35, rim);
    ctx.restore();
  }
}

/**
 * A forested hill: the silhouette, a skyline of crowns lit from behind, then
 * the slope below as darker, overlapping masses fading into haze and mist.
 */
function forestHill(ctx: Ctx, top: (x: number) => number, bottom: number, seed: number, c: { body: string; rim: string; shade: string; fill: string; mist: string }): void {
  const r = rng(seed);
  ctx.fillStyle = c.fill;
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  for (let x = 0; x <= W; x += 6) ctx.lineTo(x, top(x) + 8);
  ctx.lineTo(W, bottom);
  ctx.fill();
  // the slope: big, low-contrast masses of foliage
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = top(x) + 30 + r() * (bottom - top(x) - 30);
    crown(ctx, x, y, 22 + r() * 22, c.body, null, c.shade, i);
  }
  // the skyline: individual crowns catching the glow of the sky
  for (let x = -10; x < W + 20; x += 18 + r() * 16) {
    crown(ctx, x, top(x) + 6 + r() * 6, 12 + r() * 10, c.body, c.rim, c.shade, Math.round(x));
  }
  // haze over the slope, deepening downhill, and mist pooling at the foot
  ctx.fillStyle = lin(ctx, 0, bottom - 160, 0, bottom, [[0, 'rgba(0,0,0,0)'], [1, c.mist]]);
  ctx.fillRect(0, bottom - 160, W, 160);
}

/** A hipped temple roof with upturned corners (grey tiles), centred on cx. */
function roof(ctx: Ctx, cx: number, y: number, w: number, h: number): void {
  ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, '#3e4048'], [1, '#5a5c66']]);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 14, y - 10);
  ctx.quadraticCurveTo(cx - w / 2 + w * 0.1, y + 2, cx - w * 0.3, y + 2);
  ctx.lineTo(cx + w * 0.3, y + 2);
  ctx.quadraticCurveTo(cx + w / 2 - w * 0.1, y + 2, cx + w / 2 + 14, y - 10);
  ctx.quadraticCurveTo(cx + w * 0.3, y - h * 0.4, cx + w * 0.22, y - h);
  ctx.lineTo(cx - w * 0.22, y - h);
  ctx.quadraticCurveTo(cx - w * 0.3, y - h * 0.4, cx - w / 2 - 14, y - 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,30,40,0.35)';
  ctx.lineWidth = 1;
  for (let k = -10; k <= 10; k++) {
    ctx.beginPath();
    ctx.moveTo(cx + (k / 10) * (w / 2), y);
    ctx.lineTo(cx + (k / 10) * (w * 0.22), y - h);
    ctx.stroke();
  }
  ctx.fillStyle = '#2e3038';
  ctx.fillRect(cx - w * 0.24, y - h - 6, w * 0.48, 8);
  // ridge ends (鸱吻), simplified
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * w * 0.24, y - h - 4);
    ctx.quadraticCurveTo(cx + s * (w * 0.24 + 10), y - h - 22, cx + s * (w * 0.24 - 4), y - h - 26);
    ctx.lineTo(cx + s * (w * 0.24 - 6), y - h - 4);
    ctx.fill();
  }
  // a warm rim of light along the eave
  ctx.strokeStyle = 'rgba(255,190,140,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 14, y - 10);
  ctx.quadraticCurveTo(cx - w / 2 + w * 0.1, y + 2, cx - w * 0.3, y + 2);
  ctx.lineTo(cx + w * 0.3, y + 2);
  ctx.quadraticCurveTo(cx + w / 2 - w * 0.1, y + 2, cx + w / 2 + 14, y - 10);
  ctx.stroke();
}

/** A yellow temple wall with grey tile coping (寺院黄墙). */
function yellowWall(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#f0c25a'], [1, '#c8902e']]);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120,60,20,0.12)';
  for (let i = 0; i < 40; i++) ctx.fillRect(x + ((i * 97) % w), y + 6 + ((i * 53) % (h - 12)), 30, 2);
  ctx.fillStyle = '#4a4c56';
  ctx.fillRect(x - 6, y - 12, w + 12, 14);
  ctx.fillStyle = '#5e606a';
  for (let k = x - 6; k < x + w + 6; k += 10) {
    ctx.beginPath();
    ctx.arc(k + 5, y - 12, 5, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,200,150,0.35)';
  ctx.fillRect(x - 6, y - 13, w + 12, 2);
}

// ---- the temple at dusk (intro) -------------------------------------------------------------------

function paintTemple(ctx: Ctx): void {
  duskSky(ctx, 440);
  // 南屏山 (慧日峰) behind the temple: a far hazy ridge, then the near forested slope
  forestHill(ctx, ridgeFn(250, 90, 5), 430, 5, { body: '#5e4c6e', rim: 'rgba(230,150,150,0.55)', shade: 'rgba(40,30,56,0.35)', fill: '#5a4a6a', mist: 'rgba(200,150,170,0.45)' });
  forestHill(ctx, ridgeFn(330, 110, 7), 520, 7, { body: '#3a3048', rim: 'rgba(210,130,130,0.5)', shade: 'rgba(20,14,30,0.45)', fill: '#342a42', mist: 'rgba(170,120,140,0.35)' });
  // the great hall, behind the wall
  ctx.fillStyle = lin(ctx, 0, 300, 0, 420, [[0, '#d8a040'], [1, '#a87028']]);
  ctx.fillRect(470, 318, 340, 110);
  ctx.fillStyle = '#7a2a1e';
  for (let x = 480; x <= 800; x += 40) ctx.fillRect(x, 318, 8, 110);
  roof(ctx, 640, 318, 420, 60);
  roof(ctx, 640, 262, 300, 50);
  // the bell tower on the left: two storeys, its bell glimpsed inside
  ctx.fillStyle = '#7a2a1e';
  ctx.fillRect(170, 300, 140, 130);
  ctx.fillStyle = rad(ctx, 240, 350, 4, 60, [[0, '#ffd890'], [1, '#c87830']]);
  ctx.fillRect(186, 316, 108, 74);
  ell(ctx, 240, 352, 24, 30, '#3a4a3a');
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(216, 352, 48, 30);
  roof(ctx, 240, 300, 200, 40);
  roof(ctx, 240, 248, 150, 40);
  // the yellow wall with the gate
  yellowWall(ctx, 0, 420, W, 110);
  ctx.fillStyle = '#4a2a1e';
  ctx.fillRect(560, 400, 160, 130);
  // open red doors and warm light
  ctx.fillStyle = rad(ctx, 640, 480, 10, 100, [[0, '#ffe6a8'], [1, '#e08a3a']]);
  ctx.fillRect(590, 440, 100, 90);
  ctx.fillStyle = '#a8301e';
  ctx.fillRect(566, 440, 24, 90);
  ctx.fillRect(690, 440, 24, 90);
  roof(ctx, 640, 404, 230, 40);
  // the name board over the gate
  ctx.fillStyle = '#2a1e18';
  ctx.fillRect(588, 408, 104, 26);
  ctx.strokeStyle = '#d8a848';
  ctx.lineWidth = 2;
  ctx.strokeRect(590, 410, 100, 22);
  ctx.fillStyle = '#e8c060';
  ctx.font = `bold 17px ${FONT_SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('净 慈 禅 寺', 640, 422);
  // the stone plaza
  ctx.fillStyle = lin(ctx, 0, 530, 0, H, [[0, '#8a7064'], [1, '#4a3a3a']]);
  ctx.fillRect(0, 530, W, H - 530);
  ctx.strokeStyle = 'rgba(40,28,28,0.35)';
  ctx.lineWidth = 1;
  for (let y = 548; y < H; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = -600; x < W + 600; x += 90) {
    ctx.beginPath();
    ctx.moveTo(640 + (x - 640) * 0.3, 530);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  // warm light spilling from the gate and the lanterns onto the stones
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rad(ctx, 640, 560, 10, 260, [[0, 'rgba(255,190,110,0.35)'], [1, 'rgba(255,160,80,0)']]);
  ctx.fillRect(300, 530, 680, 190);
  for (const x of [540, 740]) {
    ctx.fillStyle = rad(ctx, x, 560, 2, 70, [[0, 'rgba(255,120,80,0.3)'], [1, 'rgba(255,100,60,0)']]);
    ctx.fillRect(x - 80, 530, 160, 100);
  }
  ctx.restore();
  // two old camphor trees framing the courtyard
  for (const [tx, flip] of [[40, 1], [1250, -1]] as const) {
    ctx.fillStyle = lin(ctx, tx - 20, 0, tx + 20, 0, [[0, '#2a1e24'], [0.6, '#4a3438'], [1, '#2a1e24']]);
    ctx.beginPath();
    ctx.moveTo(tx - 22, H);
    ctx.quadraticCurveTo(tx - 10, 460, tx + flip * 30, 300);
    ctx.lineTo(tx + flip * 50, 310);
    ctx.quadraticCurveTo(tx + 14, 470, tx + 26, H);
    ctx.fill();
    const tr = rng(tx);
    for (let k = 0; k < 9; k++) {
      const cy = 110 + tr() * 230;
      crown(ctx, tx + flip * (10 + tr() * 120) - 30 * flip, cy, 44 + tr() * 30, '#2a2232', cy < 200 ? 'rgba(220,140,140,0.3)' : null, 'rgba(10,6,16,0.35)', k);
    }
  }
  // a big bronze incense burner on the right
  ctx.fillStyle = lin(ctx, 1010, 0, 1110, 0, [[0, '#3a3a2a'], [0.6, '#8a7a4a'], [1, '#4a4430']]);
  ctx.fillRect(1020, 560, 80, 46);
  ell(ctx, 1060, 560, 48, 10, '#6a6040');
  ctx.fillRect(1026, 604, 10, 26);
  ctx.fillRect(1084, 604, 10, 26);
  ctx.fillRect(1054, 604, 10, 26);
  ctx.strokeStyle = '#8a7a4a';
  ctx.lineWidth = 5;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(1060 + s * 46, 570, 10, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5);
    ctx.stroke();
  }
  // red lanterns either side of the gate
  for (const x of [540, 740]) {
    ctx.strokeStyle = '#2a1e18';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 404);
    ctx.lineTo(x, 430);
    ctx.stroke();
    ell(ctx, x, 448, 16, 20, rad(ctx, x - 4, 444, 2, 22, [[0, '#ffb070'], [1, '#c0281e']]));
    ctx.fillStyle = '#e8c060';
    ctx.fillRect(x - 8, 426, 16, 4);
    ctx.fillRect(x - 8, 466, 16, 4);
  }
}

// ---- the well, from above -------------------------------------------------------------------------

export const WELL = { x: 640, y: 380, r: 190 };

function paintWell(ctx: Ctx): void {
  // flagstones of the courtyard
  ctx.fillStyle = '#6a5a52';
  ctx.fillRect(0, 0, W, H);
  const r = rng(13);
  for (let y = -20; y < H; y += 60) {
    for (let x = (y / 60) % 2 ? -40 : 0; x < W; x += 90) {
      const c = 90 + Math.round(r() * 30);
      ctx.fillStyle = `rgb(${c + 20},${c + 6},${c})`;
      ctx.fillRect(x + 2, y + 2, 86, 56);
      ctx.fillStyle = 'rgba(70,110,60,0.25)';
      if (r() < 0.3) ell(ctx, x + r() * 80, y + r() * 50, 10 + r() * 14, 5 + r() * 6, 'rgba(70,110,60,0.25)');
    }
  }
  // the stone curb of the well (an octagon)
  const { x, y, r: wr } = WELL;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ctx.lineTo(x + 8 + Math.cos(a) * (wr + 54), y + 10 + Math.sin(a) * (wr + 54));
  }
  ctx.fill();
  ctx.fillStyle = lin(ctx, x - wr, y - wr, x + wr, y + wr, [[0, '#c8bca8'], [1, '#8a8070']]);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ctx.lineTo(x + Math.cos(a) * (wr + 50), y + Math.sin(a) * (wr + 50));
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,50,40,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * wr, y + Math.sin(a) * wr);
    ctx.lineTo(x + Math.cos(a) * (wr + 50), y + Math.sin(a) * (wr + 50));
    ctx.stroke();
  }
  // rope grooves worn into the stone
  ctx.strokeStyle = 'rgba(70,60,50,0.6)';
  for (let i = 0; i < 6; i++) {
    const a = r() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * wr, y + Math.sin(a) * wr);
    ctx.lineTo(x + Math.cos(a) * (wr + 18), y + Math.sin(a) * (wr + 18));
    ctx.stroke();
  }
  // the water, deep and dark, catching the dusk sky
  ctx.fillStyle = rad(ctx, x, y, 10, wr, [[0, '#0e1a2a'], [0.7, '#1a2a40'], [0.92, '#3a4058'], [1, '#2a2a34']]);
  ctx.beginPath();
  ctx.arc(x, y, wr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(240,150,120,0.18)';
  ctx.beginPath();
  ctx.ellipse(x - 50, y - 70, 90, 40, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // a wooden bucket and a coil of rope by the curb
  const bx = 330;
  const by = 600;
  ell(ctx, bx + 6, by + 30, 46, 14, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = lin(ctx, bx - 38, 0, bx + 38, 0, [[0, '#6a4426'], [0.5, '#a8784a'], [1, '#5a3a20']]);
  ctx.beginPath();
  ctx.moveTo(bx - 36, by - 30);
  ctx.lineTo(bx + 36, by - 30);
  ctx.lineTo(bx + 30, by + 26);
  ctx.lineTo(bx - 30, by + 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,24,12,0.5)';
  ctx.lineWidth = 1;
  for (let k = -30; k <= 30; k += 10) {
    ctx.beginPath();
    ctx.moveTo(bx + k, by - 30);
    ctx.lineTo(bx + k * 0.85, by + 26);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(bx - 36, by - 18, 72, 5);
  ctx.fillRect(bx - 32, by + 12, 64, 5);
  ell(ctx, bx, by - 30, 36, 10, '#3a2614');
  ell(ctx, bx, by - 31, 32, 8, '#1a2a3a');
  ctx.strokeStyle = '#c8a860';
  ctx.lineWidth = 4;
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    ctx.ellipse(bx + 100, by + 10, 34 - k * 6, 14 - k * 2.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(bx + 30, by - 30);
  ctx.quadraticCurveTo(bx + 60, by - 60, bx + 90, by - 4);
  ctx.stroke();
  // ferns in the corners and leaves on the stones
  for (const [fx, fy, s] of [[60, 700, 1], [1230, 700, -1], [1200, 40, -1]] as const) {
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.32 * s;
      const len = 90 + r() * 50;
      ctx.strokeStyle = '#3a6a3a';
      ctx.lineWidth = 2;
      const ex = fx + Math.cos(a) * len;
      const ey = fy + Math.sin(a) * len * (fy < 100 ? -1 : 1);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo((fx + ex) / 2 + 10 * s, (fy + ey) / 2, ex, ey);
      ctx.stroke();
      for (let q = 1; q < 10; q++) {
        const tt = q / 10;
        const px = fx + (ex - fx) * tt;
        const py = fy + (ey - fy) * tt;
        ell(ctx, px - 6, py, 7 * (1 - tt * 0.6), 2.6, '#4f8a4a', 0.5);
        ell(ctx, px + 6, py, 7 * (1 - tt * 0.6), 2.6, '#5a9a52', -0.5);
      }
    }
  }
  for (let i = 0; i < 26; i++) {
    const lx = r() * W;
    const ly = r() * H;
    if (Math.hypot(lx - x, ly - y) < wr + 60) continue;
    ell(ctx, lx, ly, 7, 3.5, ['#c8783a', '#b8a040', '#9a5a2a'][i % 3], r() * 3);
  }
  // a soft vignette
  ctx.fillStyle = rad(ctx, W / 2, H / 2, 300, 820, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,6,4,0.55)']]);
  ctx.fillRect(0, 0, W, H);
  // the stone tablet beside it
  ctx.fillStyle = '#5a5048';
  ctx.fillRect(1010, 90, 110, 160);
  ctx.fillStyle = '#7a7068';
  ctx.fillRect(1018, 98, 94, 144);
  ctx.fillStyle = '#2a2420';
  ctx.font = `bold 26px ${FONT_SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ['运', '木', '古', '井'].forEach((c, i) => ctx.fillText(c, 1065, 120 + i * 32));
}

// ---- the cliff of 南屏山, full of holes ------------------------------------------------------------

export const CAVES = [
  { x: 330, y: 300, r: 54 },
  { x: 520, y: 220, r: 48 },
  { x: 700, y: 320, r: 58 },
  { x: 880, y: 220, r: 46 },
  { x: 1050, y: 310, r: 52 },
];

function paintCliff(ctx: Ctx): void {
  duskSky(ctx, 300);
  // trees along the top of the hill, against the sky
  const skyline = ridgeFn(150, 50, 21);
  forestHill(ctx, skyline, 260, 21, { body: '#3a3a4a', rim: 'rgba(230,150,150,0.5)', shade: 'rgba(20,14,30,0.4)', fill: '#323444', mist: 'rgba(0,0,0,0)' });
  const r = rng(17);
  // the rock face, built from big weathered blocks
  const top = (x: number) => 200 + Math.sin(x * 0.006) * 18 + Math.sin(x * 0.017) * 8;
  ctx.fillStyle = '#4a3e52';
  ctx.beginPath();
  ctx.moveTo(0, 580);
  for (let x = 0; x <= W; x += 10) ctx.lineTo(x, top(x));
  ctx.lineTo(W, 580);
  ctx.fill();
  for (let row = 0; row < 5; row++) {
    let x = -40 + r() * 40;
    while (x < W + 40) {
      const w = 110 + r() * 120;
      const y0 = (row === 0 ? top(x + w / 2) : 200 + row * 76) + (r() - 0.5) * 12;
      const h = 70 + r() * 30;
      const j = () => (r() - 0.5) * 18;
      const pts = [x + j(), y0 + j(), x + w * 0.5 + j(), y0 - 6 + j(), x + w + j(), y0 + j(), x + w + 6 + j(), y0 + h * 0.6, x + w + j(), y0 + h + j(), x + w * 0.4 + j(), y0 + h + 6, x - 4 + j(), y0 + h + j()];
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.closePath();
      const tone = 0.85 + r() * 0.3;
      const c = (v: number) => Math.round(v * tone);
      ctx.fillStyle = lin(ctx, 0, y0, 0, y0 + h, [[0, `rgb(${c(150)},${c(132)},${c(148)})`], [0.35, `rgb(${c(118)},${c(102)},${c(122)})`], [1, `rgb(${c(70)},${c(58)},${c(80)})`]]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,20,36,0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // a lit upper edge and a crack or two
      ctx.strokeStyle = 'rgba(255,210,200,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pts[0] + 6, pts[1] + 3);
      ctx.lineTo(pts[2], pts[3] + 3);
      ctx.lineTo(pts[4] - 6, pts[5] + 3);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(30,20,36,0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const cx = x + w * (0.3 + r() * 0.4);
      ctx.moveTo(cx, y0 + 8);
      ctx.lineTo(cx + (r() - 0.5) * 20, y0 + h * 0.5);
      ctx.lineTo(cx + (r() - 0.5) * 30, y0 + h - 6);
      ctx.stroke();
      // moss on the top of the block
      if (r() < 0.6) {
        ctx.fillStyle = lin(ctx, 0, y0 - 6, 0, y0 + 14, [[0, 'rgba(120,160,90,0.85)'], [1, 'rgba(70,100,60,0)']]);
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y0 + 2, w * 0.4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // small weathered hollows (南屏山多孔穴)
      for (let k = 0; k < 2; k++) {
        if (r() < 0.55) {
          const hx = x + 20 + r() * (w - 40);
          const hy = y0 + 20 + r() * (h - 40);
          const hr = 4 + r() * 6;
          ell(ctx, hx, hy + 1.5, hr * 1.3, hr * 0.95, 'rgba(255,220,210,0.18)');
          ell(ctx, hx, hy, hr * 1.2, hr * 0.85, rad(ctx, hx + hr * 0.3, hy + hr * 0.3, 0, hr * 1.3, [[0, '#0e0812'], [1, '#3a2c40']]));
        }
      }
      x += w;
    }
  }
  // the five big caves: ragged openings with a worn lip of pale stone, deep inside
  const ragged = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
    const q = rng(seed);
    const pts: [number, number][] = [];
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      const j = 0.82 + q() * 0.3 + (a > 0.2 && a < 2.9 ? 0.08 : 0);
      pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j * (a > 0 && a < Math.PI ? 0.8 : 1)]);
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k <= pts.length; k++) {
      const p0 = pts[k % pts.length];
      const p1 = pts[(k + 1) % pts.length];
      ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    }
    ctx.closePath();
  };
  CAVES.forEach((c, i) => {
    ragged(c.x, c.y + 4, c.r * 1.45, c.r * 1.15, 50 + i);
    ctx.fillStyle = 'rgba(20,12,24,0.45)';
    ctx.fill();
    ragged(c.x, c.y + 1, c.r * 1.3, c.r * 1.02, 60 + i);
    ctx.fillStyle = lin(ctx, 0, c.y - c.r, 0, c.y + c.r, [[0, '#b0a0ae'], [0.5, '#7a6a80'], [1, '#4a3c52']]);
    ctx.fill();
    ragged(c.x + 3, c.y + 3, c.r * 1.08, c.r * 0.86, 70 + i);
    ctx.fillStyle = rad(ctx, c.x + c.r * 0.25, c.y + c.r * 0.3, 2, c.r * 1.2, [[0, '#030104'], [0.6, '#120a16'], [1, '#2e2034']]);
    ctx.fill();
    // a lip of light along the top inside edge, and drips of moss
    ctx.strokeStyle = 'rgba(255,220,210,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(c.x + 3, c.y + 3, c.r * 1.0, c.r * 0.8, 0, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const mx = c.x - c.r * 0.7 + k * c.r * 0.45;
      ctx.fillStyle = 'rgba(100,140,80,0.8)';
      ctx.beginPath();
      ctx.ellipse(mx, c.y - c.r * 0.82, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // ivy and ferns hanging over the rock
  for (let i = 0; i < 34; i++) {
    const x = r() * W;
    const y = top(x) - 4;
    const len = 50 + r() * 140;
    ctx.strokeStyle = 'rgba(50,80,50,0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 8, y + len * 0.3, x - 8, y + len * 0.6, x + 4, y + len);
    ctx.stroke();
    for (let k = 1; k < 9; k++) {
      const tt = k / 9;
      const lx = x + Math.sin(tt * 5) * 6;
      const ly = y + len * tt;
      ell(ctx, lx + (k % 2 ? 4 : -4), ly, 4.5, 2.6, k % 3 ? 'rgba(80,130,80,0.95)' : 'rgba(110,160,90,0.95)', k % 2 ? 0.6 : -0.6);
    }
  }
  // warm light from the sunset on the right, cool shadow on the left
  ctx.fillStyle = lin(ctx, 0, 0, W, 0, [[0, 'rgba(20,10,40,0.3)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(255,170,130,0.16)']]);
  ctx.fillRect(0, 140, W, 440);
  // the path at the foot of the cliff and shrubs along it
  ctx.fillStyle = lin(ctx, 0, 560, 0, H, [[0, '#5a4848'], [1, '#2a2026']]);
  ctx.fillRect(0, 570, W, H - 570);
  for (let x = -20; x < W + 40; x += 36 + r() * 30) crown(ctx, x, 574 + r() * 8, 22 + r() * 14, '#2e3a32', 'rgba(170,200,140,0.35)', 'rgba(0,0,0,0.3)');
}

// ---- the bell tower, looking out over the lake ---------------------------------------------------------

/** Where each of the Ten Scenes sits in the view from the bell tower (x, y on screen). */
export const LANDMARKS: Record<string, { x: number; y: number }> = {
  leifeng: { x: 700, y: 330 },
  shuangfeng: { x: 790, y: 300 },
  huagang: { x: 830, y: 410 },
  quyuan: { x: 930, y: 372 },
  sudi: { x: 900, y: 420 },
  santan: { x: 1010, y: 440 },
  pinghu: { x: 1090, y: 376 },
  duanqiao: { x: 1170, y: 384 },
  liulang: { x: 1200, y: 452 },
};

export const VIEW = { x: 640, y: 70, w: 600, h: 470, horizon: 380 };

function paintTower(ctx: Ctx): void {
  const { x, y, w, h, horizon } = VIEW;
  // the view through the opening: dusk over West Lake, looking north
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = lin(ctx, 0, y, 0, horizon, [[0, '#2a2650'], [0.5, '#6a4472'], [1, '#e89a72']]);
  ctx.fillRect(x, y, w, horizon - y);
  // far hills all round the lake
  ctx.fillStyle = '#5a3e66';
  ctx.beginPath();
  ctx.moveTo(x, horizon);
  for (let k = 0; k <= w; k += 6) ctx.lineTo(x + k, horizon - 18 - Math.sin(k * 0.02) * 10 - Math.sin(k * 0.047) * 8 - (k < 220 ? (220 - k) * 0.18 : 0));
  ctx.lineTo(x + w, horizon);
  ctx.fill();
  // the twin peaks, far to the west
  for (const [px, ph] of [[770, 70], [820, 84]] as const) {
    ctx.beginPath();
    ctx.moveTo(px - 50, horizon);
    ctx.quadraticCurveTo(px, horizon - ph * 2, px + 50, horizon);
    ctx.fill();
  }
  // the lake
  ctx.fillStyle = lin(ctx, 0, horizon, 0, y + h, [[0, '#d88a72'], [0.4, '#7a5070'], [1, '#2a2240']]);
  ctx.fillRect(x, horizon, w, y + h - horizon);
  // 苏堤 and the island of 三潭
  ctx.fillStyle = '#3e2a48';
  ctx.fillRect(840, 418, 200, 3);
  for (let k = 842; k < 1040; k += 7) ell(ctx, k, 416, 4, 3 + (k % 3), '#3e2a48');
  ell(ctx, 1010, 444, 30, 5, '#3e2a48');
  // 孤山, the Broken Bridge
  ell(ctx, 1090, 386, 40, 8, '#4a3058');
  ctx.strokeStyle = '#4a3058';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1170, 392, 12, Math.PI, 0);
  ctx.stroke();
  // 雷峰塔 close by on its hill
  ell(ctx, 690, 400, 90, 40, '#3a2840');
  ctx.fillStyle = '#4a2a30';
  ctx.fillRect(694, 296, 14, 70);
  for (let k = 0; k < 5; k++) ctx.fillRect(686 + k, 300 + k * 14, 30 - k * 2, 3);
  ctx.fillRect(700, 282, 2, 16);
  // glimmers on the water
  for (let i = 0; i < 70; i++) {
    const gx = x + ((i * 137) % w);
    const gy = horizon + 10 + ((i * 71) % (y + h - horizon - 20));
    ctx.fillStyle = `rgba(255,200,160,${0.12 + ((i * 13) % 10) / 50})`;
    ctx.fillRect(gx, gy, 6 + (i % 5) * 3, 1.5);
  }
  ctx.restore();
  // the tower's timber frame round the opening
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#3a2420'], [1, '#2a1a18']]);
  ctx.fillRect(0, 0, W, y);
  ctx.fillRect(0, y + h, W, H - y - h);
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, W - x - w, h);
  // posts and beams
  for (const px of [40, 600, 1240]) {
    ctx.fillStyle = lin(ctx, px, 0, px + 40, 0, [[0, '#5a2018'], [0.5, '#8a3424'], [1, '#4a1a14']]);
    ctx.fillRect(px, 0, 40, H);
  }
  ctx.fillStyle = lin(ctx, 0, 30, 0, 70, [[0, '#6a2a1e'], [1, '#4a1e16']]);
  ctx.fillRect(0, 34, W, 36);
  ctx.fillStyle = '#c8984a';
  ctx.fillRect(0, 34, W, 4);
  ctx.fillRect(0, 66, W, 3);
  // painted beam pattern
  for (let k = 100; k < W; k += 160) {
    ctx.strokeStyle = 'rgba(120,180,170,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(k, 52, 40, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // a railing across the opening
  ctx.fillStyle = '#6a2a1e';
  ctx.fillRect(x, y + h - 60, w, 8);
  for (let k = x + 10; k < x + w; k += 24) ctx.fillRect(k, y + h - 52, 6, 52);
  // the floorboards
  ctx.fillStyle = lin(ctx, 0, 560, 0, H, [[0, '#5a3a2a'], [1, '#2a1a14']]);
  ctx.fillRect(0, 560, W, H - 560);
  ctx.strokeStyle = 'rgba(20,10,8,0.5)';
  for (let k = 576; k < H; k += 22) {
    ctx.beginPath();
    ctx.moveTo(0, k);
    ctx.lineTo(W, k);
    ctx.stroke();
  }
  // the great crossbeam the bell hangs from
  ctx.fillStyle = lin(ctx, 0, 90, 0, 120, [[0, '#7a3a24'], [1, '#4a2016']]);
  ctx.fillRect(80, 92, 540, 30);
  // wood grain on the posts and the beam
  const r = rng(29);
  ctx.strokeStyle = 'rgba(30,10,6,0.35)';
  ctx.lineWidth = 1;
  for (const px of [40, 600, 1240]) {
    for (let k = 0; k < 7; k++) {
      const gx = px + 4 + r() * 32;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + (r() - 0.5) * 6, 200, gx + (r() - 0.5) * 8, 400, gx + (r() - 0.5) * 4, H);
      ctx.stroke();
    }
  }
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    ctx.moveTo(80, 96 + k * 5);
    ctx.bezierCurveTo(250, 94 + k * 5 + (r() - 0.5) * 4, 420, 98 + k * 5, 620, 96 + k * 5);
    ctx.stroke();
  }
  // the panelled back wall behind the bell, dimly lit
  ctx.fillStyle = 'rgba(90,50,36,0.35)';
  for (let k = 0; k < 4; k++) ctx.fillRect(110 + k * 120, 140, 100, 380);
  ctx.strokeStyle = 'rgba(160,100,60,0.25)';
  for (let k = 0; k < 4; k++) ctx.strokeRect(110 + k * 120, 140, 100, 380);
  // two red lanterns hanging from the beam
  for (const lx of [110, 560]) {
    ctx.strokeStyle = '#2a1410';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 122);
    ctx.lineTo(lx, 150);
    ctx.stroke();
    ell(ctx, lx, 178, 22, 28, rad(ctx, lx - 6, 170, 2, 30, [[0, '#ffb070'], [0.6, '#d03a24'], [1, '#8a1a10']]));
    ctx.fillStyle = '#e0b050';
    ctx.fillRect(lx - 12, 148, 24, 5);
    ctx.fillRect(lx - 12, 203, 24, 5);
    ctx.strokeStyle = '#e0b050';
    ctx.beginPath();
    ctx.moveTo(lx, 208);
    ctx.lineTo(lx, 230);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rad(ctx, lx, 178, 4, 110, [[0, 'rgba(255,130,80,0.35)'], [1, 'rgba(255,100,60,0)']]);
    ctx.fillRect(lx - 110, 70, 220, 220);
    ctx.restore();
  }
  // evening light falling in through the opening, across the floor
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = lin(ctx, 900, 100, 600, 700, [[0, 'rgba(255,170,120,0.18)'], [1, 'rgba(255,150,100,0)']]);
  ctx.beginPath();
  ctx.moveTo(640, 120);
  ctx.lineTo(1240, 100);
  ctx.lineTo(820, H);
  ctx.lineTo(240, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---- the bell, the monk, the things in the well -------------------------------------------------------

/** The great bronze bell: green patina, bands of tiny scripture, a lotus striking-seat. */
function paintBell(ctx: Ctx): void {
  const cx = 150;
  // the dragon loop on top (蒲牢), simplified
  ctx.strokeStyle = '#3e5a4a';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, 30, 22, Math.PI, 0);
  ctx.stroke();
  // the body: a tall shoulder curving down to a flared lip
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(cx - 70, 44);
    ctx.quadraticCurveTo(cx - 92, 48, cx - 96, 110);
    ctx.lineTo(cx - 106, 330);
    ctx.quadraticCurveTo(cx - 112, 350, cx - 120, 356);
    ctx.lineTo(cx + 120, 356);
    ctx.quadraticCurveTo(cx + 112, 350, cx + 106, 330);
    ctx.lineTo(cx + 96, 110);
    ctx.quadraticCurveTo(cx + 92, 48, cx + 70, 44);
    ctx.closePath();
  };
  body();
  ctx.fillStyle = lin(ctx, cx - 120, 0, cx + 120, 0, [[0, '#2a3a30'], [0.3, '#5a7a62'], [0.5, '#8aa88a'], [0.7, '#5a7a62'], [1, '#22302a']]);
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  // bronze showing through the patina
  ctx.fillStyle = 'rgba(160,110,50,0.25)';
  const r = rng(23);
  for (let i = 0; i < 40; i++) ell(ctx, cx - 100 + r() * 200, 50 + r() * 300, 6 + r() * 16, 4 + r() * 10, 'rgba(150,100,50,0.22)');
  // horizontal bands
  ctx.fillStyle = 'rgba(20,30,24,0.5)';
  for (const yb of [60, 150, 250, 330]) ctx.fillRect(cx - 130, yb, 260, 5);
  // panels filled with rows of tiny scripture
  ctx.fillStyle = 'rgba(20,30,24,0.55)';
  for (const [y0, y1] of [[72, 144], [162, 244], [262, 324]]) {
    for (let yy = y0; yy < y1; yy += 6) {
      for (let xx = cx - 96; xx < cx + 96; xx += 5) if (r() < 0.82) ctx.fillRect(xx, yy, 3, 3);
    }
  }
  ctx.restore();
  // the lotus striking-seat (撞座)
  ell(ctx, cx, 210, 26, 26, '#4a6a52');
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    ell(ctx, cx + Math.cos(a) * 18, 210 + Math.sin(a) * 18, 9, 5, '#6a8a6a', a);
  }
  ell(ctx, cx, 210, 10, 10, '#a8c0a0');
  // highlight
  ctx.fillStyle = 'rgba(255,240,200,0.18)';
  ctx.fillRect(cx - 40, 60, 10, 280);
}

/** A log of fir, lying on its side, bark and all; `kind` makes a bent or cracked one. */
function paintLog(ctx: Ctx, kind: 'straight' | 'bent' | 'cracked'): void {
  const bend = kind === 'bent' ? 16 : 0;
  const len = kind === 'cracked' ? 190 : 240;
  const y = (x: number) => 30 + Math.sin((x / len) * Math.PI) * bend;
  ctx.fillStyle = lin(ctx, 0, 10, 0, 50, [[0, '#a87a4a'], [0.45, '#7a5030'], [1, '#4a2e1a']]);
  ctx.beginPath();
  ctx.moveTo(10, y(0) - 16);
  for (let x = 0; x <= len; x += 10) ctx.lineTo(10 + x, y(x) - 16);
  for (let x = len; x >= 0; x -= 10) ctx.lineTo(10 + x, y(x) + 16);
  ctx.closePath();
  ctx.fill();
  // bark
  ctx.strokeStyle = 'rgba(40,24,12,0.45)';
  ctx.lineWidth = 1.2;
  const r = rng(kind.length);
  for (let i = 0; i < 26; i++) {
    const x = 16 + r() * (len - 20);
    ctx.beginPath();
    ctx.moveTo(x, y(x) - 12 + r() * 8);
    ctx.lineTo(x + 20 + r() * 20, y(x) - 10 + r() * 20);
    ctx.stroke();
  }
  if (kind === 'cracked') {
    ctx.strokeStyle = '#2a1608';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 18);
    ctx.lineTo(90, 30);
    ctx.lineTo(80, 36);
    ctx.lineTo(120, 42);
    ctx.stroke();
  }
  // the cut end with growth rings
  const ex = 10 + len;
  ell(ctx, ex, y(len), 9, 16, '#e0b878');
  ctx.strokeStyle = 'rgba(140,90,40,0.7)';
  ctx.lineWidth = 1;
  for (const k of [3, 6, 9, 12]) {
    ctx.beginPath();
    ctx.ellipse(ex, y(len), k * 0.55, k, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function paintShoe(ctx: Ctx): void {
  ell(ctx, 40, 24, 34, 16, lin(ctx, 0, 8, 0, 40, [[0, '#d8b870'], [1, '#a8884a']]));
  ctx.strokeStyle = 'rgba(110,80,30,0.7)';
  ctx.lineWidth = 1;
  for (let k = 12; k < 70; k += 5) {
    ctx.beginPath();
    ctx.moveTo(k, 12);
    ctx.lineTo(k - 3, 36);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7a5a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 14);
  ctx.quadraticCurveTo(44, 2, 56, 16);
  ctx.stroke();
  // a hole in the toe
  ell(ctx, 68, 22, 5, 4, '#3a2a1a');
}

function paintGourd(ctx: Ctx): void {
  ell(ctx, 34, 22, 14, 14, rad(ctx, 30, 18, 2, 15, [[0, '#f8d080'], [1, '#b8782a']]));
  ell(ctx, 34, 52, 22, 24, rad(ctx, 28, 44, 3, 26, [[0, '#f8d080'], [1, '#a86a22']]));
  ctx.fillStyle = '#c0281e';
  ctx.fillRect(24, 32, 20, 5);
  ctx.fillStyle = '#7a4a1a';
  ctx.fillRect(30, 4, 8, 8);
}

/** A little glowing wisp: a lost piece of the bell's voice. */
function paintSpirit(ctx: Ctx): void {
  ctx.fillStyle = rad(ctx, 32, 32, 1, 32, [[0, 'rgba(255,250,220,1)'], [0.3, 'rgba(255,220,140,0.7)'], [1, 'rgba(255,190,90,0)']]);
  ctx.fillRect(0, 0, 64, 64);
  ell(ctx, 27, 30, 2, 2.5, '#5a3a1a');
  ell(ctx, 37, 30, 2, 2.5, '#5a3a1a');
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(32, 34, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

export function generateNanpingTextures(scene: Phaser.Scene): void {
  canvas(scene, 'npTemple', W, H, paintTemple);
  canvas(scene, 'npWell', W, H, paintWell);
  canvas(scene, 'npCliff', W, H, paintCliff);
  canvas(scene, 'npTower', W, H, paintTower);
  canvas(scene, 'npBell', 300, 370, paintBell);
  canvas(scene, 'npJigong', JIGONG_TEX.w, JIGONG_TEX.h, paintJigong);
  canvas(scene, 'npLog', 270, 64, (ctx) => paintLog(ctx, 'straight'));
  canvas(scene, 'npLogBent', 270, 80, (ctx) => paintLog(ctx, 'bent'));
  canvas(scene, 'npLogCracked', 220, 64, (ctx) => paintLog(ctx, 'cracked'));
  canvas(scene, 'npShoe', 80, 44, paintShoe);
  canvas(scene, 'npGourd', 70, 80, paintGourd);
  canvas(scene, 'npSpirit', 64, 64, paintSpirit);
  canvas(scene, 'npRing', 256, 256, (ctx) => {
    ctx.strokeStyle = 'rgba(255,230,180,0.9)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,180,0.35)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.stroke();
  });
}

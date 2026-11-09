import * as Phaser from 'phaser';
import { rng } from '../art/paint';
import { drawHead, type Look } from '../art/Cyclist';

type G = Phaser.GameObjects.Graphics;
type Ctx = CanvasRenderingContext2D;

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

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, rot = 0): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

// ---- the Leifeng Pagoda (rebuilt 2002), lit by the setting sun ----------------------------------

export const PAGODA = { w: 440, h: 800 };

/** One stone podium tier with a white balustrade along its top. */
function podium(ctx: Ctx, cx: number, y: number, w: number, h: number): void {
  // the front and the two angled sides of an octagonal plinth
  const side = w * 0.16;
  ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, '#d8c4a6'], [1, '#a8927a']]);
  ctx.fillRect(cx - w / 2 + side, y - h, w - side * 2, h);
  ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, '#9a8470'], [1, '#76604e']]);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y - h + 8);
  ctx.lineTo(cx - w / 2 + side, y - h);
  ctx.lineTo(cx - w / 2 + side, y);
  ctx.lineTo(cx - w / 2, y);
  ctx.fill();
  ctx.fillStyle = lin(ctx, 0, y - h, 0, y, [[0, '#f0d6aa'], [1, '#c09a74']]);
  ctx.beginPath();
  ctx.moveTo(cx + w / 2, y - h + 8);
  ctx.lineTo(cx + w / 2 - side, y - h);
  ctx.lineTo(cx + w / 2 - side, y);
  ctx.lineTo(cx + w / 2, y);
  ctx.fill();
  // stone courses
  ctx.strokeStyle = 'rgba(90,70,55,0.35)';
  ctx.lineWidth = 1;
  for (let k = y - h + 12; k < y; k += 12) {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 2, k);
    ctx.lineTo(cx + w / 2 - 2, k);
    ctx.stroke();
  }
  // balustrade: rail and posts
  ctx.fillStyle = '#f4ece0';
  ctx.fillRect(cx - w / 2 + 4, y - h - 14, w - 8, 4);
  ctx.fillRect(cx - w / 2 + 4, y - h - 4, w - 8, 4);
  for (let x = cx - w / 2 + 6; x <= cx + w / 2 - 6; x += 14) {
    ctx.fillStyle = x > cx ? '#fff4e2' : '#d9cdbd';
    ctx.fillRect(x - 2, y - h - 18, 4, 18);
    ctx.fillRect(x - 3, y - h - 20, 6, 3);
  }
}

/** The walls of one storey: three faces of the octagon, columns, lit doors and lattice windows. */
function wall(ctx: Ctx, cx: number, y: number, ww: number, wh: number): void {
  const x0 = cx - ww / 2;
  const x1 = cx - ww * 0.28;
  const x2 = cx + ww * 0.28;
  const x3 = cx + ww / 2;
  const top = y - wh;
  ctx.fillStyle = lin(ctx, 0, top, 0, y, [[0, '#5a2620'], [1, '#6e3024']]);
  ctx.fillRect(x0, top, x1 - x0, wh);
  ctx.fillStyle = lin(ctx, 0, top, 0, y, [[0, '#7e3426'], [1, '#93402a']]);
  ctx.fillRect(x1, top, x2 - x1, wh);
  ctx.fillStyle = lin(ctx, 0, top, 0, y, [[0, '#a8502e'], [1, '#c8683a']]);
  ctx.fillRect(x2, top, x3 - x2, wh);
  // the big doorway in the middle, glowing from inside
  const dw = (x2 - x1) * 0.52;
  const dh = wh * 0.72;
  ctx.fillStyle = lin(ctx, 0, y - dh, 0, y, [[0, '#ffe6a6'], [0.6, '#f7b25a'], [1, '#d9783a']]);
  ctx.beginPath();
  ctx.moveTo(cx - dw / 2, y);
  ctx.lineTo(cx - dw / 2, y - dh + dw / 2);
  ctx.arc(cx, y - dh + dw / 2, dw / 2, Math.PI, 0, false);
  ctx.lineTo(cx + dw / 2, y);
  ctx.closePath();
  ctx.fill();
  // lattice in the doorway
  ctx.strokeStyle = 'rgba(110,50,20,0.6)';
  ctx.lineWidth = 1.2;
  for (let k = 1; k < 4; k++) {
    const x = cx - dw / 2 + (dw * k) / 4;
    ctx.beginPath();
    ctx.moveTo(x, y - dh + 6);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  for (let yy = y - dh + 12; yy < y; yy += 9) {
    ctx.beginPath();
    ctx.moveTo(cx - dw / 2, yy);
    ctx.lineTo(cx + dw / 2, yy);
    ctx.stroke();
  }
  // side windows: dim on the shady face, warm on the sunny one
  for (const [a, b, lit] of [[x0, x1, false], [x2, x3, true]] as const) {
    const ww2 = (b - a) * 0.5;
    const wx = (a + b) / 2;
    const wy = top + wh * 0.28;
    ctx.fillStyle = lit ? 'rgba(255,214,140,0.9)' : 'rgba(255,190,110,0.45)';
    ctx.fillRect(wx - ww2 / 2, wy, ww2, wh * 0.42);
    ctx.strokeStyle = 'rgba(90,40,20,0.7)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(wx - ww2 / 2 + (ww2 * k) / 3, wy);
      ctx.lineTo(wx - ww2 / 2 + (ww2 * k) / 3, wy + wh * 0.42);
      ctx.stroke();
    }
  }
  // columns at the corners and the edges of the faces
  for (const [x, c] of [[x0, '#4a1c16'], [x1, '#6a2a1c'], [x2, '#c86a36'], [x3, '#e88a48']] as const) {
    ctx.fillStyle = c;
    ctx.fillRect(x - 3.5, top, 7, wh);
  }
  // gilded lintel and the bracket band (斗拱) under the eaves
  ctx.fillStyle = lin(ctx, x0, 0, x3, 0, [[0, '#8a6430'], [0.6, '#d9aa58'], [1, '#ffd98a']]);
  ctx.fillRect(x0 - 4, top - 6, ww + 8, 7);
  ctx.fillStyle = '#3a1e18';
  ctx.fillRect(x0 - 8, top - 16, ww + 16, 10);
  for (let x = x0 - 4; x < x3 + 6; x += 9) {
    ctx.fillStyle = x > cx ? '#e8b860' : '#a87a3a';
    ctx.fillRect(x, top - 15, 5, 4);
    ctx.fillRect(x - 1, top - 10, 7, 3);
  }
}

/** A balcony railing running along the foot of a storey. */
function balcony(ctx: Ctx, cx: number, y: number, w: number): void {
  ctx.fillStyle = lin(ctx, cx - w / 2, 0, cx + w / 2, 0, [[0, '#8a6038'], [0.6, '#d0a058'], [1, '#ffd890']]);
  ctx.fillRect(cx - w / 2, y - 15, w, 3);
  ctx.fillRect(cx - w / 2, y - 4, w, 3);
  for (let x = cx - w / 2; x <= cx + w / 2; x += 8) {
    ctx.fillRect(x - 1, y - 15, 2, 12);
  }
}

/**
 * A wide, upturned eave with a bronze tiled roof sloping up to the storey above.
 * `ey` is the eave line, `topW` the width where the roof meets the next wall.
 */
function eave(ctx: Ctx, cx: number, ey: number, ew: number, rh: number, topW: number): void {
  const L = cx - ew / 2;
  const R = cx + ew / 2;
  const tip = 18;
  // soft shadow under the eave
  ctx.fillStyle = 'rgba(30,10,20,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, ey + 6, ew * 0.42, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(L - 6, ey - tip);
    ctx.quadraticCurveTo(L + ew * 0.12, ey + 3, cx - ew * 0.3, ey + 3);
    ctx.lineTo(cx + ew * 0.3, ey + 3);
    ctx.quadraticCurveTo(R - ew * 0.12, ey + 3, R + 6, ey - tip);
    ctx.quadraticCurveTo(cx + ew * 0.3, ey - rh * 0.3, cx + topW / 2, ey - rh);
    ctx.lineTo(cx - topW / 2, ey - rh);
    ctx.quadraticCurveTo(cx - ew * 0.3, ey - rh * 0.3, L - 6, ey - tip);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = lin(ctx, 0, ey - rh, 0, ey, [[0, '#4a2e22'], [0.55, '#7a4e2e'], [1, '#b07a3e']]);
  ctx.fill();
  // tile rows, clipped to the roof
  ctx.save();
  path();
  ctx.clip();
  ctx.strokeStyle = 'rgba(40,20,10,0.35)';
  ctx.lineWidth = 1.2;
  for (let k = -12; k <= 12; k++) {
    const bx = cx + (k / 12) * (ew / 2 + 6);
    const tx = cx + (k / 12) * (topW / 2);
    ctx.beginPath();
    ctx.moveTo(bx, ey + 4);
    ctx.quadraticCurveTo((bx + tx) / 2 + (bx - tx) * 0.15, ey - rh * 0.4, tx, ey - rh);
    ctx.stroke();
  }
  // sunlight from the right, dusk on the left
  ctx.fillStyle = lin(ctx, L, 0, R, 0, [[0, 'rgba(40,10,40,0.35)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(255,190,90,0.45)']]);
  ctx.fillRect(L - 10, ey - rh - 2, ew + 20, rh + 12);
  ctx.restore();
  // gilded eave edge and corner ridges
  ctx.strokeStyle = lin(ctx, L, 0, R, 0, [[0, '#a07838'], [0.7, '#f0c870'], [1, '#fff0b0']]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(L - 6, ey - tip);
  ctx.quadraticCurveTo(L + ew * 0.12, ey + 3, cx - ew * 0.3, ey + 3);
  ctx.lineTo(cx + ew * 0.3, ey + 3);
  ctx.quadraticCurveTo(R - ew * 0.12, ey + 3, R + 6, ey - tip);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  for (const [a, b] of [[L - 6, cx - topW / 2], [R + 6, cx + topW / 2]]) {
    ctx.beginPath();
    ctx.moveTo(a, ey - tip);
    ctx.quadraticCurveTo((a + b) / 2, ey - rh * 0.25, b, ey - rh);
    ctx.stroke();
  }
  // little curled ornaments and wind-bells at the tips
  for (const x of [L - 6, R + 6]) {
    ctx.fillStyle = x > cx ? '#ffe08a' : '#c09040';
    ctx.beginPath();
    ctx.arc(x, ey - tip - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a4a20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, ey - tip + 2);
    ctx.lineTo(x, ey - tip + 10);
    ctx.stroke();
    ctx.fillStyle = '#d9a84a';
    ctx.fillRect(x - 2.5, ey - tip + 10, 5, 6);
  }
}

function paintPagoda(ctx: Ctx): void {
  const { w, h } = PAGODA;
  const cx = w / 2;
  let y = h - 4;
  podium(ctx, cx, y, 432, 48);
  y -= 48;
  podium(ctx, cx, y, 352, 40);
  y -= 40;
  const SH = [124, 108, 100, 94, 88];
  for (let i = 0; i < SH.length; i++) {
    const ww = 236 * (1 - i * 0.075);
    const sh = SH[i];
    const wh = sh * 0.54;
    wall(ctx, cx, y, ww, wh);
    if (i > 0) balcony(ctx, cx, y, ww * 1.18);
    const ey = y - wh - 16;
    const rh = sh - wh - 16;
    const nextW = 236 * (1 - (i + 1) * 0.075);
    eave(ctx, cx, ey, ww * 1.55, rh, nextW * 1.02);
    y = ey - rh;
  }
  // the crowning roof: a steep pyramid with concave sides
  const capW = 236 * (1 - 5 * 0.075) * 1.5;
  const capH = 66;
  ctx.fillStyle = lin(ctx, 0, y - capH, 0, y, [[0, '#3a2418'], [1, '#a8743a']]);
  ctx.beginPath();
  ctx.moveTo(cx - capW / 2 - 6, y - 14);
  ctx.quadraticCurveTo(cx - capW * 0.2, y - 10, cx - 6, y - capH);
  ctx.lineTo(cx + 6, y - capH);
  ctx.quadraticCurveTo(cx + capW * 0.2, y - 10, cx + capW / 2 + 6, y - 14);
  ctx.quadraticCurveTo(cx, y + 6, cx - capW / 2 - 6, y - 14);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,190,90,0.35)';
  ctx.beginPath();
  ctx.moveTo(cx, y - capH);
  ctx.lineTo(cx + 6, y - capH);
  ctx.quadraticCurveTo(cx + capW * 0.2, y - 10, cx + capW / 2 + 6, y - 14);
  ctx.quadraticCurveTo(cx + capW * 0.25, y + 2, cx, y);
  ctx.fill();
  // the gilded spire (塔刹): a pole with rings, a canopy and a pearl
  const sy = y - capH;
  ctx.fillStyle = lin(ctx, cx - 6, 0, cx + 6, 0, [[0, '#8a6020'], [0.6, '#ffe39a'], [1, '#c08a30']]);
  ctx.fillRect(cx - 3, sy - 112, 6, 112);
  ctx.beginPath();
  ctx.ellipse(cx, sy - 4, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let k = 0; k < 7; k++) {
    ctx.beginPath();
    ctx.ellipse(cx, sy - 20 - k * 10, 11 - k * 0.8, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx - 14, sy - 92);
  ctx.quadraticCurveTo(cx, sy - 102, cx + 14, sy - 92);
  ctx.lineTo(cx, sy - 98);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, cx, sy - 116, 7, 8, rad(ctx, cx + 2, sy - 118, 1, 8, [[0, '#fff8d0'], [1, '#d09a3a']]));
  // a warm sunset wash over everything, brighter on the sunny side
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(60,20,70,0.28)'], [0.55, 'rgba(255,140,60,0.05)'], [1, 'rgba(255,170,80,0.28)']]);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ---- sky, sun, hills ---------------------------------------------------------------------

/** A sunset sky, from violet overhead to gold at the horizon (horizon at the bottom of the canvas). */
function paintSky(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = lin(ctx, 0, 0, 0, h, [
    [0, '#2c2452'],
    [0.25, '#5e3a72'],
    [0.48, '#b4527a'],
    [0.66, '#ee8150'],
    [0.84, '#ffc472'],
    [1, '#ffe7ae'],
  ]);
  ctx.fillRect(0, 0, w, h);
  // long thin clouds, lit from below by the sun
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const y = h * (0.18 + r() * 0.5);
    const x = r() * w;
    const len = 160 + r() * 320;
    const th = 6 + r() * 10;
    const k = y / h;
    ctx.fillStyle = `rgba(${Math.round(120 + k * 120)},${Math.round(60 + k * 80)},${Math.round(110 - k * 40)},0.55)`;
    ctx.beginPath();
    ctx.ellipse(x, y, len / 2, th, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,${Math.round(170 + k * 60)},${Math.round(110 + k * 40)},0.6)`;
    ctx.beginPath();
    ctx.ellipse(x + 10, y + th * 0.45, len * 0.42, th * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintSun(ctx: Ctx): void {
  ctx.fillStyle = rad(ctx, 128, 128, 10, 128, [
    [0, 'rgba(255,248,220,1)'],
    [0.2, 'rgba(255,236,170,0.95)'],
    [0.32, 'rgba(255,190,100,0.5)'],
    [0.6, 'rgba(255,140,80,0.18)'],
    [1, 'rgba(255,120,80,0)'],
  ]);
  ctx.fillRect(0, 0, 256, 256);
  ellipse(ctx, 128, 128, 34, 34, rad(ctx, 122, 120, 4, 36, [[0, '#fffdf0'], [0.7, '#fff0b8'], [1, '#ffd27a']]));
}

// ---- characters -----------------------------------------------------------------------------------

/** 白娘子: a lady in a flowing white robe with a pale green sash and an oil-paper umbrella (faces right). */
function paintLady(ctx: Ctx): void {
  ctx.translate(0, 34);
  // the sash ribbon, streaming behind
  ctx.strokeStyle = 'rgba(150,200,170,0.9)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(70, 132);
  ctx.bezierCurveTo(30, 150, 50, 190, 14, 214);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(72, 136);
  ctx.bezierCurveTo(44, 168, 64, 210, 30, 236);
  ctx.stroke();
  // long hair down the back
  ctx.fillStyle = '#1e1a22';
  ctx.beginPath();
  ctx.moveTo(62, 62);
  ctx.quadraticCurveTo(46, 110, 58, 150);
  ctx.lineTo(70, 148);
  ctx.quadraticCurveTo(64, 100, 78, 66);
  ctx.closePath();
  ctx.fill();
  // the robe: narrow at the waist, flaring to the ground
  ctx.fillStyle = lin(ctx, 50, 0, 120, 0, [[0, '#d6dce6'], [0.5, '#ffffff'], [1, '#eef0f4']]);
  ctx.beginPath();
  ctx.moveTo(70, 82);
  ctx.quadraticCurveTo(92, 80, 96, 96);
  ctx.lineTo(98, 134);
  ctx.quadraticCurveTo(110, 200, 128, 252);
  ctx.quadraticCurveTo(88, 260, 40, 252);
  ctx.quadraticCurveTo(62, 200, 66, 134);
  ctx.closePath();
  ctx.fill();
  // folds
  ctx.strokeStyle = 'rgba(150,160,180,0.45)';
  ctx.lineWidth = 1.5;
  for (const [x0, x1] of [[78, 70], [86, 92], [92, 112]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 140);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 4, 200, x1, 250);
    ctx.stroke();
  }
  // the green sash round the waist
  ctx.fillStyle = '#9fcdb2';
  ctx.fillRect(66, 126, 33, 9);
  ctx.fillStyle = '#7fb596';
  ctx.fillRect(66, 133, 33, 3);
  // the sleeve hanging from the arm that holds the umbrella
  ctx.fillStyle = lin(ctx, 0, 90, 0, 170, [[0, '#ffffff'], [1, '#dfe4ec']]);
  ctx.beginPath();
  ctx.moveTo(88, 90);
  ctx.quadraticCurveTo(112, 110, 110, 128);
  ctx.quadraticCurveTo(118, 160, 100, 172);
  ctx.quadraticCurveTo(92, 150, 94, 128);
  ctx.closePath();
  ctx.fill();
  // neck and face (profile)
  ctx.fillStyle = '#f6e1d4';
  ctx.fillRect(76, 70, 10, 14);
  ellipse(ctx, 82, 56, 15, 17, '#f8e6da');
  ctx.beginPath();
  ctx.moveTo(95, 54);
  ctx.lineTo(99, 61);
  ctx.lineTo(94, 63);
  ctx.fill();
  // closed, smiling eye and a touch of rouge
  ctx.strokeStyle = '#3a2a2a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(89, 54, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ellipse(ctx, 88, 62, 4, 2.6, 'rgba(240,140,150,0.45)');
  ctx.fillStyle = '#c0505a';
  ctx.fillRect(92, 66, 4, 1.6);
  // hair: a high bun with a jade pin and a little flower
  ctx.fillStyle = '#1e1a22';
  ctx.beginPath();
  ctx.arc(80, 50, 16, Math.PI * 0.9, Math.PI * 2.1);
  ctx.fill();
  ellipse(ctx, 74, 32, 11, 10, '#1e1a22');
  ellipse(ctx, 84, 28, 8, 7, '#1e1a22');
  ctx.strokeStyle = '#8fd0b0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(62, 36);
  ctx.lineTo(92, 26);
  ctx.stroke();
  ellipse(ctx, 92, 26, 3, 3, '#cfeedd');
  for (let k = 0; k < 5; k++) ellipse(ctx, 66 + Math.cos(k * 1.26) * 3.5, 28 + Math.sin(k * 1.26) * 3.5, 2.6, 2.6, '#ffffff');
  ellipse(ctx, 66, 28, 1.8, 1.8, '#f0c060');
  // the hand and the umbrella over her shoulder
  ellipse(ctx, 104, 116, 4, 4, '#f6e1d4');
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(108, 128);
  ctx.lineTo(64, 18);
  ctx.stroke();
  ctx.save();
  ctx.translate(62, 16);
  ctx.rotate(-0.38);
  ctx.fillStyle = lin(ctx, -58, 0, 58, 0, [[0, '#c9ddd6'], [0.5, '#eef7f2'], [1, '#d7e8e0']]);
  ctx.beginPath();
  ctx.moveTo(-58, 12);
  ctx.quadraticCurveTo(0, -30, 58, 12);
  ctx.quadraticCurveTo(0, 2, -58, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,150,140,0.7)';
  ctx.lineWidth = 1;
  for (let k = -4; k <= 4; k++) {
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(k * 14, 10 - Math.abs(k) * 0.4);
    ctx.stroke();
  }
  // a painted sprig of willow on the paper
  ctx.strokeStyle = 'rgba(90,140,110,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(18, -8);
  ctx.quadraticCurveTo(30, 0, 34, 10);
  ctx.stroke();
  for (let k = 0; k < 5; k++) ellipse(ctx, 22 + k * 3, -4 + k * 3, 1.6, 4, 'rgba(110,170,120,0.8)', -0.6);
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.arc(0, -12, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 法海: a grumpy old monk with huge white eyebrows, a red patchwork kasaya, a golden bowl and a ringed staff. */
function paintFahai(ctx: Ctx): void {
  // the staff (禅杖) with its rings
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(30, 228);
  ctx.lineTo(30, 30);
  ctx.stroke();
  ctx.strokeStyle = '#d9a84a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(30, 22, 12, 16, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const [x, y] of [[20, 30], [40, 30], [22, 14], [38, 14]]) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // grey under-robe
  ctx.fillStyle = lin(ctx, 40, 0, 130, 0, [[0, '#6a6a72'], [1, '#8a8a92']]);
  ctx.beginPath();
  ctx.moveTo(56, 92);
  ctx.quadraticCurveTo(84, 82, 112, 92);
  ctx.lineTo(126, 226);
  ctx.lineTo(44, 226);
  ctx.closePath();
  ctx.fill();
  // red kasaya, draped over the left shoulder, with a gold patchwork grid (田相)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(52, 96);
  ctx.lineTo(96, 86);
  ctx.lineTo(124, 214);
  ctx.lineTo(48, 214);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, 40, 0, 130, 0, [[0, '#8a2a1e'], [0.5, '#c0402a'], [1, '#d85a34']]);
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(240,190,90,0.85)';
  ctx.lineWidth = 2;
  for (let x = 40; x < 130; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x + 8, 220);
    ctx.stroke();
  }
  for (let y = 110; y < 220; y += 26) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(130, y);
    ctx.stroke();
  }
  ctx.restore();
  // a gold ring fastening at the shoulder
  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(66, 104, 5, 0, Math.PI * 2);
  ctx.stroke();
  // arm holding the staff
  ctx.fillStyle = '#7a7a82';
  ctx.beginPath();
  ctx.moveTo(56, 100);
  ctx.quadraticCurveTo(36, 120, 34, 140);
  ctx.lineTo(44, 146);
  ctx.quadraticCurveTo(52, 126, 66, 116);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 34, 140, 7, 6, '#f1c7a5');
  // the other arm raises the golden bowl
  ctx.fillStyle = '#7a7a82';
  ctx.beginPath();
  ctx.moveTo(106, 98);
  ctx.quadraticCurveTo(130, 84, 134, 62);
  ctx.lineTo(124, 58);
  ctx.quadraticCurveTo(120, 80, 100, 90);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 130, 58, 7, 6, '#f1c7a5');
  ctx.fillStyle = lin(ctx, 110, 0, 150, 0, [[0, '#a8782a'], [0.5, '#ffe7a0'], [1, '#c8902e']]);
  ctx.beginPath();
  ctx.moveTo(112, 52);
  ctx.quadraticCurveTo(130, 20, 148, 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(110, 50, 40, 4);
  // prayer beads round the neck
  for (let k = 0; k < 11; k++) {
    const a = Math.PI * 0.15 + (k / 10) * Math.PI * 0.7;
    ellipse(ctx, 84 + Math.cos(a) * 20, 84 + Math.sin(a) * 14, 3, 3, k % 5 ? '#5a2a1a' : '#e0b050');
  }
  // the big bald head with the six ordination dots
  ellipse(ctx, 84, 60, 24, 26, rad(ctx, 90, 48, 4, 30, [[0, '#ffe2c8'], [1, '#eab890']]));
  ctx.fillStyle = '#c9906a';
  for (const [x, y] of [[76, 40], [84, 38], [92, 40], [76, 46], [84, 44], [92, 46]]) {
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ellipse(ctx, 60, 62, 5, 8, '#eab890');
  ellipse(ctx, 108, 62, 5, 8, '#eab890');
  // huge white eyebrows, frowning
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 52);
  ctx.quadraticCurveTo(72, 46, 82, 56);
  ctx.quadraticCurveTo(70, 56, 56, 66);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(104, 52);
  ctx.quadraticCurveTo(96, 46, 86, 56);
  ctx.quadraticCurveTo(98, 56, 112, 66);
  ctx.closePath();
  ctx.fill();
  // stern eyes, a big nose, a drooping white beard
  ellipse(ctx, 75, 61, 2.4, 2.4, '#2a1a14');
  ellipse(ctx, 93, 61, 2.4, 2.4, '#2a1a14');
  ellipse(ctx, 84, 68, 4, 5, '#e2a880');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(70, 76);
  ctx.quadraticCurveTo(84, 72, 98, 76);
  ctx.quadraticCurveTo(92, 100, 84, 108);
  ctx.quadraticCurveTo(76, 100, 70, 76);
  ctx.fill();
  ctx.strokeStyle = '#7a3a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(84, 82, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
}

/** 法海 popping into the photo: cross-eyed, tongue out, waggling his ears. */
function paintFahaiPeek(ctx: Ctx): void {
  ellipse(ctx, 100, 90, 54, 58, rad(ctx, 110, 70, 6, 60, [[0, '#ffe2c8'], [1, '#e8b48c']]));
  ctx.fillStyle = '#c9906a';
  for (const [x, y] of [[84, 46], [100, 44], [116, 46], [84, 58], [100, 56], [116, 58]]) {
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // hands at the ears, fingers wiggling
  for (const s of [-1, 1]) {
    const x = 100 + s * 66;
    ellipse(ctx, x, 92, 14, 18, '#f1c7a5');
    for (let k = 0; k < 4; k++) ellipse(ctx, x + s * 10, 72 + k * 9, 8, 4, '#f1c7a5', s * 0.3);
  }
  ctx.fillStyle = '#ffffff';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(100 + s * 8, 72);
    ctx.quadraticCurveTo(100 + s * 26, 56, 100 + s * 46, 78);
    ctx.quadraticCurveTo(100 + s * 26, 70, 100 + s * 8, 80);
    ctx.fill();
  }
  // crossed eyes
  for (const s of [-1, 1]) {
    ellipse(ctx, 100 + s * 20, 90, 11, 12, '#ffffff');
    ellipse(ctx, 100 + s * 13, 92, 5, 5, '#2a1a14');
  }
  ellipse(ctx, 100, 104, 7, 8, '#e2a880');
  // mouth wide open, tongue out
  ellipse(ctx, 100, 126, 18, 12, '#6a1a1a');
  ellipse(ctx, 100, 136, 10, 12, '#e86a7a');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(80, 116);
  ctx.quadraticCurveTo(100, 108, 120, 116);
  ctx.quadraticCurveTo(110, 120, 100, 118);
  ctx.quadraticCurveTo(90, 120, 80, 116);
  ctx.fill();
}

/** A Chinese mitten crab (大闸蟹), seen from above; `monk` adds a tiny bald head peeping out. */
function paintCrab(ctx: Ctx, cooked: boolean, monk: boolean): void {
  const shell = cooked ? ['#ffb25a', '#e0602a', '#a83a1a'] : ['#8a8a5a', '#5a5a34', '#34341e'];
  const leg = cooked ? '#d8582a' : '#4a4a2a';
  ctx.strokeStyle = leg;
  ctx.lineCap = 'round';
  // four legs a side
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const y = 40 + k * 7;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(60 + s * 26, y);
      ctx.lineTo(60 + s * (40 + k * 2), y - 6 + k * 4);
      ctx.lineTo(60 + s * (54 + k * 2), y + 8 + k * 3);
      ctx.stroke();
    }
  }
  // claws, with hairy "mittens"
  for (const s of [-1, 1]) {
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(60 + s * 18, 32);
    ctx.lineTo(60 + s * 30, 18);
    ctx.stroke();
    ellipse(ctx, 60 + s * 34, 12, 9, 7, leg, s * 0.5);
    ellipse(ctx, 60 + s * 32, 18, 6, 5, cooked ? '#8a4a2a' : '#2a2416');
    ctx.fillStyle = shell[0];
    ctx.beginPath();
    ctx.moveTo(60 + s * 38, 6);
    ctx.lineTo(60 + s * 46, 2);
    ctx.lineTo(60 + s * 42, 12);
    ctx.fill();
  }
  // the shell
  ellipse(ctx, 60, 44, 30, 24, rad(ctx, 56, 36, 3, 32, [[0, shell[0]], [0.6, shell[1]], [1, shell[2]]]));
  ctx.strokeStyle = cooked ? 'rgba(140,40,20,0.5)' : 'rgba(30,30,10,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(48, 36);
  ctx.quadraticCurveTo(60, 46, 72, 36);
  ctx.moveTo(52, 52);
  ctx.quadraticCurveTo(60, 48, 68, 52);
  ctx.stroke();
  // eyes on stalks
  for (const s of [-1, 1]) {
    ctx.strokeStyle = leg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60 + s * 6, 24);
    ctx.lineTo(60 + s * 8, 16);
    ctx.stroke();
    ellipse(ctx, 60 + s * 8, 15, 3, 3, '#141410');
    ellipse(ctx, 60 + s * 8.6, 14.2, 1, 1, '#ffffff');
  }
  if (monk) {
    // 法海, very small, peeping out from under the shell
    ellipse(ctx, 60, 24, 8, 8, '#ffd8b8');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(53, 21, 6, 2);
    ctx.fillRect(61, 21, 6, 2);
    ellipse(ctx, 57, 25, 1.2, 1.2, '#2a1a14');
    ellipse(ctx, 63, 25, 1.2, 1.2, '#2a1a14');
  }
}

/** A brick from the old pagoda; some have a hole holding a rolled sutra (藏经砖). */
function paintBrick(ctx: Ctx, scroll: boolean): void {
  ctx.fillStyle = lin(ctx, 0, 0, 0, 28, [[0, '#b0684a'], [1, '#7a4030']]);
  ctx.fillRect(1, 1, 58, 26);
  const r = rng(scroll ? 3 : 7);
  for (let i = 0; i < 18; i++) ellipse(ctx, 4 + r() * 52, 4 + r() * 20, 1 + r() * 2, 1 + r() * 1.5, 'rgba(60,30,20,0.35)');
  ctx.strokeStyle = 'rgba(255,220,180,0.25)';
  ctx.beginPath();
  ctx.moveTo(2, 2.5);
  ctx.lineTo(58, 2.5);
  ctx.stroke();
  if (scroll) {
    ellipse(ctx, 30, 14, 7, 7, '#3a1a12');
    ellipse(ctx, 30, 14, 5, 5, lin(ctx, 25, 0, 35, 0, [[0, '#c9a46a'], [1, '#f2dcae']]));
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(30, 14, 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** The silver Ashoka stupa (阿育王塔) found in the underground palace in 2001. */
function paintStupa(ctx: Ctx): void {
  const silver = (x0: number, x1: number) => lin(ctx, x0, 0, x1, 0, [[0, '#8a8e98'], [0.35, '#f4f6fa'], [0.6, '#c4c8d2'], [1, '#7a7e88']]);
  // base
  ctx.fillStyle = silver(20, 120);
  ctx.fillRect(22, 196, 96, 16);
  ctx.fillRect(30, 186, 80, 10);
  // the square body with a relief panel
  ctx.fillStyle = silver(30, 110);
  ctx.fillRect(34, 112, 72, 74);
  ctx.strokeStyle = 'rgba(80,80,90,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 120, 56, 58);
  ctx.beginPath();
  ctx.arc(70, 150, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(62, 166);
  ctx.quadraticCurveTo(70, 140, 78, 166);
  ctx.stroke();
  ctx.fillStyle = silver(30, 110);
  ctx.fillRect(30, 104, 80, 10);
  // the four "mountain flower" blades at the corners (山花蕉叶)
  for (const [x, s] of [[34, -1], [106, 1], [54, -0.5], [86, 0.5]] as const) {
    ctx.fillStyle = silver(x - 12, x + 12);
    ctx.beginPath();
    ctx.moveTo(x - 9, 104);
    ctx.quadraticCurveTo(x + s * 6 - 6, 70, x + s * 10, 52);
    ctx.quadraticCurveTo(x + s * 8 + 6, 78, x + 9, 104);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,80,90,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // the spire with five rings
  ctx.fillStyle = silver(64, 76);
  ctx.fillRect(66, 22, 8, 84);
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    ctx.ellipse(70, 92 - k * 13, 12 - k, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ellipse(ctx, 70, 18, 7, 8, rad(ctx, 68, 15, 1, 8, [[0, '#ffffff'], [1, '#9aa0aa']]));
  // a sparkle
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(48, 130);
  ctx.lineTo(50, 136);
  ctx.lineTo(56, 138);
  ctx.lineTo(50, 140);
  ctx.lineTo(48, 146);
  ctx.lineTo(46, 140);
  ctx.lineTo(40, 138);
  ctx.lineTo(46, 136);
  ctx.closePath();
  ctx.fill();
}

/** A wooden fish (木鱼), the monk's drum, rolling along. */
function paintMuyu(ctx: Ctx): void {
  ellipse(ctx, 30, 26, 24, 18, rad(ctx, 24, 18, 3, 26, [[0, '#d8784a'], [0.7, '#a8402a'], [1, '#6a2418']]));
  ctx.fillStyle = '#3a140e';
  ctx.beginPath();
  ctx.moveTo(8, 26);
  ctx.quadraticCurveTo(30, 34, 52, 26);
  ctx.quadraticCurveTo(30, 30, 8, 26);
  ctx.fill();
  ellipse(ctx, 18, 18, 4, 4, '#ffe0a0');
  ellipse(ctx, 18, 18, 2, 2, '#3a140e');
  ctx.strokeStyle = 'rgba(255,220,180,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(32, 22, 12, Math.PI * 1.1, Math.PI * 1.7);
  ctx.stroke();
}

/** The crab, opened at the dinner table: inside the shell, the little 'monk' (蟹和尚, the crab's stomach). */
function paintCrabOpen(ctx: Ctx): void {
  // a porcelain plate with a blue rim
  ellipse(ctx, 180, 150, 172, 102, '#d8dde6');
  ellipse(ctx, 180, 146, 168, 98, '#ffffff');
  ctx.strokeStyle = '#4a6aa8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(180, 146, 156, 88, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(180, 146, 146, 80, 0, 0, Math.PI * 2);
  ctx.stroke();
  // the upturned shell: orange outside, golden roe inside
  ellipse(ctx, 180, 140, 112, 70, rad(ctx, 170, 120, 10, 120, [[0, '#ffb05a'], [0.7, '#e0602a'], [1, '#a83a1a']]));
  ellipse(ctx, 180, 136, 96, 58, rad(ctx, 176, 128, 6, 100, [[0, '#ffe08a'], [0.6, '#f0a83a'], [1, '#c8702a']]));
  const r = rng(4);
  for (let i = 0; i < 60; i++) ellipse(ctx, 110 + r() * 140, 100 + r() * 72, 2 + r() * 4, 2 + r() * 3, 'rgba(255,200,90,0.6)');
  // the little monk, sitting cross-legged
  ctx.fillStyle = 'rgba(250,240,220,0.95)';
  ctx.beginPath();
  ctx.moveTo(150, 170);
  ctx.quadraticCurveTo(180, 112, 210, 170);
  ctx.quadraticCurveTo(180, 182, 150, 170);
  ctx.fill();
  ellipse(ctx, 180, 112, 17, 17, 'rgba(255,246,230,0.98)');
  ctx.strokeStyle = 'rgba(160,120,90,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(172, 140);
  ctx.quadraticCurveTo(180, 150, 188, 140);
  ctx.stroke();
  // a grumpy little face, with 法海's eyebrows
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(170, 106, 7, 2);
  ctx.fillRect(183, 106, 7, 2);
  ellipse(ctx, 174, 112, 1.6, 1.6, '#3a2018');
  ellipse(ctx, 186, 112, 1.6, 1.6, '#3a2018');
  ctx.strokeStyle = '#7a3a2a';
  ctx.beginPath();
  ctx.arc(180, 122, 4, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
}

/** A soft clump of tree crowns at dusk: dark plum, with a warm rim on the side facing the sun. */
function paintCanopy(ctx: Ctx, seed: number): void {
  const r = rng(seed);
  const blobs = Array.from({ length: 11 }, () => ({ x: 30 + r() * 100, y: 40 + r() * 60, rr: 16 + r() * 18 }));
  blobs.push({ x: 80, y: 66, rr: 40 });
  for (const b of blobs) ellipse(ctx, b.x, b.y, b.rr, b.rr * 0.9, '#3a2840');
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  // the sunlit rim, upper right
  for (const b of blobs) ellipse(ctx, b.x + b.rr * 0.35, b.y - b.rr * 0.35, b.rr * 0.8, b.rr * 0.7, 'rgba(226,140,90,0.55)');
  // and the shadow side again, leaving only a thin rim lit
  for (const b of blobs) ellipse(ctx, b.x - b.rr * 0.12, b.y + b.rr * 0.12, b.rr * 0.86, b.rr * 0.8, 'rgba(46,30,52,0.95)');
  // a little leafy texture
  for (let i = 0; i < 120; i++) ellipse(ctx, r() * 160, r() * 120, 1.5 + r() * 2.5, 1.2 + r() * 2, r() < 0.5 ? 'rgba(80,50,80,0.5)' : 'rgba(30,18,34,0.5)');
  ctx.restore();
}

// ---- drawn with Graphics -----------------------------------------------------------------------

const SKIN = 0xf1c7a5;

/** A kid running up steps, facing right; `phase` drives the stride. Feet at y = 0. */
export function drawRunner(g: G, look: Look, phase: number, opts: { backpack?: boolean; air?: boolean } = {}): void {
  g.clear();
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const lift = opts.air ? 10 : Math.abs(c) * 3;
  const hip = { x: 0, y: -56 - lift };
  const sh = { x: 8, y: -100 - lift };
  g.fillStyle(0x000000, 0.14);
  g.fillEllipse(0, 2, 40, 7);
  // legs: knee up in front, the other pushing off behind
  const leg = (k: number, col: number) => {
    const knee = { x: hip.x + 10 + k * 10, y: hip.y + 22 - Math.max(0, k) * 12 };
    const foot = { x: hip.x + k * 18, y: Math.min(0, -Math.max(0, k) * 16) - (opts.air ? 6 : 0) };
    g.lineStyle(9, col, 1);
    g.lineBetween(hip.x, hip.y, knee.x, knee.y);
    g.lineBetween(knee.x, knee.y, foot.x, foot.y);
    g.fillStyle(0x333333, 1);
    g.fillRoundedRect(foot.x - 4, foot.y - 4, 14, 6, 2);
  };
  leg(-s, Phaser.Display.Color.IntegerToColor(look.pants).darken(15).color);
  if (opts.backpack) {
    g.fillStyle(0x2e6f8e, 1);
    g.fillRoundedRect(sh.x - 26, sh.y + 2, 16, 30, 6);
  }
  // torso, leaning into the climb
  g.lineStyle(17, look.shirt, 1);
  g.lineBetween(hip.x, hip.y, sh.x, sh.y);
  g.fillStyle(look.shirt, 1);
  g.fillCircle(sh.x, sh.y, 8.5);
  g.fillCircle(hip.x, hip.y, 8.5);
  leg(s, look.pants);
  // arms swinging opposite to the legs
  for (const k of [s, -s]) {
    const el = { x: sh.x + k * 12, y: sh.y + 18 };
    const hand = { x: sh.x + k * 20 + 6, y: sh.y + 10 - Math.abs(k) * 4 };
    g.lineStyle(6, look.shirt, 1);
    g.lineBetween(sh.x, sh.y, el.x, el.y);
    g.lineBetween(el.x, el.y, hand.x, hand.y);
    g.fillStyle(SKIN, 1);
    g.fillCircle(hand.x, hand.y, 4);
  }
  drawHead(g, sh.x + 6, sh.y - 16, look, 1);
}


/** Rolling hills along a horizon, as a silhouette (for the sunset layers). */
export function ridge(g: G, baseY: number, amp: number, seed: number, color: number, alpha = 1, width = 1280): Phaser.Math.Vector2[] {
  const r = rng(seed);
  const waves = Array.from({ length: 4 }, (_, i) => ({ f: (0.002 + r() * 0.003) * (i + 1), p: r() * 7, a: amp / (i + 1.3) }));
  const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, baseY + amp * 2)];
  for (let x = 0; x <= width + 16; x += 12) {
    let y = baseY;
    for (const w of waves) y -= (Math.sin(x * w.f + w.p) * 0.5 + 0.5) * w.a;
    pts.push(new Phaser.Math.Vector2(x, y));
  }
  pts.push(new Phaser.Math.Vector2(width + 16, baseY + amp * 2));
  g.fillStyle(color, alpha);
  g.fillPoints(pts, true);
  return pts;
}

/** A slim pagoda silhouette on the far hill: 保俶塔, "the beauty" to Leifeng's "old monk". */
export function baochu(g: G, x: number, groundY: number, h: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillTriangle(x - h * 0.07, groundY, x + h * 0.07, groundY, x, groundY - h);
  g.fillRect(x - 1, groundY - h - h * 0.12, 2, h * 0.12);
}

export function generateLeifengTextures(scene: Phaser.Scene): void {
  canvas(scene, 'lfPagoda', PAGODA.w, PAGODA.h, paintPagoda);
  canvas(scene, 'lfSky', 1280, 420, (ctx) => paintSky(ctx, 1280, 420));
  canvas(scene, 'lfSun', 256, 256, paintSun);
  canvas(scene, 'lfLady', 150, 296, paintLady);
  canvas(scene, 'lfFahai', 160, 232, paintFahai);
  canvas(scene, 'lfFahaiPeek', 200, 170, paintFahaiPeek);
  canvas(scene, 'lfCrab', 120, 80, (ctx) => paintCrab(ctx, false, false));
  canvas(scene, 'lfCrabMonk', 120, 80, (ctx) => paintCrab(ctx, false, true));
  canvas(scene, 'lfCrabCooked', 120, 80, (ctx) => paintCrab(ctx, true, false));
  canvas(scene, 'lfBrick', 60, 28, (ctx) => paintBrick(ctx, false));
  canvas(scene, 'lfBrickScroll', 60, 28, (ctx) => paintBrick(ctx, true));
  canvas(scene, 'lfStupa', 140, 216, paintStupa);
  canvas(scene, 'lfCrabOpen', 360, 260, paintCrabOpen);
  canvas(scene, 'lfMuyu', 60, 48, paintMuyu);
  canvas(scene, 'lfCanopy', 160, 120, (ctx) => paintCanopy(ctx, 3));
  canvas(scene, 'lfCanopy2', 160, 120, (ctx) => paintCanopy(ctx, 11));
  canvas(scene, 'lfGlow', 128, 128, (ctx) => {
    ctx.fillStyle = rad(ctx, 64, 64, 2, 64, [[0, 'rgba(255,220,150,0.9)'], [0.4, 'rgba(255,180,90,0.35)'], [1, 'rgba(255,150,80,0)']]);
    ctx.fillRect(0, 0, 128, 128);
  });
  canvas(scene, 'lfSpark', 32, 32, (ctx) => {
    ctx.fillStyle = rad(ctx, 16, 16, 0, 16, [[0, 'rgba(255,255,240,1)'], [0.3, 'rgba(255,230,160,0.6)'], [1, 'rgba(255,200,120,0)']]);
    ctx.fillRect(0, 0, 32, 32);
  });
  canvas(scene, 'lfPoof', 128, 128, (ctx) => {
    const r = rng(9);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const x = 64 + Math.cos(a) * 28;
      const y = 64 + Math.sin(a) * 28;
      ellipse(ctx, x, y, 22 + r() * 8, 22 + r() * 8, rad(ctx, x, y, 2, 30, [[0, 'rgba(255,250,240,0.95)'], [1, 'rgba(255,240,220,0)']]));
    }
    ellipse(ctx, 64, 64, 32, 32, 'rgba(255,252,246,0.95)');
  });
}

/** A willow against the sunset: a dark trunk, drooping strands, a few lit from the right. */
export function drawWillow(g: G, x: number, baseY: number, h: number, seed: number): void {
  const r = rng(seed);
  g.lineStyle(10, 0x2a1a24, 1);
  g.beginPath();
  g.moveTo(x, baseY);
  g.lineTo(x + 6, baseY - h * 0.45);
  g.lineTo(x - 4, baseY - h * 0.75);
  g.strokePath();
  g.lineStyle(5, 0x2a1a24, 1);
  g.lineBetween(x + 6, baseY - h * 0.45, x + 40, baseY - h * 0.8);
  g.lineBetween(x - 4, baseY - h * 0.75, x - 40, baseY - h * 0.95);
  // crown
  for (let i = 0; i < 14; i++) {
    g.fillStyle(0x2e2030, 0.9);
    g.fillEllipse(x + (r() - 0.5) * h * 0.6, baseY - h * (0.8 + r() * 0.2), 50 + r() * 40, 26 + r() * 16);
  }
  // hanging strands: thin, curving, swaying a little to the right
  for (let i = 0; i < 90; i++) {
    const sx = x + (r() - 0.5) * h * 0.8;
    const sy = baseY - h * (0.72 + r() * 0.24);
    const len = h * (0.2 + r() * 0.45);
    const lit = sx > x && r() < 0.5;
    const col = lit ? 0xc8784a : r() < 0.5 ? 0x2e2030 : 0x3a2a3c;
    const pts: Phaser.Math.Vector2[] = [];
    for (let k = 0; k <= 8; k++) {
      const tt = k / 8;
      pts.push(new Phaser.Math.Vector2(sx + Math.sin(tt * 2.2) * 6 + tt * tt * 8, sy + len * tt));
    }
    g.lineStyle(lit ? 1.4 : 1.8, col, lit ? 0.85 : 0.95);
    g.strokePoints(pts, false, false);
    // tiny leaves along the strand
    for (let k = 2; k <= 8; k += 2) {
      g.fillStyle(col, 0.9);
      g.fillEllipse(pts[k].x + 2, pts[k].y, 3, 6);
    }
  }
}

/** A dark wooded hillside: the shape, then tree crowns along its top edge and scattered over it. */
export function drawHill(scene: Phaser.Scene, g: G, pts: Phaser.Math.Vector2[], seed: number, depth: number): void {
  g.fillGradientStyle(0x463050, 0x463050, 0x2a1c30, 0x2a1c30, 1);
  g.fillPoints(pts, true);
  const r = rng(seed);
  for (let i = 1; i < pts.length - 2; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    for (let d = 0; d < len; d += 34) {
      const k = d / len;
      const x = a.x + (b.x - a.x) * k + (r() - 0.5) * 16;
      const y = a.y + (b.y - a.y) * k + 14 + r() * 10;
      scene.add.image(x, y, r() < 0.5 ? 'lfCanopy' : 'lfCanopy2').setScale(0.45 + r() * 0.35).setDepth(depth).setFlipX(r() < 0.3);
    }
  }
}

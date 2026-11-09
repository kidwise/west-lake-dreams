import * as Phaser from 'phaser';
import { FONT_SERIF, TEXT_RES } from '../core/config';
import { pagoda as tinyPagoda, quad, rng, strokeCurve } from '../art/paint';

type G = Phaser.GameObjects.Graphics;
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// ---------------------------------------------------------------------------
// 三潭 stone pagoda: pedestal in the water, a hollow stone sphere with five
// round openings, then 宝盖, a little six-sided pavilion, 小宝盖 and a gourd (葫芦) finial.
// ---------------------------------------------------------------------------
export const PAGODA_W = 120;
export const PAGODA_H = 260;
/** Hole centres (texture px) — used to place candle glows at night. */
export const PAGODA_HOLES = [
  { x: 60, y: 158, rx: 9, ry: 9 },
  { x: 32, y: 158, rx: 4.5, ry: 8.5 },
  { x: 88, y: 158, rx: 4.5, ry: 8.5 },
];

function stonePagoda(g: G, lit: boolean): void {
  const cx = 60;
  const stone = lit ? 0x3b3f4d : 0xa39d8f;
  const stoneDark = lit ? 0x2a2d38 : 0x857f72;
  const stoneLight = lit ? 0x555a6b : 0xc6c0b1;

  // pedestal at the waterline
  g.fillStyle(stoneDark, 1);
  g.fillEllipse(cx, 249, 70, 16);
  g.fillStyle(stone, 1);
  g.fillEllipse(cx, 245, 64, 12);
  // pillar
  g.fillStyle(stoneDark, 1);
  g.fillPoints([V(cx - 12, 246), V(cx + 12, 246), V(cx + 9, 200), V(cx - 9, 200)], true);
  g.fillStyle(stone, 1);
  g.fillPoints([V(cx - 12, 246), V(cx - 2, 246), V(cx - 1, 200), V(cx - 9, 200)], true);
  g.fillStyle(stoneLight, 1);
  g.fillRect(cx - 15, 204, 30, 6);
  g.fillStyle(stone, 1);
  g.fillEllipse(cx, 200, 46, 12);

  // the sphere
  g.fillStyle(stone, 1);
  g.fillCircle(cx, 158, 42);
  g.fillStyle(stoneDark, 0.65);
  g.slice(cx, 158, 42, -Math.PI / 2, Math.PI / 2, false);
  g.fillPath();
  g.fillStyle(stone, 1);
  g.fillEllipse(cx + 6, 158, 52, 84);
  g.fillStyle(stoneLight, lit ? 0.4 : 0.55);
  g.fillCircle(cx - 16, 142, 15);
  g.lineStyle(2, stoneDark, 0.8);
  g.strokeEllipse(cx, 158, 84, 14);
  // moss near the bottom
  if (!lit) {
    const r = rng(4);
    for (let i = 0; i < 14; i++) {
      g.fillStyle(0x6f7d4e, 0.35 + r() * 0.3);
      g.fillCircle(cx - 30 + r() * 60, 182 + r() * 12, 2 + r() * 4);
    }
  }
  // round openings
  for (const h of PAGODA_HOLES) {
    if (lit) {
      g.fillStyle(0xffb347, 0.35);
      g.fillEllipse(h.x, h.y, h.rx * 3.4, h.ry * 3.0);
      g.fillStyle(0xffd77a, 1);
    } else {
      g.fillStyle(0x2b2925, 1);
    }
    g.fillEllipse(h.x, h.y, h.rx * 2, h.ry * 2);
    if (lit) {
      g.fillStyle(0xfff3c4, 1);
      g.fillEllipse(h.x, h.y, h.rx, h.ry);
    }
  }
  // collar on top of the sphere
  g.fillStyle(stone, 1);
  g.fillEllipse(cx, 116, 40, 12);
  g.fillStyle(stoneDark, 1);
  g.fillRect(cx - 7, 106, 14, 10);

  // 宝盖: a broad flat canopy with slightly upturned edges
  const cap = lit ? 0x262a33 : 0x6a6458;
  g.fillStyle(cap, 1);
  g.fillPoints([V(cx - 44, 100), V(cx - 36, 106), V(cx + 36, 106), V(cx + 44, 100), V(cx + 30, 96), V(cx - 30, 96)], true);
  g.fillStyle(stoneLight, lit ? 0.25 : 0.5);
  g.fillRect(cx - 30, 96, 60, 2);

  // 六角小亭子: a little six-sided pavilion body with openings between posts
  g.fillStyle(stone, 1);
  g.fillRect(cx - 14, 74, 28, 22);
  g.fillStyle(stoneDark, 1);
  g.fillRect(cx - 14, 74, 3, 22);
  g.fillRect(cx - 1.5, 74, 3, 22);
  g.fillRect(cx + 11, 74, 3, 22);
  g.fillStyle(lit ? 0xffd77a : 0x2b2925, lit ? 0.9 : 1);
  g.fillRect(cx - 10, 79, 8, 12);
  g.fillRect(cx + 2, 79, 8, 12);
  g.fillStyle(stoneDark, 1);
  g.fillRect(cx - 16, 92, 32, 4);

  // 小宝盖: a smaller upturned cap
  g.fillStyle(cap, 1);
  g.fillPoints([V(cx - 26, 70), V(cx - 20, 75), V(cx + 20, 75), V(cx + 26, 70), V(cx + 12, 63), V(cx - 12, 63)], true);

  // 葫芦顶: gourd finial
  g.fillStyle(stone, 1);
  g.fillCircle(cx, 54, 9);
  g.fillCircle(cx, 40, 6.5);
  g.fillTriangle(cx - 2, 36, cx + 2, 36, cx, 24);
  g.fillStyle(stoneLight, 0.6);
  g.fillCircle(cx - 3, 51, 3);
}

/** 我心相印亭 — a small pavilion right at the water's edge. */
function xinxiangTing(g: G, w: number, h: number): void {
  const base = h - 24;
  g.fillStyle(0xb8ae9b, 1);
  g.fillRect(14, base, w - 28, 22);
  g.fillStyle(0x9a9080, 1);
  g.fillRect(14, base + 16, w - 28, 6);
  const pillars = [44, 92, w - 92, w - 44];
  for (const x of pillars) {
    g.fillStyle(0x7e2f24, 1);
    g.fillRect(x - 6, 98, 12, base - 98);
    g.fillStyle(0x9b4335, 1);
    g.fillRect(x - 6, 98, 4, base - 98);
  }
  g.lineStyle(4, 0x7e2f24, 1);
  g.lineBetween(30, base - 30, w - 30, base - 30);
  g.lineStyle(2, 0x7e2f24, 1);
  for (let x = 36; x < w - 30; x += 12) g.lineBetween(x, base - 30, x, base);
  g.fillStyle(0x5a2a22, 1);
  g.fillRect(28, 90, w - 56, 12);
  // plaque
  g.fillStyle(0x2f3b3a, 1);
  g.fillRect(w / 2 - 28, 104, 56, 18);
  g.fillStyle(0xd9b45a, 1);
  for (let i = 0; i < 4; i++) g.fillRect(w / 2 - 22 + i * 12, 109, 7, 8);
  // hip roof
  const pts = [
    ...quad(2, 74, 50, 102, w / 2, 96, 14),
    ...quad(w / 2, 96, w - 50, 102, w - 2, 74, 14),
    ...quad(w - 2, 74, w - 40, 70, w / 2 + 34, 30, 10),
    ...quad(w / 2 - 34, 30, 40, 70, 2, 74, 10),
  ];
  g.fillStyle(0x3c4246, 1);
  g.fillPoints(pts, true);
  g.lineStyle(1.5, 0x59636a, 0.8);
  for (let i = -5; i <= 5; i++) g.lineBetween(w / 2 + i * 6, 34, w / 2 + i * 19, 94);
  g.fillStyle(0x2a2f33, 1);
  g.fillRect(w / 2 - 36, 26, 72, 8);
  g.fillCircle(w / 2, 20, 7);
}

function canopyTree(g: G, w: number, h: number, seed: number, trunkH: number, palette: number[]): void {
  const r = rng(seed);
  const cx = w / 2;
  g.fillStyle(0x4e3b2e, 1);
  g.fillPoints([V(cx - 10, h), V(cx - 5, h - trunkH), V(cx + 5, h - trunkH), V(cx + 12, h)], true);
  g.lineStyle(5, 0x4e3b2e, 1);
  g.lineBetween(cx - 3, h - trunkH * 0.7, cx - w * 0.22, h - trunkH * 1.1);
  g.lineBetween(cx + 2, h - trunkH * 0.8, cx + w * 0.2, h - trunkH * 1.15);
  const top = h - trunkH;
  const n = Math.round(w / 6);
  for (let i = 0; i < n; i++) {
    const a = Math.PI + r() * Math.PI;
    const d = Math.sqrt(r());
    const x = cx + Math.cos(a) * d * w * 0.4;
    const y = top - Math.sin(a) * d * (top - 10) * 0.82;
    const rad = w * (0.07 + r() * 0.08);
    // evening sun from the west (left): lighter on the left
    const lightSide = x < cx ? 1 : 0;
    g.fillStyle(palette[Math.min(palette.length - 1, Math.floor(r() * 3) + lightSide)], 0.9);
    g.fillCircle(x, y, rad);
  }
  for (let i = 0; i < 10; i++) {
    g.fillStyle(0xd9c27a, 0.18);
    g.fillCircle(cx - w * 0.25 + r() * w * 0.2, top * 0.35 + r() * top * 0.4, w * 0.05);
  }
}

function pine(g: G, w: number, h: number, seed: number): void {
  const r = rng(seed);
  const cx = w / 2;
  g.lineStyle(7, 0x4a3628, 1);
  strokeCurve(g, quad(cx + 4, h, cx - 8, h * 0.5, cx + 2, 16));
  for (let i = 0; i < 7; i++) {
    const y = 24 + i * (h * 0.62) / 7 + r() * 8;
    const side = i % 2 === 0 ? -1 : 1;
    const len = w * (0.22 + r() * 0.2);
    g.lineStyle(3, 0x4a3628, 1);
    g.lineBetween(cx, y + 10, cx + side * len * 0.8, y + 4);
    g.fillStyle(0x2f4a30, 1);
    g.fillEllipse(cx + side * len * 0.55, y, len * 1.3, 18 + r() * 8);
    g.fillStyle(0x45663f, 0.9);
    g.fillEllipse(cx + side * len * 0.5 - 4, y - 4, len * 0.9, 10);
  }
  g.fillStyle(0x2f4a30, 1);
  g.fillEllipse(cx + 2, 18, 40, 22);
}

function darkWillow(g: G, w: number, h: number, seed: number): void {
  const r = rng(seed);
  const cx = w / 2;
  g.lineStyle(7, 0x4e3b2e, 1);
  strokeCurve(g, quad(cx, h, cx - 6, h * 0.55, cx + 4, h * 0.25));
  for (let i = 0; i < 16; i++) {
    g.fillStyle(r() > 0.5 ? 0x5c7c45 : 0x6f8f4f, 0.45);
    g.fillCircle(cx + (r() - 0.5) * w * 0.6, h * 0.2 + r() * h * 0.12, 20 + r() * 16);
  }
  for (let i = 0; i < 34; i++) {
    const x0 = cx + (r() - 0.5) * w * 0.8;
    const y0 = h * 0.12 + r() * h * 0.18;
    const len = h * (0.35 + r() * 0.35);
    g.lineStyle(1.6, r() > 0.5 ? 0x5c7c45 : 0x7d9b58, 0.8);
    strokeCurve(g, quad(x0, y0, x0 + (r() - 0.5) * 16, y0 + len * 0.5, x0 + (r() - 0.5) * 24, y0 + len, 10));
  }
}

function zigBridge(g: G, w: number, h: number): void {
  g.fillStyle(0xd9d2c3, 1);
  g.fillRect(0, h - 18, w, 8);
  g.fillStyle(0xb9b0a0, 1);
  g.fillRect(0, h - 10, w, 4);
  g.lineStyle(3, 0xeee8dc, 1);
  g.lineBetween(0, h - 40, w, h - 40);
  for (let x = 6; x < w; x += 24) {
    g.fillStyle(0xeee8dc, 1);
    g.fillRect(x - 3, h - 44, 6, 28);
  }
  for (let x = 30; x < w; x += 48) {
    g.fillStyle(0x7d9aa6, 1);
    g.fillRect(x - 6, h - 6, 12, 6);
  }
}

/** First-person view of our little rowing boat's bow and an oar. */
function boatBow(g: G, w: number, h: number): void {
  const cx = w / 2;
  g.fillStyle(0x4a3324, 1);
  g.fillPoints([V(cx - 300, h), V(cx + 300, h), V(cx + 26, 18), V(cx - 26, 18)], true);
  g.fillStyle(0x6b4a33, 1);
  g.fillPoints([V(cx - 250, h), V(cx + 250, h), V(cx + 18, 30), V(cx - 18, 30)], true);
  g.lineStyle(2, 0x553a28, 1);
  for (let i = -4; i <= 4; i++) g.lineBetween(cx + i * 56, h, cx + i * 3, 34);
  g.lineStyle(6, 0x8a6446, 1);
  g.lineBetween(cx - 300, h, cx - 26, 18);
  g.lineBetween(cx + 300, h, cx + 26, 18);
  g.fillStyle(0x3a281c, 1);
  g.fillRoundedRect(cx - 10, 4, 20, 26, 5);
  // oar
  g.lineStyle(10, 0x8a6446, 1);
  g.lineBetween(w - 250, h + 10, w - 60, 40);
  g.fillStyle(0x7a5638, 1);
  g.fillEllipse(w - 50, 26, 34, 70);
}

function egret(g: G, up: boolean): void {
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(22, 14, 22, 8);
  g.fillCircle(33, 11, 3.5);
  g.lineStyle(1.5, 0xe8b13a, 1);
  g.lineBetween(36, 11, 42, 12);
  g.lineStyle(1.5, 0x333333, 1);
  g.lineBetween(12, 15, 4, 16);
  g.fillStyle(0xf4f4f4, 1);
  if (up) g.fillTriangle(16, 12, 28, 12, 18, 0);
  else g.fillTriangle(16, 14, 28, 14, 20, 26);
}

// ---------------------------------------------------------------------------
// The dream banknote's picture, in an engraving style. Its three thirds match
// the three "local views" the player has to find (石塔 / 远山 / 树木).
// ---------------------------------------------------------------------------
export const VIGNETTE_W = 660;
export const VIGNETTE_H = 220;

/**
 * A stone pagoda in engraving style, proportioned like the real ones:
 * 塔基 → 球形塔身 (round openings) → 宝盖 → 六角小亭 → 小宝盖 → 葫芦顶.
 * `h` is the height from the waterline to the tip.
 */
function inkPagoda(g: G, x: number, baseY: number, h: number, ink: number, mid: number, reflection = true): void {
  const y = (f: number) => baseY - h * f;
  const w = (f: number) => h * f;
  if (reflection) {
    // a soft, broken reflection under the pagoda
    for (let i = 1; i < 10; i++) {
      g.lineStyle(1.2, mid, 0.5 - i * 0.045);
      const ww = w(0.2) * (1 - i * 0.05);
      g.lineBetween(x - ww / 2, baseY + i * h * 0.045, x + ww / 2, baseY + i * h * 0.045);
    }
  }
  g.fillStyle(mid, 1);
  g.fillEllipse(x, baseY, w(0.3), w(0.06)); // base disc on the water
  g.fillRect(x - w(0.045), y(0.2), w(0.09), w(0.2)); // pillar
  g.fillCircle(x, y(0.41), w(0.186)); // ball-shaped body
  g.lineStyle(Math.max(1, h * 0.008), ink, 0.9);
  g.strokeCircle(x, y(0.41), w(0.186));
  g.fillStyle(ink, 1);
  g.fillCircle(x, y(0.41), w(0.04)); // round openings
  g.fillEllipse(x - w(0.115), y(0.41), w(0.032), w(0.075));
  g.fillEllipse(x + w(0.115), y(0.41), w(0.032), w(0.075));
  g.fillStyle(mid, 1);
  g.fillRect(x - w(0.06), y(0.64), w(0.12), w(0.05)); // collar
  g.fillStyle(ink, 1);
  g.fillPoints([V(x - w(0.2), y(0.66)), V(x + w(0.2), y(0.66)), V(x + w(0.13), y(0.69)), V(x - w(0.13), y(0.69))], true); // 宝盖
  g.fillStyle(mid, 1);
  g.fillRect(x - w(0.062), y(0.78), w(0.124), w(0.09)); // 六角小亭
  g.fillStyle(ink, 1);
  g.fillRect(x - w(0.035), y(0.76), w(0.025), w(0.05));
  g.fillRect(x + w(0.01), y(0.76), w(0.025), w(0.05));
  g.fillPoints([V(x - w(0.12), y(0.78)), V(x + w(0.12), y(0.78)), V(x + w(0.05), y(0.83)), V(x - w(0.05), y(0.83))], true); // 小宝盖
  g.fillStyle(mid, 1);
  g.fillCircle(x, y(0.87), w(0.04)); // 葫芦顶
  g.fillCircle(x, y(0.93), w(0.028));
  g.fillStyle(ink, 1);
  g.fillTriangle(x - w(0.008), y(0.95), x + w(0.008), y(0.95), x, y(1));
}

/**
 * The note's picture, following the real one-yuan composition: a big pagoda
 * close on the left, a small far one in the middle, a medium one on the right,
 * a tree-lined shore behind on the left and a slender pagoda on the far hills
 * to the right. Each third is one of the photos the player takes
 * (近塔 / 双塔 / 远景).
 */
function vignette(g: G): void {
  const w = VIGNETTE_W;
  const h = VIGNETTE_H;
  const paper = 0xdfe7cf;
  const ink = 0x34503a;
  const mid = 0x6f8a5d;
  const light = 0xa9bd93;
  const pale = 0xc3d1ae;
  const horizon = 132; // matches the horizon's place in the photo frame
  g.fillStyle(paper, 1);
  g.fillRect(0, 0, w, h);

  // sky hatching
  for (let yy = 4; yy < horizon - 30; yy += 4) {
    g.lineStyle(1, light, 0.45 - yy / 320);
    g.lineBetween(0, yy, w, yy);
  }

  // far hills on the right, with the slender pagoda
  const farRidge = (x: number) => horizon - 12 - 16 * Math.exp(-(((x - w * 0.8) / 70) ** 2)) - 6 * Math.sin(x * 0.03);
  const far: Phaser.Math.Vector2[] = [V(w * 0.45, horizon)];
  for (let x = w * 0.45; x <= w; x += 6) far.push(V(x, farRidge(x)));
  far.push(V(w, horizon));
  g.fillStyle(pale, 1);
  g.fillPoints(far, true);
  tinyPagoda(g, w * 0.8, farRidge(w * 0.8) + 2, 30, mid, 1);

  // a gentle hill behind on the left
  const hill: Phaser.Math.Vector2[] = [V(0, horizon)];
  for (let x = 0; x <= w * 0.62; x += 6) hill.push(V(x, horizon - 20 - 34 * Math.exp(-(((x - w * 0.24) / 110) ** 2)) - 4 * Math.sin(x * 0.05)));
  hill.push(V(w * 0.62, horizon));
  g.fillStyle(light, 1);
  g.fillPoints(hill, true);

  // tree-lined shore across the left two-thirds
  g.fillStyle(mid, 1);
  for (let x = 0; x < w * 0.72; x += 9) {
    const top = 10 + 8 * Math.abs(Math.sin(x * 0.07)) + 6 * Math.abs(Math.sin(x * 0.023));
    g.fillCircle(x, horizon - top * 0.6, top * 0.7);
  }
  g.fillRect(0, horizon - 6, w * 0.72, 6);
  // low shore on the right
  g.fillStyle(light, 1);
  g.fillRect(w * 0.7, horizon - 4, w * 0.3, 4);

  // water
  g.fillStyle(0xcfdabd, 1);
  g.fillRect(0, horizon, w, h - horizon);
  for (let yy = horizon + 3; yy < h; yy += 3) {
    g.lineStyle(1, mid, 0.22 + ((yy - horizon) / (h - horizon)) * 0.45);
    g.lineBetween(0, yy, w, yy);
  }

  // the three stone pagodas
  inkPagoda(g, w * 0.45, 142, 0.17 * h, ink, mid); // middle: small and far
  inkPagoda(g, w * 0.6, 151, 0.32 * h, ink, mid); // right: medium
  inkPagoda(g, w * 0.2, 169, 0.62 * h, ink, mid); // left: big and close

  // engraving texture
  for (let yy = 1; yy < h; yy += 3) {
    g.lineStyle(1, paper, 0.26);
    g.lineBetween(0, yy, w, yy);
  }
  g.lineStyle(2, ink, 1);
  g.strokeRect(1, 1, w - 2, h - 2);
}

export function generateSantanTextures(scene: Phaser.Scene): void {
  bake(scene, 'santanPagoda', PAGODA_W, PAGODA_H, (g) => stonePagoda(g, false));
  bake(scene, 'santanPagodaLit', PAGODA_W, PAGODA_H, (g) => stonePagoda(g, true));
  bake(scene, 'xinxiangTing', 240, 200, (g) => xinxiangTing(g, 240, 200));
  bake(scene, 'treeCamphor', 320, 300, (g) => canopyTree(g, 320, 300, 3, 90, [0x46663a, 0x587d43, 0x6f9450, 0x8fae63]));
  bake(scene, 'treeRound', 200, 220, (g) => canopyTree(g, 200, 220, 5, 60, [0x4a6b3c, 0x5b7e45, 0x739551, 0x8daa60]));
  bake(scene, 'treePine', 160, 340, (g) => pine(g, 160, 340, 7));
  bake(scene, 'treePine2', 140, 260, (g) => pine(g, 140, 260, 9));
  bake(scene, 'treeWillowDark', 200, 240, (g) => darkWillow(g, 200, 240, 11));
  bake(scene, 'zigBridge', 240, 60, (g) => zigBridge(g, 240, 60));
  bake(scene, 'boatBow', 1280, 190, (g) => boatBow(g, 1280, 190));
  bake(scene, 'egret1', 44, 28, (g) => egret(g, true));
  bake(scene, 'egret2', 44, 28, (g) => egret(g, false));
  bake(scene, 'noteVignette', VIGNETTE_W, VIGNETTE_H, (g) => vignette(g));
}

// ---------------------------------------------------------------------------
// The dream one-yuan note. Deliberately NOT a reproduction of real currency:
// no bank name, emblem, serial number or real design — a dream prop.
// ---------------------------------------------------------------------------
export const NOTE_W = 980;
export const NOTE_H = 460;

/** Builds the note centred on (x, y). The vignette sits at local (0, 0). */
export function createDreamNote(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const hw = NOTE_W / 2;
  const hh = NOTE_H / 2;
  const base = 0xc9d6b4;
  const ink = 0x4f6b47;

  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(-hw + 8, -hh + 12, NOTE_W, NOTE_H, 18);
  g.fillStyle(base, 1);
  g.fillRoundedRect(-hw, -hh, NOTE_W, NOTE_H, 18);
  g.lineStyle(3, ink, 0.9);
  g.strokeRoundedRect(-hw + 14, -hh + 14, NOTE_W - 28, NOTE_H - 28, 12);
  g.lineStyle(1, ink, 0.7);
  g.strokeRoundedRect(-hw + 22, -hh + 22, NOTE_W - 44, NOTE_H - 44, 9);

  // guilloche wave bands, top and bottom
  for (const [y0, y1] of [[-hh + 28, -hh + 92], [hh - 92, hh - 28]]) {
    for (let k = 0; k < 9; k++) {
      const pts: Phaser.Math.Vector2[] = [];
      for (let xx = -hw + 30; xx <= hw - 30; xx += 4) {
        const mid = (y0 + y1) / 2;
        pts.push(V(xx, mid + Math.sin(xx * 0.06 + k * 0.7) * (y1 - y0) * 0.32 * Math.cos(xx * 0.004 + k)));
      }
      g.lineStyle(1, ink, 0.35);
      g.strokePoints(pts, false, false);
    }
  }
  // rosettes (spirograph) left and right
  for (const rx of [-hw + 120, hw - 120]) {
    for (let layer = 0; layer < 3; layer++) {
      const pts: Phaser.Math.Vector2[] = [];
      for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.02) {
        const r = 62 - layer * 14 + 12 * Math.sin(9 * t + layer);
        pts.push(V(rx + Math.cos(t) * r, Math.sin(t) * r));
      }
      g.lineStyle(1.2, ink, 0.55);
      g.strokePoints(pts, true, false);
    }
  }
  c.add(g);

  const vig = scene.add.image(0, 0, 'noteVignette');
  c.add(vig);

  const txt = (tx: number, ty: number, s: string, size: number, extra: Phaser.Types.GameObjects.Text.TextStyle = {}) => {
    const t = scene.add
      .text(tx, ty, s, { fontFamily: FONT_SERIF, fontSize: `${size}px`, color: '#3f5a3a', resolution: TEXT_RES, ...extra })
      .setOrigin(0.5);
    c.add(t);
    return t;
  };
  txt(-hw + 120, 0, '梦', 64, { fontStyle: 'bold' });
  txt(hw - 120, -6, '1', 72, { fontStyle: 'bold' });
  txt(hw - 120, 46, '壹圆', 22);
  txt(0, -hh + 60, '西湖 · 三潭印月', 26, { backgroundColor: '#c9d6b4', padding: { x: 14, y: 2 } });
  txt(0, hh - 60, '梦 里 的 一 块 钱  ·  A ONE-YUAN NOTE FROM A DREAM', 18, { backgroundColor: '#c9d6b4', padding: { x: 12, y: 2 } });

  c.setScale(scale);
  return c;
}

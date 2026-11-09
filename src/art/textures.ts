import * as Phaser from 'phaser';
import { C } from '../core/config';
import { lerpColor, petal, quad, rng, strokeCurve } from './paint';

type G = Phaser.GameObjects.Graphics;

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function stem(g: G, x0: number, y0: number, x1: number, y1: number, bend: number, width = 4): void {
  g.lineStyle(width, 0x5d8c48, 1);
  strokeCurve(g, quad(x0, y0, (x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1));
  g.lineStyle(1.2, 0x86b064, 0.7);
  strokeCurve(g, quad(x0 - 1, y0, (x0 + x1) / 2 + bend - 1, (y0 + y1) / 2, x1 - 1, y1));
}

/** Lotus leaf standing on a stem, seen from the side (a shallow green parasol). */
function leaf(g: G, w: number, h: number, rx: number, ry: number, tilt: number, seed: number): void {
  const r = rng(seed);
  const cx = w / 2;
  const cy = h - (h - ry * 2 - 10);
  const headY = cy + 6;
  stem(g, cx + (r() - 0.5) * 10, h, cx, headY + ry * 0.5, (r() - 0.5) * 20);
  // underside (darker), slightly lower
  g.fillStyle(C.leafDark, 1);
  g.fillEllipse(cx, headY + ry * 0.35, rx * 2, ry * 1.6);
  // top surface
  g.fillStyle(C.leaf, 1);
  g.fillEllipse(cx + tilt, headY, rx * 1.94, ry * 1.25);
  g.fillStyle(C.leafLight, 0.55);
  g.fillEllipse(cx + tilt - rx * 0.18, headY - ry * 0.18, rx * 1.2, ry * 0.6);
  // veins radiating from the centre
  g.lineStyle(1.2, 0x2f5f2c, 0.35);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.lineBetween(cx + tilt, headY, cx + tilt + Math.cos(a) * rx * 0.93, headY + Math.sin(a) * ry * 0.6);
  }
  g.fillStyle(0x9cc77f, 0.9);
  g.fillCircle(cx + tilt, headY, 3);
  // rim highlight
  g.lineStyle(1.5, 0xa9d38d, 0.5);
  g.strokeEllipse(cx + tilt, headY, rx * 1.94, ry * 1.25);
}

/** Lotus blossom on a stem. openness: 0 = bud, 0.5 = just opening (初绽), 1 = full bloom. */
function blossom(g: G, w: number, h: number, openness: number, seed: number): void {
  const r = rng(seed);
  const cx = w / 2;
  const headY = 62;
  stem(g, cx + (r() - 0.5) * 8, h, cx, headY + 18, (r() - 0.5) * 18, 3.5);

  if (openness <= 0.05) {
    // bud: a closed teardrop
    const pts = petal(cx, headY + 26, 56, 17, 0, 16);
    g.fillStyle(C.lotusPale, 1);
    g.fillPoints(pts, true);
    g.fillStyle(C.lotus, 0.9);
    g.fillPoints(petal(cx, headY + 2, 30, 10, 0, 12), true);
    g.fillStyle(C.lotusDeep, 0.9);
    g.fillPoints(petal(cx, headY - 14, 14, 5, 0, 8), true);
    g.lineStyle(1, C.lotusDeep, 0.5);
    g.lineBetween(cx, headY + 26, cx, headY - 28);
    // sepals
    g.fillStyle(0x6e9c52, 1);
    g.fillPoints(petal(cx - 2, headY + 28, 14, 6, -0.9, 8), true);
    g.fillPoints(petal(cx + 2, headY + 28, 14, 6, 0.9, 8), true);
    return;
  }

  const spread = 0.35 + openness * 0.9; // radians for outermost petals
  const len = 44 + openness * 6;
  const baseY = headY + 24;

  const drawPetal = (angle: number, l: number, wdt: number, shade: number) => {
    const pts = petal(cx, baseY, l, wdt, angle, 14);
    g.fillStyle(lerpColor(C.lotusPale, 0xf7c9d8, shade), 1);
    g.fillPoints(pts, true);
    // pink tips
    const sx = Math.sin(angle);
    const cy2 = Math.cos(angle);
    g.fillStyle(C.lotus, 0.85);
    g.fillPoints(petal(cx + sx * l * 0.45, baseY - cy2 * l * 0.45, l * 0.55, wdt * 0.8, angle, 10), true);
    g.fillStyle(C.lotusDeep, 0.7);
    g.fillPoints(petal(cx + sx * l * 0.72, baseY - cy2 * l * 0.72, l * 0.28, wdt * 0.5, angle, 8), true);
    g.lineStyle(1, C.lotusDeep, 0.35);
    g.lineBetween(cx + sx * 6, baseY - cy2 * 6, cx + sx * l * 0.9, baseY - cy2 * l * 0.9);
  };

  // back petals
  for (const a of [-0.55, -0.18, 0.18, 0.55]) drawPetal(a * spread, len * 0.92, 15, 0.3);
  // seed pod peeking in full bloom
  if (openness > 0.7) {
    g.fillStyle(0xe8d35a, 1);
    g.fillEllipse(cx, baseY - 26, 26, 12);
    g.fillStyle(0xc9b23c, 1);
    for (let i = -2; i <= 2; i++) g.fillCircle(cx + i * 4.5, baseY - 27, 1.4);
  }
  // front petals
  for (const a of [-1, -0.5, 0, 0.5, 1]) drawPetal(a * spread, len, 16, 0.6);
  // sepals
  g.fillStyle(0x6e9c52, 1);
  g.fillPoints(petal(cx - 3, baseY + 2, 16, 6, -1.1, 8), true);
  g.fillPoints(petal(cx + 3, baseY + 2, 16, 6, 1.1, 8), true);
}

/** A weeping willow (柳) — West Lake's signature tree. */
function willow(g: G, w: number, h: number, seed: number): void {
  const r = rng(seed);
  const tx = w / 2;
  // trunk
  g.fillStyle(0x5e4a3a, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(tx - 12, h),
      new Phaser.Math.Vector2(tx - 6, h * 0.55),
      new Phaser.Math.Vector2(tx - 18, h * 0.3),
      new Phaser.Math.Vector2(tx - 10, h * 0.29),
      new Phaser.Math.Vector2(tx + 2, h * 0.45),
      new Phaser.Math.Vector2(tx + 16, h * 0.28),
      new Phaser.Math.Vector2(tx + 22, h * 0.3),
      new Phaser.Math.Vector2(tx + 8, h * 0.56),
      new Phaser.Math.Vector2(tx + 12, h),
    ],
    true,
  );
  // soft crown
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI;
    const d = r() * w * 0.36;
    g.fillStyle(r() > 0.5 ? 0x8fbf6a : 0x76a957, 0.35);
    g.fillCircle(tx + Math.cos(a) * d * 1.3 - d * 0.1, h * 0.24 - Math.sin(a) * d * 0.45, 22 + r() * 18);
  }
  // hanging fronds
  for (let i = 0; i < 46; i++) {
    const x0 = tx + (r() - 0.5) * w * 0.8;
    const y0 = h * 0.12 + r() * h * 0.2;
    const len = h * (0.3 + r() * 0.42);
    const sway = (r() - 0.5) * 22;
    g.lineStyle(1.6 + r() * 1.4, r() > 0.5 ? 0x6fa24f : 0x8cbc63, 0.75);
    strokeCurve(g, quad(x0, y0, x0 + sway, y0 + len * 0.5, x0 + sway * 1.6, y0 + len, 12));
  }
}

/** Peach tree in blossom — Su Causeway is famous for "one willow, one peach". */
function peach(g: G, w: number, h: number, seed: number): void {
  const r = rng(seed);
  const tx = w / 2;
  g.lineStyle(8, 0x6b4f3f, 1);
  g.lineBetween(tx, h, tx - 4, h * 0.45);
  g.lineStyle(4, 0x6b4f3f, 1);
  g.lineBetween(tx - 3, h * 0.6, tx - 30, h * 0.35);
  g.lineBetween(tx - 3, h * 0.55, tx + 28, h * 0.32);
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * w * 0.42;
    g.fillStyle([0xf7b6c8, 0xf28fb0, 0xfbd3de][i % 3], 0.75);
    g.fillCircle(tx + Math.cos(a) * d, h * 0.32 + Math.sin(a) * d * 0.55, 9 + r() * 9);
  }
}

function cloud(g: G, w: number, h: number, seed: number): void {
  const r = rng(seed);
  for (let i = 0; i < 12; i++) {
    g.fillStyle(0xffffff, 0.22 + r() * 0.18);
    g.fillEllipse(w * (0.15 + r() * 0.7), h * (0.45 + (r() - 0.5) * 0.4), 60 + r() * 90, 26 + r() * 30);
  }
}

function pavilion(g: G, w: number, h: number): void {
  const cx = w / 2;
  const floorY = h - 40;
  // stone platform
  g.fillStyle(0xbfb6a6, 1);
  g.fillRect(20, floorY, w - 40, 26);
  g.fillStyle(0xa79d8c, 1);
  g.fillRect(20, floorY + 22, w - 40, 6);
  g.lineStyle(1, 0x8e8474, 0.6);
  for (let x = 40; x < w - 30; x += 46) g.lineBetween(x, floorY, x, floorY + 26);
  // steps
  g.fillStyle(0xcfc8bb, 1);
  g.fillRect(cx - 50, floorY + 26, 100, 10);
  g.fillRect(cx - 62, floorY + 34, 124, 6);
  // pillars
  const pillarTop = 150;
  const pillars = [64, cx - 62, cx + 62, w - 64];
  for (const px of pillars) {
    g.fillStyle(C.wood, 1);
    g.fillRect(px - 9, pillarTop, 18, floorY - pillarTop);
    g.fillStyle(0xa85646, 1);
    g.fillRect(px - 9, pillarTop, 5, floorY - pillarTop);
  }
  // bench rails (美人靠)
  g.lineStyle(5, C.wood, 1);
  g.lineBetween(64, floorY - 50, cx - 62, floorY - 50);
  g.lineBetween(cx + 62, floorY - 50, w - 64, floorY - 50);
  g.lineStyle(2, C.wood, 1);
  for (let x = 74; x < cx - 62; x += 14) g.lineBetween(x, floorY - 50, x - 6, floorY);
  for (let x = cx + 72; x < w - 64; x += 14) g.lineBetween(x, floorY - 50, x + 6, floorY);
  // lintel with painted band
  g.fillStyle(0x6f2e24, 1);
  g.fillRect(48, pillarTop - 8, w - 96, 18);
  g.fillStyle(0x3f7a74, 1);
  g.fillRect(56, pillarTop - 4, w - 112, 8);
  g.fillStyle(0xd9b45a, 1);
  for (let x = 70; x < w - 70; x += 36) g.fillCircle(x, pillarTop, 2.5);
  // roof with upturned eaves (飞檐)
  const roofBase = pillarTop - 8;
  const pts = [
    ...quad(4, roofBase - 40, 60, roofBase + 6, cx, roofBase - 2, 18),
    ...quad(cx, roofBase - 2, w - 60, roofBase + 6, w - 4, roofBase - 40, 18),
    ...quad(w - 4, roofBase - 40, w - 70, roofBase - 30, cx + 40, 38, 14),
    ...quad(cx - 40, 38, 70, roofBase - 30, 4, roofBase - 40, 14),
  ];
  g.fillStyle(C.roof, 1);
  g.fillPoints(pts, true);
  // roof tiles
  g.lineStyle(1.5, 0x56656b, 0.8);
  for (let i = -6; i <= 6; i++) {
    const x = cx + i * 24;
    g.lineBetween(cx + i * 6, 44, x, roofBase - 6 + Math.abs(i) * -2);
  }
  // ridge and finial
  g.fillStyle(0x2b3438, 1);
  g.fillRect(cx - 44, 32, 88, 10);
  g.fillCircle(cx, 24, 9);
  g.fillTriangle(cx - 4, 18, cx + 4, 18, cx, 2);
  // eave tips
  g.fillStyle(0x2b3438, 1);
  g.fillTriangle(0, roofBase - 44, 18, roofBase - 30, 6, roofBase - 30);
  g.fillTriangle(w, roofBase - 44, w - 18, roofBase - 30, w - 6, roofBase - 30);
}

function stele(g: G, w: number, h: number): void {
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(w / 2, h - 6, w * 0.9, 14);
  g.fillStyle(0x9b958a, 1);
  g.fillRect(8, h - 30, w - 16, 24);
  g.fillStyle(0xb9b2a5, 1);
  g.fillRoundedRect(18, 8, w - 36, h - 36, 10);
  g.fillStyle(0xa7a093, 1);
  g.fillRoundedRect(26, 18, w - 52, h - 56, 6);
}

function sparkle(g: G, s: number): void {
  const c = s / 2;
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(c, 0, c - 3, c, c + 3, c);
  g.fillTriangle(c, s, c - 3, c, c + 3, c);
  g.fillTriangle(0, c, c, c - 3, c, c + 3);
  g.fillTriangle(s, c, c, c - 3, c, c + 3);
  g.fillCircle(c, c, 3);
}

function ripples(g: G, w: number, h: number): void {
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = r() * h;
    const l = 14 + r() * 40;
    g.lineStyle(2, 0xffffff, 0.18 + r() * 0.22);
    g.lineBetween(x, y, x + l, y);
  }
}

function pathTile(g: G, w: number, h: number): void {
  g.fillStyle(C.path, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(C.pathEdge, 1);
  g.fillRect(0, 0, w, 8);
  g.fillStyle(0xc8bb9f, 1);
  g.fillRect(0, h - 10, w, 10);
  g.lineStyle(1.5, 0xc2b394, 0.9);
  for (let x = 0; x < w; x += 64) g.lineBetween(x, 8, x - 18, h - 10);
  g.lineBetween(0, h / 2 + 2, w, h / 2 + 2);
  const r = rng(3);
  for (let i = 0; i < 30; i++) {
    g.fillStyle(0xb9aa8d, 0.5);
    g.fillCircle(r() * w, 12 + r() * (h - 24), 1 + r() * 1.5);
  }
}

function backpack(g: G, w: number, h: number): void {
  g.fillStyle(0x2e6f8e, 1);
  g.fillRoundedRect(4, 10, w - 8, h - 12, 12);
  g.fillStyle(0x245a74, 1);
  g.fillRoundedRect(10, h * 0.5, w - 20, h * 0.4, 8);
  g.lineStyle(4, 0x1d4a60, 1);
  g.strokeEllipse(w / 2, 10, w * 0.5, 14);
  g.fillStyle(0xf2c14e, 1);
  g.fillCircle(w / 2, h * 0.68, 4);
}

/** Generate every procedural texture used by the game. Called once from BootScene. */
export function generateTextures(scene: Phaser.Scene): void {
  bake(scene, 'leaf1', 200, 220, (g) => leaf(g, 200, 220, 84, 24, 0, 1));
  bake(scene, 'leaf2', 180, 260, (g) => leaf(g, 180, 260, 72, 22, 6, 2));
  bake(scene, 'leaf3', 150, 180, (g) => leaf(g, 150, 180, 60, 18, -6, 3));
  bake(scene, 'leafFlat', 140, 40, (g) => {
    g.fillStyle(C.leafDark, 1);
    g.fillEllipse(70, 22, 132, 28);
    g.fillStyle(C.leaf, 1);
    g.fillEllipse(70, 19, 124, 22);
    g.lineStyle(1, 0x2f5f2c, 0.3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.lineBetween(70, 19, 70 + Math.cos(a) * 58, 19 + Math.sin(a) * 10);
    }
  });
  bake(scene, 'bud', 120, 230, (g) => blossom(g, 120, 230, 0, 11));
  bake(scene, 'bloomHalf', 140, 240, (g) => blossom(g, 140, 240, 0.45, 12));
  bake(scene, 'bloomFull', 160, 240, (g) => blossom(g, 160, 240, 1, 13));
  bake(scene, 'willow', 260, 360, (g) => willow(g, 260, 360, 21));
  bake(scene, 'willowSmall', 130, 160, (g) => willow(g, 130, 160, 22));
  bake(scene, 'peach', 180, 220, (g) => peach(g, 180, 220, 41));
  bake(scene, 'cloud', 300, 110, (g) => cloud(g, 300, 110, 31));
  bake(scene, 'pavilion', 440, 380, (g) => pavilion(g, 440, 380));
  bake(scene, 'stele', 120, 220, (g) => stele(g, 120, 220));
  bake(scene, 'sparkle', 22, 22, (g) => sparkle(g, 22));
  bake(scene, 'ripples', 512, 128, (g) => ripples(g, 512, 128));
  bake(scene, 'path', 256, 96, (g) => pathTile(g, 256, 96));
  bake(scene, 'backpack', 54, 64, (g) => backpack(g, 54, 64));
}

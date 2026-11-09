import * as Phaser from 'phaser';
import { FONT_SERIF, TEXT_RES } from '../core/config';
import { petal, rng } from '../art/paint';

type G = Phaser.GameObjects.Graphics;
const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Linear blend of two 0xRRGGBB colours. */
export function mix(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
}

export function generateSudiTextures(scene: Phaser.Scene): void {
  // a single peach petal
  bake(scene, 'sudiPetal', 20, 20, (g) => {
    g.fillStyle(0xf7a8c4, 1);
    g.fillPoints(petal(10, 18, 16, 6, 0, 10), true);
    g.fillStyle(0xfbd3e0, 1);
    g.fillPoints(petal(10, 16, 10, 3, 0, 8), true);
  });
  // a willow catkin (柳絮): a little white fluff
  bake(scene, 'sudiCatkin', 16, 16, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(8 + Math.cos(i) * 3, 8 + Math.sin(i * 1.7) * 3, 2.5);
    }
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(8, 8, 2);
  });
  // soft mist band (tileable horizontally)
  bake(scene, 'mistBand', 512, 120, (g) => {
    const r = rng(17);
    for (let i = 0; i < 60; i++) {
      const x = r() * 512;
      const y = 40 + r() * 40;
      const w = 80 + r() * 160;
      g.fillStyle(0xffffff, 0.05 + r() * 0.07);
      g.fillEllipse(x, y, w, 26 + r() * 30);
      g.fillEllipse(x - 512, y, w, 26 + r() * 30);
      g.fillEllipse(x + 512, y, w, 26 + r() * 30);
    }
  });
  // a little fish
  bake(scene, 'sudiFish', 30, 14, (g) => {
    g.fillStyle(0xe8873a, 1);
    g.fillEllipse(12, 7, 20, 9);
    g.fillTriangle(21, 7, 29, 2, 29, 12);
    g.fillStyle(0x222222, 1);
    g.fillCircle(6, 6, 1.3);
  });
  // a lantern on a pole (warm light in the pre-dawn)
  bake(scene, 'sudiLantern', 60, 200, (g) => {
    g.lineStyle(4, 0x3b2a20, 1);
    g.lineBetween(30, 200, 30, 40);
    g.lineBetween(30, 44, 46, 44);
    g.lineStyle(1.5, 0x3b2a20, 1);
    g.lineBetween(46, 44, 46, 56);
    g.fillStyle(0xd94b3a, 1);
    g.fillEllipse(46, 74, 26, 34);
    g.fillStyle(0xf28a5b, 1);
    g.fillEllipse(43, 72, 12, 26);
    g.fillStyle(0x2b2b2b, 1);
    g.fillRect(40, 56, 12, 4);
    g.fillRect(40, 89, 12, 4);
  });
  // a public-address loudspeaker on a pole
  bake(scene, 'sudiSpeaker', 80, 240, (g) => {
    g.fillStyle(0x6b7378, 1);
    g.fillRect(36, 40, 8, 200);
    g.fillStyle(0xdfe4e6, 1);
    g.fillPoints([V(40, 30), V(76, 14), V(76, 64), V(40, 48)], true);
    g.fillStyle(0xb8bfc2, 1);
    g.fillRect(30, 30, 12, 18);
  });
}

/**
 * The old man of the dream (never named): a long robe, a tall square
 * 东坡巾-style hat, a long grey beard and a wooden shovel.
 * phase 0 = bent down scooping, 1 = lifting and tossing.
 */
export function drawElder(g: G, phase: number): void {
  g.clear();
  const INK = 0x2a2420;
  const lift = phase;
  const bend = 1 - phase;
  // shadow
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(0, 2, 70, 10);
  const robe = 0x4a5a6a;
  const robeDark = 0x37444f;
  const robeLight = 0x6a7c8c;
  const hipY = -70;
  const shX = 6 + bend * 16;
  const shY = -118 + bend * 22;
  // cloth shoes peeking out under the robe
  for (const x of [-16, 10]) {
    g.fillStyle(INK, 1);
    g.fillRoundedRect(x - 1, -7, 18, 8, 3);
    g.fillStyle(0x2e2a26, 1);
    g.fillRoundedRect(x, -6, 16, 6, 2.6);
    g.fillStyle(0xe8e0d0, 1);
    g.fillRect(x, -1.6, 16, 1.4);
  }
  // robe: inked outline, then the cloth, shaded on the back, with folds
  const body = [V(-22, -4), V(24, -4), V(16, hipY), V(shX + 14, shY + 4), V(shX - 18, shY), V(-14, hipY)];
  g.lineStyle(3, INK, 0.9);
  g.strokePoints(body, true);
  g.fillStyle(robe, 1);
  g.fillPoints(body, true);
  g.fillStyle(robeDark, 1);
  g.fillPoints([V(-22, -4), V(-8, -4), V(-4, hipY), V(shX - 18, shY), V(-14, hipY)], true);
  g.lineStyle(1.6, robeDark, 1);
  g.lineBetween(4, -6, 8, hipY + 6);
  g.lineBetween(14, -6, 14, hipY + 4);
  g.lineStyle(1.4, robeLight, 0.8);
  g.lineBetween(-2, -6, 2, hipY + 4);
  // hem band
  g.fillStyle(0x3a4856, 1);
  g.fillRect(-22, -10, 46, 6);
  g.lineStyle(1, robeLight, 0.7);
  g.lineBetween(-22, -10, 24, -10);
  // a crossed white under-collar at the neck
  g.fillStyle(0xe8e0d0, 1);
  g.fillTriangle(shX - 6, shY + 2, shX + 6, shY + 2, shX + 2, shY + 16);
  g.lineStyle(1.2, INK, 0.6);
  g.lineBetween(shX - 6, shY + 2, shX + 2, shY + 16);
  // rope sash, knotted, with dangling ends
  g.fillStyle(INK, 0.8);
  g.fillRect(-15, hipY - 5, 34, 8);
  g.fillStyle(0x9a7a46, 1);
  g.fillRect(-14, hipY - 4, 32, 6);
  g.fillStyle(0x7a5a2e, 1);
  g.fillCircle(10, hipY - 1, 4);
  g.lineStyle(2.4, 0x9a7a46, 1);
  g.lineBetween(10, hipY + 2, 8, hipY + 20);
  g.lineBetween(12, hipY + 2, 14, hipY + 18);
  // head
  const hx = shX + 8 + bend * 8;
  const hy = shY - 18 + bend * 4;
  g.fillStyle(INK, 0.9);
  g.fillCircle(hx, hy, 13.4);
  g.fillStyle(0xe9c9a8, 1);
  g.fillCircle(hx, hy, 12);
  g.fillStyle(0xd8b090, 1);
  g.slice(hx, hy, 12, Math.PI * 0.55, Math.PI * 1.1, false);
  g.fillPath();
  // ear
  g.fillStyle(INK, 0.8);
  g.fillCircle(hx - 6, hy + 1, 3.6);
  g.fillStyle(0xe0b898, 1);
  g.fillCircle(hx - 6, hy + 1, 2.6);
  // long white beard and moustache, in strands
  g.fillStyle(INK, 0.6);
  g.fillTriangle(hx - 3.5, hy + 5, hx + 13.5, hy + 5, hx + 6, hy + 33);
  g.fillStyle(0xe8e4dc, 1);
  g.fillTriangle(hx - 2, hy + 6, hx + 12, hy + 6, hx + 6, hy + 30);
  g.lineStyle(1, 0xb8b2a8, 1);
  for (const dx of [1, 4, 7, 10]) g.lineBetween(hx + dx, hy + 8, hx + 6 + (dx - 6) * 0.3, hy + 27);
  g.fillStyle(0xf4f0e8, 1);
  g.fillEllipse(hx + 6, hy + 5, 14, 4);
  // eyebrow (white, bushy), a smiling eye, nose
  g.fillStyle(0xf0ece4, 1);
  g.fillEllipse(hx + 5, hy - 5, 8, 3);
  g.lineStyle(1.6, 0x333333, 1);
  g.beginPath();
  g.arc(hx + 6, hy - 0.5, 2.6, Math.PI * 1.1, Math.PI * 1.9, false);
  g.strokePath();
  g.fillStyle(0xd8a888, 1);
  g.fillCircle(hx + 11.5, hy + 2, 2);
  g.fillStyle(0xf09a8a, 0.4);
  g.fillCircle(hx + 3, hy + 3, 3);
  // tall square scholar's hat (东坡巾)
  g.fillStyle(INK, 1);
  g.fillRect(hx - 12.4, hy - 33.4, 24.8, 26.8);
  g.fillRect(hx - 14.4, hy - 13.4, 28.8, 7.8);
  g.fillStyle(0x24242c, 1);
  g.fillRect(hx - 11, hy - 32, 22, 24);
  g.fillStyle(0x34343e, 1);
  g.fillRect(hx - 11, hy - 32, 7, 24);
  g.fillStyle(0x1a1a20, 1);
  g.fillRect(hx - 13, hy - 12, 26, 5);
  g.fillStyle(0x2e2e36, 1);
  g.fillRect(hx - 7, hy - 36, 14, 6);
  g.lineStyle(1, 0x5a5a66, 0.8);
  g.lineBetween(hx, hy - 32, hx, hy - 12);
  // arms in wide sleeves, and the shovel
  const hand1 = { x: shX + 30 - bend * 4, y: shY + 22 - lift * 30 + bend * 26 };
  const hand2 = { x: shX + 10, y: shY + 30 - lift * 14 + bend * 20 };
  for (const [sx, sy, h] of [[shX - 6, shY + 10, hand2], [shX, shY + 6, hand1]] as const) {
    g.lineStyle(13, INK, 0.9);
    g.lineBetween(sx, sy, h.x, h.y);
    g.lineStyle(11, robe, 1);
    g.lineBetween(sx, sy, h.x, h.y);
    // the sleeve flares at the wrist
    g.fillStyle(INK, 0.9);
    g.fillCircle(h.x - (h.x - sx) * 0.12, h.y - (h.y - sy) * 0.12, 8);
    g.fillStyle(robeLight, 1);
    g.fillCircle(h.x - (h.x - sx) * 0.12, h.y - (h.y - sy) * 0.12, 6.6);
  }
  // shovel handle runs through both hands
  const dx = hand1.x - hand2.x;
  const dy = hand1.y - hand2.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tipX = hand1.x + ux * 52;
  const tipY = hand1.y + uy * 52;
  g.lineStyle(6, INK, 0.9);
  g.lineBetween(hand2.x - ux * 14, hand2.y - uy * 14, tipX, tipY);
  g.lineStyle(4, 0x9a7050, 1);
  g.lineBetween(hand2.x - ux * 14, hand2.y - uy * 14, tipX, tipY);
  const blade = [V(tipX - uy * 10, tipY + ux * 10), V(tipX + uy * 10, tipY - ux * 10), V(tipX + ux * 22 + uy * 7, tipY + uy * 22 - ux * 7), V(tipX + ux * 22 - uy * 7, tipY + uy * 22 + ux * 7)];
  g.lineStyle(2.4, INK, 0.9);
  g.strokePoints(blade, true);
  g.fillStyle(0x8a9294, 1);
  g.fillPoints(blade, true);
  g.lineStyle(1.4, 0xc8ced0, 0.8);
  g.lineBetween(tipX - uy * 8, tipY + ux * 8, tipX + ux * 18 - uy * 5, tipY + uy * 18 + ux * 5);
  for (const h of [hand1, hand2]) {
    g.fillStyle(INK, 0.9);
    g.fillCircle(h.x, h.y, 5.2);
    g.fillStyle(0xe9c9a8, 1);
    g.fillCircle(h.x, h.y, 4);
  }
  if (lift > 0.5) {
    // mud on the shovel
    g.fillStyle(0x4a3a28, 1);
    g.fillCircle(tipX + ux * 12, tipY + uy * 12 - 3, 7.6);
    g.fillStyle(0x6a5440, 1);
    g.fillCircle(tipX + ux * 10, tipY + uy * 10 - 5, 3);
  }
}

/** A red seal (印章) with a name in white, like a stamp on a scroll. */
export function makeSeal(scene: Phaser.Scene, x: number, y: number, text: string, size = 56): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0xb8322a, 1);
  g.fillRoundedRect(-size / 2, -size / 2, size, size, size * 0.12);
  g.lineStyle(Math.max(1.5, size * 0.04), 0xf6e3d6, 0.9);
  g.strokeRoundedRect(-size / 2 + size * 0.08, -size / 2 + size * 0.08, size * 0.84, size * 0.84, size * 0.08);
  // slightly worn edge, like a real stamp
  const r = rng(text.length * 7 + size);
  for (let i = 0; i < 10; i++) {
    g.fillStyle(0xf6e3d6, 0.35);
    g.fillCircle(-size / 2 + r() * size, -size / 2 + r() * size, size * 0.02);
  }
  c.add(g);
  const chars = Array.from(text);
  const fs = Math.round(size * (chars.length > 2 ? 0.26 : 0.34));
  const t = scene.add
    .text(0, 0, chars.join('\n'), {
      fontFamily: FONT_SERIF,
      fontSize: `${fs}px`,
      color: '#fbefe6',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: -fs * 0.15,
      resolution: TEXT_RES,
    })
    .setOrigin(0.5);
  c.add(t);
  return c;
}

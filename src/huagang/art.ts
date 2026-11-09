import * as Phaser from 'phaser';
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

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

/** Peony colours of the 牡丹园: deep red, rose, pale pink, white, purple. */
export const PEONY = [
  { outer: 0xc81d3c, inner: 0xe8506a, heart: 0xffd36a },
  { outer: 0xe86a9a, inner: 0xf6a8c4, heart: 0xffd36a },
  { outer: 0xf7c6d6, inner: 0xfde4ec, heart: 0xffe08a },
  { outer: 0xf6f0ea, inner: 0xffffff, heart: 0xffd36a },
  { outer: 0x9b4a9e, inner: 0xc77fc6, heart: 0xffd36a },
];

/** A big, layered peony bloom, drawn at (x, y) with radius r. */
export function drawPeony(g: G, x: number, y: number, r: number, colour: (typeof PEONY)[number], seed: number): void {
  const rr = rng(seed);
  // outer ring, then smaller rings of ruffled petals towards the heart
  for (const [ring, count, len, col] of [
    [1, 9, 1, colour.outer],
    [0.78, 8, 0.82, colour.outer],
    [0.58, 7, 0.64, colour.inner],
    [0.38, 6, 0.44, colour.inner],
  ] as const) {
    const off = rr() * Math.PI;
    for (let i = 0; i < count; i++) {
      const a = off + (i / count) * Math.PI * 2;
      g.fillStyle(col, 1);
      g.fillPoints(petal(x, y, r * len, r * 0.34 * ring + 2, a + Math.PI / 2, 10), true);
      g.fillStyle(0xffffff, 0.12);
      g.fillPoints(petal(x, y, r * len * 0.9, r * 0.12 * ring + 1, a + Math.PI / 2 + 0.1, 8), true);
    }
  }
  g.fillStyle(colour.heart, 1);
  for (let i = 0; i < 9; i++) g.fillCircle(x + (rr() - 0.5) * r * 0.25, y + (rr() - 0.5) * r * 0.25, r * 0.06 + 1);
}

/** A Himalayan cedar (雪松): tiered, drooping branches, lit from the upper left. */
function paintCedar(ctx: CanvasRenderingContext2D): void {
  const cx = 110;
  ctx.fillStyle = '#4a3424';
  ctx.fillRect(cx - 6, 300, 12, 40);
  for (let k = 0; k < 7; k++) {
    const y = 300 - k * 40;
    const w = 100 - k * 12;
    // each tier: a drooping skirt of needles
    const tier = (dx: number, col: string) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx + dx, y - 50);
      ctx.quadraticCurveTo(cx + dx - w * 0.3, y - 30, cx + dx - w, y + 4);
      ctx.quadraticCurveTo(cx + dx - w * 0.5, y - 6, cx + dx, y - 2);
      ctx.quadraticCurveTo(cx + dx + w * 0.5, y - 6, cx + dx + w, y + 4);
      ctx.quadraticCurveTo(cx + dx + w * 0.3, y - 30, cx + dx, y - 50);
      ctx.fill();
    };
    tier(0, '#2e5a3e');
    tier(-3, '#3d6e4c');
    // sunlit needles on the left
    ctx.fillStyle = 'rgba(150,200,140,0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 4, y - 46);
    ctx.quadraticCurveTo(cx - w * 0.4, y - 26, cx - w * 0.9, y);
    ctx.quadraticCurveTo(cx - w * 0.5, y - 10, cx - 6, y - 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,40,28,0.5)';
    ctx.lineWidth = 1;
    for (let i = -w + 8; i < w; i += 7) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 0.6, y - 10);
      ctx.lineTo(cx + i, y + 2);
      ctx.stroke();
    }
  }
}

/** A round camphor crown (香樟): a cloud of leaf clusters with light on top and shade below. */
function paintCamphor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4a3424';
  ctx.beginPath();
  ctx.moveTo(110, 300);
  ctx.lineTo(102, 200);
  ctx.lineTo(80, 160);
  ctx.lineTo(90, 158);
  ctx.lineTo(110, 192);
  ctx.lineTo(130, 150);
  ctx.lineTo(138, 154);
  ctx.lineTo(118, 200);
  ctx.lineTo(118, 300);
  ctx.fill();
  const blobs: [number, number, number][] = [[110, 120, 70], [60, 150, 52], [160, 148, 56], [86, 92, 44], [140, 90, 46], [110, 170, 54]];
  for (const [x, y, r] of blobs) {
    ctx.fillStyle = '#3f6e3a';
    ctx.beginPath();
    ctx.arc(x, y + 6, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [x, y, r] of blobs) {
    ctx.fillStyle = '#5b8a50';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [x, y, r] of blobs) {
    ctx.fillStyle = 'rgba(160,200,120,0.6)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // leaf texture
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 300; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * 90;
    const x = 110 + Math.cos(a) * d * 1.1;
    const y = 128 + Math.sin(a) * d * 0.75;
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(40,80,40,0.35)' : 'rgba(190,220,150,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 2.4, rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function generateHuagangTextures(scene: Phaser.Scene): void {
  canvas(scene, 'hgCedar', 220, 340, paintCedar);
  canvas(scene, 'hgCamphor', 220, 300, paintCamphor);
  // a fish-food pellet (鱼食)
  bake(scene, 'hgPellet', 14, 14, (g) => {
    g.fillStyle(0x3d2412, 0.5);
    g.fillCircle(7.5, 8, 5.5);
    g.fillStyle(0x8a5a2e, 1);
    g.fillCircle(7, 7, 5);
    g.fillStyle(0xd9a466, 1);
    g.fillCircle(6, 5.5, 2.6);
  });
  // a peony petal floating on the water
  bake(scene, 'hgPetal', 24, 24, (g) => {
    g.fillStyle(0xe86a9a, 1);
    g.fillPoints(petal(12, 22, 20, 9, 0, 10), true);
    g.fillStyle(0xf6a8c4, 1);
    g.fillPoints(petal(12, 20, 13, 5, 0, 8), true);
  });
  bake(scene, 'hgPetalRed', 24, 24, (g) => {
    g.fillStyle(0xc81d3c, 1);
    g.fillPoints(petal(12, 22, 20, 9, 0, 10), true);
    g.fillStyle(0xe8506a, 1);
    g.fillPoints(petal(12, 20, 13, 5, 0, 8), true);
  });
  // a ripple ring
  bake(scene, 'hgRing', 64, 64, (g) => {
    g.lineStyle(2.5, 0xffffff, 0.8);
    g.strokeCircle(32, 32, 28);
    g.lineStyle(1.2, 0xffffff, 0.4);
    g.strokeCircle(32, 32, 22);
  });
  // a bubble
  bake(scene, 'hgBubble', 16, 16, (g) => {
    g.lineStyle(1.5, 0xe8fbff, 0.8);
    g.strokeCircle(8, 8, 6);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(6, 5.5, 1.6);
  });
  // a glowing drop of water (one of the three dots of 魚)
  bake(scene, 'hgDrop', 64, 80, (g) => {
    for (const [r, a] of [[30, 0.08], [22, 0.14], [15, 0.25]]) {
      g.fillStyle(0xbff4ff, a);
      g.fillCircle(32, 46, r);
    }
    g.fillStyle(0x6fd6f2, 1);
    g.fillPoints([V(32, 18), V(44, 42), V(44, 50), V(32, 60), V(20, 50), V(20, 42)], true);
    g.fillCircle(32, 48, 12);
    g.fillStyle(0xe8fbff, 1);
    g.fillEllipse(27, 44, 5, 9);
  });
  // a lily pad seen from above
  bake(scene, 'hgPad', 90, 90, (g) => {
    g.fillStyle(0x0d3a30, 0.25);
    g.fillCircle(49, 50, 38);
    g.fillStyle(0x4f8f4a, 1);
    g.slice(45, 45, 40, 0.2, Math.PI * 2 - 0.05, false);
    g.fillPath();
    g.fillStyle(0x6aa85a, 1);
    g.slice(45, 45, 32, 0.25, Math.PI * 2 - 0.1, false);
    g.fillPath();
    g.lineStyle(1.2, 0x3a7038, 0.8);
    for (let i = 0; i < 9; i++) {
      const a = 0.3 + (i / 9) * (Math.PI * 2 - 0.4);
      g.lineBetween(45, 45, 45 + Math.cos(a) * 36, 45 + Math.sin(a) * 36);
    }
  });
  // a water lily (睡莲) flower seen from above
  bake(scene, 'hgLily', 50, 50, (g) => {
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + ring * 0.4;
        g.fillStyle(ring ? 0xfbe3ec : 0xf2a7c0, 1);
        g.fillPoints(petal(25, 25, ring ? 14 : 22, ring ? 5 : 7, a, 8), true);
      }
    }
    g.fillStyle(0xffd36a, 1);
    g.fillCircle(25, 25, 4);
  });

  // shimmering light on the pond floor (焦散), tileable
  canvas(scene, 'hgCaustic', 256, 256, (ctx) => {
    const img = ctx.createImageData(256, 256);
    const a = (Math.PI * 2) / 256;
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const v1 = Math.sin(3 * a * x + 1.6 * Math.sin(2 * a * y) + 1.1 * Math.sin(5 * a * (x + y)));
        const v2 = Math.sin(3 * a * y + 1.6 * Math.sin(2 * a * x + 1) - 1.1 * Math.sin(4 * a * (x - y)));
        const v = Math.min(Math.abs(v1), Math.abs(v2));
        const b = Math.max(0, 1 - v * 4) ** 2;
        const i = (y * 256 + x) * 4;
        img.data[i] = 255;
        img.data[i + 1] = 255;
        img.data[i + 2] = 240;
        img.data[i + 3] = Math.round(b * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  // soft sky reflections on the surface, tileable
  canvas(scene, 'hgSheen', 512, 256, (ctx) => {
    const r = rng(12);
    for (let i = 0; i < 26; i++) {
      const x = r() * 512;
      const y = r() * 256;
      const w = 60 + r() * 180;
      for (const dx of [-512, 0, 512]) {
        const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, w);
        g.addColorStop(0, 'rgba(255,255,255,0.35)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(x + dx, y);
        ctx.scale(1, 0.18);
        ctx.translate(-(x + dx), -y);
        ctx.fillRect(x + dx - w, y - w, w * 2, w * 2);
        ctx.restore();
      }
    }
  });
  // underwater light shafts
  canvas(scene, 'hgRay', 160, 600, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, 'rgba(230,255,240,0.55)');
    g.addColorStop(1, 'rgba(230,255,240,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(110, 0);
    ctx.lineTo(160, 600);
    ctx.lineTo(0, 600);
    ctx.closePath();
    ctx.fill();
  });
  // a soft round glow
  canvas(scene, 'hgGlow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  // an ink wisp left behind by 魚
  canvas(scene, 'hgInk', 48, 48, (ctx) => {
    const g = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(15,14,18,0.7)');
    g.addColorStop(1, 'rgba(15,14,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 48, 48);
  });
  generateHandTexture(scene);
  // a little paper bag of fish food
  bake(scene, 'hgBag', 70, 90, (g) => {
    g.fillStyle(0xd8b98a, 1);
    g.fillPoints([V(8, 14), V(62, 14), V(66, 88), V(4, 88)], true);
    g.fillStyle(0xc4a272, 1);
    g.fillPoints([V(8, 14), V(62, 14), V(58, 4), V(12, 4)], true);
    g.fillStyle(0xc0392b, 1);
    g.fillCircle(35, 52, 14);
    g.fillStyle(0xf8f4ea, 1);
    g.fillEllipse(35, 52, 16, 7);
    g.fillTriangle(42, 52, 48, 47, 48, 57);
  });
}

/** A giant hand seen from under the water, fingers opening to let food fall. */
export function generateHandTexture(scene: Phaser.Scene): void {
  bake(scene, 'hgHand', 320, 220, (g) => {
    g.fillStyle(0xe9b796, 1);
    g.fillEllipse(160, 70, 190, 130);
    // fingers spread downwards
    for (const [x, len, a] of [[92, 120, -0.35], [138, 140, -0.1], [184, 135, 0.12], [226, 110, 0.38]] as const) {
      g.fillStyle(0xe9b796, 1);
      g.fillPoints(
        [
          V(x - 18, 90),
          V(x + 18, 90),
          V(x + 16 + Math.sin(a) * len, 90 + Math.cos(a) * len),
          V(x - 16 + Math.sin(a) * len, 90 + Math.cos(a) * len),
        ],
        true,
      );
      g.fillCircle(x + Math.sin(a) * len, 90 + Math.cos(a) * len, 16);
      g.fillStyle(0xf6d6c2, 0.8);
      g.fillEllipse(x + Math.sin(a) * len, 90 + Math.cos(a) * len + 6, 16, 10);
    }
    g.fillStyle(0xe9b796, 1);
    g.fillPoints([V(250, 50), V(300, 20), V(312, 40), V(262, 92)], true);
    g.fillStyle(0xd79f80, 0.6);
    g.fillEllipse(160, 60, 120, 50);
  });
}

/**
 * 魚 with its bottom (the font's four dots) cut away, as a plain image.
 * Text.setCrop is applied upside down to canvas text in Phaser 4 (it kept the bottom
 * and lost the top), so the glyph is drawn into its own texture instead.
 */
export function yuWithoutDots(scene: Phaser.Scene, x: number, y: number, style: Phaser.Types.GameObjects.Text.TextStyle, keep = 0.74): Phaser.GameObjects.Image {
  const txt = scene.add.text(0, 0, '魚', style);
  const src = txt.canvas;
  const key = `yuTop-${style.fontSize}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, src.width, src.height)!;
    tex.context.drawImage(src, 0, 0, src.width, Math.round(src.height * keep), 0, 0, src.width, Math.round(src.height * keep));
    tex.refresh();
  }
  const img = scene.add.image(x, y, key).setDisplaySize(txt.width, txt.height);
  txt.destroy();
  return img;
}

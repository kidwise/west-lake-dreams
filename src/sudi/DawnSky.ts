import * as Phaser from 'phaser';
import { W, H } from '../core/config';
import { hillPolygon, rng } from '../art/paint';
import { mix } from './art';
import { HORIZON, WATER } from './causeway';

/**
 * Time of day for 苏堤春晓: t = 0 deep pre-dawn blue → 0.55 peach dawn →
 * 0.85 golden sunrise → 1 clear spring morning.
 *
 * World objects (causeway, trees, riders) are darkened by one MULTIPLY
 * "light" overlay. Background layers sit under the same overlay, so their
 * colours are divided by the light first — the final colours on screen are
 * exactly the palette below.
 */
interface Key {
  t: number;
  skyTop: number;
  skyBottom: number;
  hillFar: number;
  hillNear: number;
  glow: number;
  glowAmt: number;
  lakeFar: number;
  lakeNear: number;
  mist: number;
  mistAmt: number;
  light: number;
  stars: number;
}

const KEYS: Key[] = [
  { t: 0, skyTop: 0x0c1430, skyBottom: 0x2b3762, hillFar: 0x1c2647, hillNear: 0x151d38, glow: 0x3a4a80, glowAmt: 0, lakeFar: 0x1d2a4c, lakeNear: 0x141f3c, mist: 0x8d9bc4, mistAmt: 0.55, light: 0x3c4878, stars: 1 },
  { t: 0.3, skyTop: 0x1f2b58, skyBottom: 0x7a6e9e, hillFar: 0x34406a, hillNear: 0x262f55, glow: 0xb88aa8, glowAmt: 0.3, lakeFar: 0x3d4a78, lakeNear: 0x2a3560, mist: 0xbcbcda, mistAmt: 0.5, light: 0x6a70a4, stars: 0.5 },
  { t: 0.55, skyTop: 0x4a5f9a, skyBottom: 0xf2b8a0, hillFar: 0x6a6e92, hillNear: 0x4b5578, glow: 0xf3a8a0, glowAmt: 0.8, lakeFar: 0x8a8fb4, lakeNear: 0x5a6890, mist: 0xf6d4cc, mistAmt: 0.42, light: 0xb3a6c0, stars: 0.1 },
  { t: 0.82, skyTop: 0x79b0de, skyBottom: 0xfde3b4, hillFar: 0x8fa3a2, hillNear: 0x6f8c84, glow: 0xffd27a, glowAmt: 0.7, lakeFar: 0xa9c9cf, lakeNear: 0x8fbac6, mist: 0xfff0d2, mistAmt: 0.22, light: 0xfff1dc, stars: 0 },
  { t: 1, skyTop: 0x86c2ec, skyBottom: 0xe6f3f4, hillFar: 0x9ab4ac, hillNear: 0x7a9a8e, glow: 0xffe9b0, glowAmt: 0.25, lakeFar: 0xaed6da, lakeNear: 0x98c8d2, mist: 0xffffff, mistAmt: 0.1, light: 0xffffff, stars: 0 },
];

function sample(t: number): Key {
  const k = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].t < k) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = (k - a.t) / (b.t - a.t);
  const out = { t: k } as Key;
  for (const key of Object.keys(a) as (keyof Key)[]) {
    if (key === 't') continue;
    const va = a[key];
    const vb = b[key];
    out[key] = (['glowAmt', 'mistAmt', 'stars'].includes(key) ? va + (vb - va) * u : mix(va, vb, u)) as never;
  }
  return out;
}

/** Divide a colour by the light so that colour × light = the colour we want. */
function unlight(c: number, light: number): number {
  const ch = (shift: number) => {
    const v = (c >> shift) & 255;
    const l = Math.max(24, (light >> shift) & 255);
    return Math.min(255, Math.round((v * 255) / l));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export class DawnSky {
  readonly lightOverlay: Phaser.GameObjects.Rectangle;
  private sky: Phaser.GameObjects.Graphics;
  private hills: Phaser.GameObjects.Graphics;
  private hillsNear: Phaser.GameObjects.Graphics;
  private lakes: Phaser.GameObjects.Graphics;
  private ripplesFar: Phaser.GameObjects.TileSprite;
  private ripplesNear: Phaser.GameObjects.TileSprite;
  private stars: Phaser.GameObjects.Arc[] = [];
  private mists: { img: Phaser.GameObjects.TileSprite; f: number; base: number }[] = [];
  private farPts: Phaser.Math.Vector2[];
  private nearPts: Phaser.Math.Vector2[];
  private lastT = -1;
  private key: Key = KEYS[0];

  /** Depths: background < `worldDepth` (causeway, riders) < overlay < mist/stars. */
  constructor(scene: Phaser.Scene, worldW: number, overlayDepth = 500) {
    this.sky = scene.add.graphics().setScrollFactor(0).setDepth(-100);
    this.hills = scene.add.graphics().setDepth(-90);
    const farF = 0.12;
    const nearF = 0.22;
    this.farPts = hillPolygon(W + worldW * farF + 40, HORIZON - 70, 70, HORIZON + 2, 41, 12);
    this.nearPts = hillPolygon(W + worldW * nearF + 40, HORIZON - 26, 40, HORIZON + 2, 43, 12);
    // two hill layers, each with its own parallax
    this.hillsNear = scene.add.graphics().setDepth(-89).setScrollFactor(nearF, 0);
    this.hills.setScrollFactor(farF, 0);

    this.lakes = scene.add.graphics().setScrollFactor(0).setDepth(-80);
    this.ripplesFar = scene.add.tileSprite(0, HORIZON, W, WATER - HORIZON, 'ripples').setOrigin(0).setScrollFactor(0).setDepth(-79).setAlpha(0.35);
    this.ripplesNear = scene.add.tileSprite(0, WATER, W, H - WATER, 'ripples').setOrigin(0).setScrollFactor(0).setDepth(40).setAlpha(0.5);

    this.lightOverlay = scene.add
      .rectangle(0, 0, W, H, 0xffffff, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(overlayDepth)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    const r = rng(3);
    for (let i = 0; i < 110; i++) {
      const s = scene.add.circle(r() * W, r() * HORIZON * 0.8, 0.6 + r() * 1.5, 0xffffff, 1).setScrollFactor(0).setDepth(overlayDepth + 1);
      s.setData('tw', 0.4 + r() * 0.6).setData('ph', r() * 6);
      this.stars.push(s);
    }
    for (const [y, f, base] of [
      [HORIZON - 70, 0.3, 0.7],
      [HORIZON - 10, 0.55, 1],
      [WATER - 60, 1.15, 0.8],
      [WATER + 30, 1.4, 0.55],
    ] as const) {
      const img = scene.add.tileSprite(0, y, W, 120, 'mistBand').setOrigin(0, 0.5).setScrollFactor(0).setDepth(overlayDepth + 2);
      this.mists.push({ img, f, base });
    }
  }

  get current(): Key {
    return this.key;
  }

  update(t: number, scrollX: number, time: number): void {
    if (Math.abs(t - this.lastT) > 0.004) {
      this.lastT = t;
      this.redraw(sample(t));
    }
    const k = this.key;
    this.ripplesFar.tilePositionX = scrollX * 0.35 + time * 0.004;
    this.ripplesNear.tilePositionX = scrollX * 1.1 + time * 0.01;
    for (const s of this.stars) {
      s.setAlpha(k.stars * (0.35 + 0.65 * Math.abs(Math.sin(time * 0.001 * (s.getData('tw') as number) + (s.getData('ph') as number)))));
    }
    for (const m of this.mists) {
      m.img.tilePositionX = scrollX * m.f + time * 0.012 * m.f;
      m.img.setAlpha(k.mistAmt * m.base).setTint(k.mist);
    }
  }

  private redraw(k: Key): void {
    this.key = k;
    const L = k.light;
    this.lightOverlay.setFillStyle(L, 1).setVisible(L !== 0xffffff);

    const sky = this.sky;
    sky.clear();
    const top = unlight(k.skyTop, L);
    const bottom = unlight(k.skyBottom, L);
    sky.fillGradientStyle(top, top, bottom, bottom, 1);
    sky.fillRect(0, 0, W, HORIZON + 4);

    const paintHills = (g: Phaser.GameObjects.Graphics, pts: Phaser.Math.Vector2[], color: number) => {
      g.clear();
      g.fillStyle(unlight(color, L), 1);
      g.fillPoints(pts, true);
      if (k.glowAmt > 0.02) {
        // first light catching the ridges (the sun is behind us, in the east)
        g.lineStyle(5, unlight(k.glow, L), k.glowAmt * 0.8);
        g.strokePoints(pts.slice(1, -1), false, false);
        g.lineStyle(14, unlight(k.glow, L), k.glowAmt * 0.18);
        g.strokePoints(pts.slice(1, -1).map((p) => new Phaser.Math.Vector2(p.x, p.y + 8)), false, false);
      }
    };
    paintHills(this.hills, this.farPts, k.hillFar);
    paintHills(this.hillsNear, this.nearPts, k.hillNear);

    const lakes = this.lakes;
    lakes.clear();
    const far = unlight(k.lakeFar, L);
    lakes.fillGradientStyle(far, far, unlight(mix(k.lakeFar, k.skyBottom, 0.3), L), unlight(mix(k.lakeFar, k.skyBottom, 0.3), L), 1);
    lakes.fillRect(0, HORIZON, W, WATER - HORIZON + 2);
    const near = unlight(k.lakeNear, L);
    const nearDeep = unlight(mix(k.lakeNear, 0x000000, 0.25), L);
    lakes.fillGradientStyle(near, near, nearDeep, nearDeep, 1);
    lakes.fillRect(0, WATER, W, H - WATER);
  }
}

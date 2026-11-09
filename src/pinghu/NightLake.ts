import * as Phaser from 'phaser';
import { W, H } from '../core/config';
import { hillPolygon, rng } from '../art/paint';

export const HORIZON = 330;
export const RAIL_Y = 590;

/**
 * The lake at night, seen from the stone terrace in front of 御书楼:
 * stars, 孤山 and the far shore, the zig-zag bridge with a little pavilion,
 * the lit library building on the right, and the terrace railing in front.
 * `brightness` 0..1 lifts the whole night as the moon comes back.
 */
export class NightLake {
  private stars: Phaser.GameObjects.Image[] = [];
  private ripples: Phaser.GameObjects.TileSprite;
  private sky: Phaser.GameObjects.Graphics;
  private lake: Phaser.GameObjects.Graphics;
  readonly posts: { x: number; y: number }[] = [];
  private brightness = -1;
  calm = 0;

  constructor(scene: Phaser.Scene, opts: { posts?: number } = {}) {
    const r = rng(23);
    this.sky = scene.add.graphics().setDepth(-100);
    this.lake = scene.add.graphics().setDepth(-80);
    for (let i = 0; i < 120; i++) {
      const s = scene.add.image(r() * W, r() * (HORIZON - 40), 'phStar').setDepth(-99).setAlpha(0.3 + r() * 0.7).setScale(0.6 + r() * 0.8);
      s.setData('ph', r() * 6);
      this.stars.push(s);
    }
    // far shore and 孤山
    const g = scene.add.graphics().setDepth(-90);
    const far = hillPolygon(W + 40, HORIZON - 20, 30, HORIZON + 4, 61, 14);
    g.fillStyle(0x1a2440, 1);
    g.fillPoints(far, true);
    const gushan = hillPolygon(520, HORIZON - 70, 40, HORIZON + 4, 9, 12).map((p) => new Phaser.Math.Vector2(p.x + 760, p.y));
    g.fillStyle(0x141c34, 1);
    g.fillPoints(gushan, true);
    // a few lights along the far shore
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0xffd27a, 0.5 + r() * 0.4);
      g.fillCircle(r() * W, HORIZON - 4 + r() * 6, 1.2);
    }
    this.ripples = scene.add.tileSprite(0, HORIZON, W, H - HORIZON, 'ripples').setOrigin(0).setDepth(-79).setAlpha(0.18);

    // the zig-zag bridge out to a little pavilion on the water
    const b = scene.add.graphics().setDepth(-60);
    const zig = [[-20, 420], [120, 420], [160, 400], [260, 400], [300, 380], [360, 380]];
    b.lineStyle(9, 0x2a3350, 1);
    for (let i = 0; i < zig.length - 1; i++) b.lineBetween(zig[i][0], zig[i][1], zig[i + 1][0], zig[i + 1][1]);
    b.lineStyle(2, 0xc9cdd8, 0.6);
    for (let i = 0; i < zig.length - 1; i++) b.lineBetween(zig[i][0], zig[i][1] - 6, zig[i + 1][0], zig[i + 1][1] - 6);
    for (let x = 0; x < 360; x += 18) b.fillStyle(0xc9cdd8, 0.5).fillRect(x, 410 - (x / 360) * 36, 2, 7);
    // 月波亭: a little pavilion with a warm lamp
    b.fillStyle(0x222a44, 1);
    b.fillRect(370, 350, 6, 32);
    b.fillRect(424, 350, 6, 32);
    b.fillTriangle(348, 352, 452, 352, 400, 318);
    b.fillStyle(0xffd27a, 0.9);
    b.fillCircle(400, 362, 5);
    // 御书楼 on the right: two storeys, lit windows
    const lib = scene.add.graphics().setDepth(-58);
    lib.fillStyle(0x1c233c, 1);
    lib.fillRect(980, 300, 260, 260);
    lib.fillTriangle(950, 304, 1270, 304, 1110, 250);
    lib.fillRect(1000, 410, 220, 10);
    lib.fillTriangle(970, 414, 1250, 414, 1110, 392);
    for (let i = 0; i < 5; i++) {
      lib.fillStyle(0xffc46a, 0.85);
      lib.fillRect(1004 + i * 44, 330, 24, 40);
      lib.fillRect(1004 + i * 44, 440, 24, 50);
      lib.fillStyle(0x7a4a2a, 0.6);
      lib.fillRect(1015 + i * 44, 330, 2, 40);
      lib.fillRect(1015 + i * 44, 440, 2, 50);
    }
    // warm reflections of the windows in the water
    const refl = scene.add.graphics().setDepth(-70);
    for (let i = 0; i < 5; i++) {
      refl.fillStyle(0xffc46a, 0.25);
      refl.fillRect(1006 + i * 44, 570, 20, 90);
    }
    refl.fillStyle(0xffd27a, 0.25);
    refl.fillRect(396, 400, 8, 60);

    // the stone terrace and its railing
    const t = scene.add.graphics().setDepth(40);
    t.fillStyle(0x3a3f50, 1);
    t.fillRect(0, RAIL_Y + 26, W, H - RAIL_Y - 26);
    t.fillStyle(0x8b8f9a, 1);
    t.fillRect(0, RAIL_Y, W, 14);
    t.fillStyle(0xb5b9c2, 1);
    t.fillRect(0, RAIL_Y - 4, W, 6);
    const n = opts.posts ?? 8;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * W;
      t.fillStyle(0x9a9ea8, 1);
      t.fillRect(x - 12, RAIL_Y - 30, 24, 56);
      t.fillStyle(0xc6cad2, 1);
      t.fillRect(x - 14, RAIL_Y - 36, 28, 8);
      this.posts.push({ x, y: RAIL_Y - 30 });
    }
    t.fillStyle(0x6b6f7a, 1);
    for (let i = 0; i < n; i++) t.fillRect(((i + 0.5) / n) * W - 50, RAIL_Y + 14, 100, 10);
    this.setBrightness(0);
  }

  /** 0 = moonless night, 1 = full-moon night. */
  setBrightness(k: number): void {
    if (Math.abs(k - this.brightness) < 0.01) return;
    this.brightness = k;
    const mix = (a: number, b: number) => Phaser.Display.Color.GetColor(
      Math.round(((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * k)),
      Math.round(((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * k)),
      Math.round((a & 255) + (((b & 255) - (a & 255)) * k)),
    );
    this.sky.clear();
    this.sky.fillGradientStyle(mix(0x070c1e, 0x14224a), mix(0x070c1e, 0x14224a), mix(0x1a2448, 0x3a4a7a), mix(0x1a2448, 0x3a4a7a), 1);
    this.sky.fillRect(0, 0, W, HORIZON + 4);
    this.lake.clear();
    this.lake.fillGradientStyle(mix(0x10183a, 0x2a3a66), mix(0x10183a, 0x2a3a66), mix(0x060a1a, 0x101a38), mix(0x060a1a, 0x101a38), 1);
    this.lake.fillRect(0, HORIZON, W, H - HORIZON);
  }

  update(time: number): void {
    this.ripples.tilePositionX = time * 0.01 * (1 - this.calm * 0.9);
    this.ripples.setAlpha(0.06 + 0.16 * (1 - this.calm));
    for (const s of this.stars) s.setAlpha(0.35 + 0.55 * Math.abs(Math.sin(time * 0.0012 + (s.getData('ph') as number))));
  }
}

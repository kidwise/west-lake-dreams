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

    // the zig-zag bridge out to a little pavilion on the water: a stone deck with a side face and posts
    const b = scene.add.graphics().setDepth(-60);
    const zig = [[-20, 420], [120, 420], [160, 400], [260, 400], [300, 380], [352, 380]];
    for (let i = 0; i < zig.length - 1; i++) {
      const [x0, y0] = zig[i];
      const [x1, y1] = zig[i + 1];
      b.fillStyle(0x1a2036, 1);
      b.fillPoints([new Phaser.Math.Vector2(x0, y0), new Phaser.Math.Vector2(x1, y1), new Phaser.Math.Vector2(x1, y1 + 8), new Phaser.Math.Vector2(x0, y0 + 8)], true);
      b.lineStyle(5, 0x4a5270, 1);
      b.lineBetween(x0, y0, x1, y1);
      b.lineStyle(1.6, 0xc9cdd8, 0.7);
      b.lineBetween(x0, y0 - 7, x1, y1 - 7);
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 16));
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n;
        const y = y0 + ((y1 - y0) * k) / n;
        b.fillStyle(0xd8dce6, 0.75);
        b.fillRect(x - 1, y - 9, 2.4, 9);
        // stilts into the water
        if (k % 2 === 0) {
          b.fillStyle(0x141a2e, 1);
          b.fillRect(x - 1.5, y + 8, 3, 14);
        }
      }
    }
    scene.add.image(400, 402, 'phPavilion').setOrigin(0.5, 1).setDepth(-59);
    scene.add.image(400, 350, 'phHalo').setScale(0.5).setTint(0xffc46a).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(-58);
    // 御书楼 on the right, among dark trees
    const trees = scene.add.graphics().setDepth(-59);
    for (let i = 0; i < 12; i++) {
      trees.fillStyle(i % 2 ? 0x101628 : 0x141a30, 1);
      trees.fillCircle(930 + i * 30 + r() * 20, 330 + r() * 40, 30 + r() * 20);
    }
    scene.add.image(1110, 572, 'phLibrary').setOrigin(0.5, 1).setDepth(-58);
    // warm reflections of the windows in the water
    const refl = scene.add.graphics().setDepth(-70);
    for (let i = 0; i < 5; i++) {
      refl.fillStyle(0xffc46a, 0.22);
      refl.fillRect(976 + i * 56, 576, 30, 110);
    }
    refl.fillStyle(0xffd27a, 0.3);
    refl.fillRect(396, 404, 8, 70);

    // the stone terrace: paving, then the carved railing in front
    const t = scene.add.graphics().setDepth(40);
    t.fillGradientStyle(0x3a3f50, 0x3a3f50, 0x23273a, 0x23273a, 1);
    t.fillRect(0, RAIL_Y + 26, W, H - RAIL_Y - 26);
    t.lineStyle(1, 0x1a1e2c, 0.6);
    for (let y = RAIL_Y + 40; y < H; y += 22) t.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 70) t.lineBetween(x, RAIL_Y + 26, x - 30, H);
    const n = opts.posts ?? 8;
    for (let i = 0; i < n; i++) {
      const x0 = (i / n) * W;
      scene.add.image(x0, RAIL_Y - 10, 'phPanel').setOrigin(0, 0).setDisplaySize(W / n, 36).setDepth(40.5);
    }
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * W;
      scene.add.image(x, RAIL_Y + 30, 'phPost').setOrigin(0.5, 1).setDepth(41);
      this.posts.push({ x, y: RAIL_Y - 30 });
    }
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

import * as Phaser from 'phaser';
import { W, H, C } from '../core/config';
import { hillPolygon, pagoda, polyYAt, rng } from './paint';

export interface BackdropOptions {
  /** Total width of the parallax world (defaults to the screen width). */
  worldWidth?: number;
  horizon?: number;
  skyTop?: number;
  skyBottom?: number;
  lakeTop?: number;
  lakeBottom?: number;
  /** Scroll factors for the parallax layers. */
  farFactor?: number;
  nearFactor?: number;
  causewayFactor?: number;
  depth?: number;
}

export interface Backdrop {
  ripples: Phaser.GameObjects.TileSprite;
  clouds: Phaser.GameObjects.Image[];
  /** Call each frame (with camera scrollX) to animate water and clouds. */
  update: (time: number, scrollX: number) => void;
}

/**
 * Paints the shared West Lake backdrop: sky, misty hills with a pagoda,
 * a far causeway of willows and the lake surface. Works for both static
 * screens and the side-scrolling ride (via scroll factors).
 */
export function paintBackdrop(scene: Phaser.Scene, o: BackdropOptions = {}): Backdrop {
  const worldW = o.worldWidth ?? W;
  const horizon = o.horizon ?? 330;
  const depth = o.depth ?? -100;
  const farF = o.farFactor ?? 0.08;
  const nearF = o.nearFactor ?? 0.16;
  const cwF = o.causewayFactor ?? 0.3;

  // sky
  const sky = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  sky.fillGradientStyle(o.skyTop ?? C.skyTop, o.skyTop ?? C.skyTop, o.skyBottom ?? C.skyBottom, o.skyBottom ?? C.skyBottom, 1);
  sky.fillRect(0, 0, W, horizon + 20);
  sky.fillStyle(0xfff6e0, 0.55);
  sky.fillCircle(W * 0.78, 120, 46);
  sky.fillStyle(0xfff6e0, 0.18);
  sky.fillCircle(W * 0.78, 120, 80);

  // clouds
  const clouds: Phaser.GameObjects.Image[] = [];
  const r = rng(99);
  for (let i = 0; i < 5; i++) {
    clouds.push(
      scene.add
        .image(r() * W * 1.4, 50 + r() * 150, 'cloud')
        .setScrollFactor(0)
        .setDepth(depth + 1)
        .setScale(0.8 + r() * 0.8)
        .setAlpha(0.9),
    );
  }

  // far hills (with Baochu-style pagoda)
  const farW = W + worldW * farF + 40;
  const far = scene.add.graphics().setScrollFactor(farF, 0).setDepth(depth + 2);
  const farPts = hillPolygon(farW, horizon - 30, 60, horizon + 10, 5);
  far.fillStyle(C.hillFar, 0.85);
  far.fillPoints(farPts, true);
  const pagodaX = Math.min(farW - 120, W * 0.62);
  pagoda(far, pagodaX, polyYAt(farPts, pagodaX) + 4, 70, 0x7f978f, 0.95);

  // nearer hills
  const nearW = W + worldW * nearF + 40;
  const near = scene.add.graphics().setScrollFactor(nearF, 0).setDepth(depth + 3);
  const nearPts = hillPolygon(nearW, horizon - 2, 34, horizon + 14, 8);
  near.fillStyle(C.hillNear, 0.9);
  near.fillPoints(nearPts, true);
  near.fillStyle(0xffffff, 0.15);
  near.fillRect(0, horizon - 10, nearW, 24); // morning mist

  // lake
  const lakeTop = o.lakeTop ?? horizon + 8;
  const lakeBottom = o.lakeBottom ?? H;
  const lake = scene.add.graphics().setScrollFactor(0).setDepth(depth + 4);
  lake.fillGradientStyle(C.lake, C.lake, C.lakeDeep, C.lakeDeep, 1);
  lake.fillRect(0, lakeTop, W, lakeBottom - lakeTop);
  const ripples = scene.add
    .tileSprite(0, lakeTop, W, lakeBottom - lakeTop, 'ripples')
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(depth + 5)
    .setAlpha(0.8);

  // far causeway: a thin strip of willows and a little arched bridge
  const cwW = W + worldW * cwF + 200;
  const cw = scene.add.graphics().setScrollFactor(cwF, 0).setDepth(depth + 6);
  const cy = lakeTop + 26;
  cw.fillStyle(0x7d9a72, 0.75);
  cw.fillRect(0, cy, cwW, 6);
  const cr = rng(17);
  for (let x = 20; x < cwW; x += 70 + cr() * 90) {
    if (cr() < 0.12) {
      // small arched bridge
      cw.fillStyle(0xd8d2c6, 0.9);
      cw.slice(x + 30, cy + 6, 30, Math.PI, 0, false);
      cw.fillPath();
      cw.fillStyle(C.lake, 1);
      cw.slice(x + 30, cy + 7, 18, Math.PI, 0, false);
      cw.fillPath();
      x += 60;
      continue;
    }
    scene.add
      .image(x, cy + 4, 'willowSmall')
      .setOrigin(0.5, 1)
      .setScale(0.32 + cr() * 0.12)
      .setScrollFactor(cwF, 0)
      .setDepth(depth + 6)
      .setAlpha(0.8);
  }

  return {
    ripples,
    clouds,
    update(time, scrollX) {
      ripples.tilePositionX = scrollX * 0.5 + time * 0.008;
      ripples.tilePositionY = Math.sin(time * 0.0006) * 6;
      clouds.forEach((c, i) => {
        c.x -= 0.05 + i * 0.015;
        if (c.x < -200) c.x = W + 200;
      });
    },
  };
}

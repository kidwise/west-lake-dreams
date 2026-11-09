import * as Phaser from 'phaser';
import { pagoda as tinyPagoda } from '../art/paint';
import {
  VIEW_W,
  VIEW_H,
  HORIZON,
  FOCAL,
  CAM_H,
  OBJECTS,
  ISLAND,
  LANDMARKS,
  ridge,
  project,
  bearingX,
  bearingTo,
  elevY,
  wrap180,
  type Pose,
} from './world';

const SUN = { bearing: 252, elev: 5.5 };
const deg = Math.PI / 180;

interface Sprite {
  img: Phaser.GameObjects.Image;
  refl: Phaser.GameObjects.Image;
  h: number;
}

/**
 * Renders the first-person lake view (golden hour) from a Pose:
 * sky, sun, layered hills with distant pagodas, water with reflections,
 * the island, three stone pagodas, and our boat's bow.
 */
export class LakeView {
  private hills: Phaser.GameObjects.Graphics;
  private sun: Phaser.GameObjects.Graphics;
  private island: Phaser.GameObjects.Graphics;
  private ripples: Phaser.GameObjects.TileSprite;
  private sprites: Sprite[] = [];
  private bow: Phaser.GameObjects.Image;
  private egrets: { img: Phaser.GameObjects.Image; vx: number; y: number; phase: number }[] = [];
  private rippleY = 0;

  constructor(scene: Phaser.Scene) {
    // sky: dusk gradient in two bands
    const sky = scene.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x4f6496, 0x4f6496, 0xd7a6a0, 0xd7a6a0, 1);
    sky.fillRect(0, 0, VIEW_W, HORIZON * 0.62);
    sky.fillGradientStyle(0xd7a6a0, 0xd7a6a0, 0xf8d9a6, 0xf8d9a6, 1);
    sky.fillRect(0, HORIZON * 0.62 - 1, VIEW_W, HORIZON * 0.38 + 30);

    this.sun = scene.add.graphics().setDepth(1);
    this.hills = scene.add.graphics().setDepth(2);

    // water
    const water = scene.add.graphics().setDepth(3);
    water.fillGradientStyle(0xe9c6a2, 0xe9c6a2, 0x4d6f86, 0x4d6f86, 1);
    water.fillRect(0, HORIZON - 4, VIEW_W, VIEW_H - HORIZON + 40);
    this.ripples = scene.add
      .tileSprite(0, HORIZON, VIEW_W, VIEW_H - HORIZON + 40, 'ripples')
      .setOrigin(0)
      .setDepth(4)
      .setAlpha(0.55);

    this.island = scene.add.graphics().setDepth(10);

    for (const o of OBJECTS) {
      const refl = scene.add.image(0, 0, o.tex).setOrigin(0.5, 0).setFlipY(true).setAlpha(0.32).setTint(0x8aa0b0).setVisible(false);
      const img = scene.add.image(0, 0, o.tex).setOrigin(0.5, 1).setVisible(false);
      this.sprites.push({ img, refl, h: o.h });
    }

    for (let i = 0; i < 3; i++) {
      const img = scene.add.image(-100, 0, 'egret1').setDepth(6).setScale(0.6 + i * 0.15);
      this.egrets.push({ img, vx: 18 + i * 9, y: 80 + i * 45, phase: i * 2 });
    }

    this.bow = scene.add.image(VIEW_W / 2, VIEW_H + 14, 'boatBow').setOrigin(0.5, 1).setDepth(400);
  }

  render(p: Pose, time: number, speed: number): void {
    const bob = Math.sin(time * 0.0016) * 3 + Math.sin(time * 0.0027) * 1.5;
    this.drawSunAndHills(p, bob);
    this.drawIsland(p, bob);

    const objs = OBJECTS;
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      const s = this.sprites[i];
      const pr = project(p, o);
      const visible = pr.z > 0 && pr.sx > -400 && pr.sx < VIEW_W + 400;
      s.img.setVisible(visible);
      s.refl.setVisible(visible);
      if (!visible) continue;
      const scale = pr.size / s.img.height;
      const depth = 20 + 300 / (1 + pr.z * 0.05);
      s.img.setPosition(pr.sx, pr.baseY + bob).setScale(scale).setDepth(depth);
      // a little shimmer on the reflection
      s.refl
        .setPosition(pr.sx + Math.sin(time * 0.003 + i) * 1.5, pr.baseY + bob)
        .setScale(scale * (1 + Math.sin(time * 0.004 + i) * 0.02), scale * 0.85)
        .setDepth(depth - 0.5);
    }

    // ripples drift with heading and forward motion
    this.rippleY -= speed * 0.6;
    this.ripples.tilePositionX = p.heading * 14 + time * 0.006;
    this.ripples.tilePositionY = this.rippleY;
    this.ripples.y = HORIZON + bob;

    for (const e of this.egrets) {
      e.img.x += e.vx * 0.016;
      if (e.img.x > VIEW_W + 60) e.img.x = -60;
      e.img.y = e.y + Math.sin(time * 0.001 + e.phase) * 10;
      e.img.setTexture(Math.sin(time * 0.012 + e.phase) > 0 ? 'egret1' : 'egret2');
    }

    this.bow.y = VIEW_H + 14 + bob * 1.4;
    this.bow.rotation = Math.sin(time * 0.0011) * 0.008;
  }

  /** Hide the boat's bow (e.g. while a photo is being captured). */
  setBowVisible(on: boolean): void {
    this.bow.setVisible(on);
  }

  private drawSunAndHills(p: Pose, bob: number): void {
    const sun = this.sun;
    sun.clear();
    const sx = bearingX(p, SUN.bearing);
    if (!Number.isNaN(sx)) {
      const sy = elevY(SUN.elev) + bob;
      for (const [r, a] of [[110, 0.12], [70, 0.2], [44, 0.35]]) {
        sun.fillStyle(0xffe2a8, a);
        sun.fillCircle(sx, sy, r);
      }
      sun.fillStyle(0xfff4d6, 1);
      sun.fillCircle(sx, sy, 28);
      // glitter path on the water
      for (let y = HORIZON + 6; y < VIEW_H; y += 7) {
        const w = 12 + (y - HORIZON) * 0.35;
        sun.fillStyle(0xfff0c8, 0.25 + Math.random() * 0.25);
        sun.fillRect(sx - w / 2 + (Math.random() - 0.5) * w * 0.6, y + bob, w * (0.3 + Math.random() * 0.5), 2);
      }
    }

    const g = this.hills;
    g.clear();
    const layer = (fn: (b: number) => number, color: number, alpha: number) => {
      const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(-10, HORIZON + bob + 2)];
      for (let x = -10; x <= VIEW_W + 10; x += 8) {
        const b = p.heading + Math.atan((x - VIEW_W / 2) / FOCAL) / deg;
        pts.push(new Phaser.Math.Vector2(x, elevY(fn(b)) + bob));
      }
      pts.push(new Phaser.Math.Vector2(VIEW_W + 10, HORIZON + bob + 2));
      g.fillStyle(color, alpha);
      g.fillPoints(pts, true);
    };
    layer(ridge, 0x8c8fb8, 0.85);
    // landmarks on the far ridge
    for (const lm of [LANDMARKS.baochu, LANDMARKS.leifeng]) {
      const x = bearingX(p, lm.bearing);
      if (Number.isNaN(x)) continue;
      const ground = elevY(ridge(lm.bearing)) + bob + 2;
      const top = elevY(lm.elev) + bob;
      if (lm === LANDMARKS.baochu) {
        tinyPagoda(g, x, ground, ground - top, 0x6b6f93, 1);
      } else {
        // 雷峰塔: broad and solid
        const hgt = ground - top;
        g.fillStyle(0x6b6f93, 1);
        for (let i = 0; i < 5; i++) {
          const w = hgt * (0.42 - i * 0.05);
          g.fillRect(x - w / 2, ground - (hgt * (i + 1)) / 5, w, hgt / 5 + 1);
          g.fillRect(x - w * 0.65, ground - (hgt * (i + 1)) / 5, w * 1.3, 2);
        }
      }
    }
    layer((b) => ridge(b + 11) * 0.5 + 0.25, 0x6f7a92, 0.9);
    // haze along the horizon
    g.fillStyle(0xf6d9b0, 0.35);
    g.fillRect(0, HORIZON - 14 + bob, VIEW_W, 16);
  }

  /** The island's low shoreline, seen from the boat. */
  private drawIsland(p: Pose, bob: number): void {
    const g = this.island;
    g.clear();
    const d = Math.hypot(ISLAND.x - p.x, ISLAND.y - p.y);
    if (d <= ISLAND.r + 1) return;
    const centre = bearingTo(p, ISLAND.x, ISLAND.y);
    const half = Math.asin(ISLAND.r / d) / deg;
    const rel = wrap180(centre - p.heading);
    const zNear = (d - ISLAND.r) * Math.cos(Math.min(80, Math.abs(rel)) * deg);
    if (zNear <= 1) return;
    const xl = bearingX(p, centre - half * 0.98);
    const xr = bearingX(p, centre + half * 0.98);
    if (Number.isNaN(xl) && Number.isNaN(xr)) return;
    const left = Number.isNaN(xl) ? -50 : xl;
    const right = Number.isNaN(xr) ? VIEW_W + 50 : xr;
    const baseY = HORIZON + (FOCAL * CAM_H) / zNear + bob;
    const bank = (FOCAL * 1.6) / zNear;
    const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(left, baseY)];
    const span = right - left;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = left + span * t;
      const hump = Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));
      pts.push(new Phaser.Math.Vector2(x, baseY - bank * (0.35 + 0.65 * hump)));
    }
    pts.push(new Phaser.Math.Vector2(right, baseY));
    g.fillStyle(0x3f5537, 1);
    g.fillPoints(pts, true);
    g.fillStyle(0x6f7c5a, 1);
    g.fillRect(left, baseY - 3, span, 3);
    // dark reflection of the bank
    g.fillStyle(0x2c3d3a, 0.35);
    g.fillRect(left, baseY, span, bank * 0.8);
    g.setDepth(20 + 300 / (1 + zNear * 0.05) + 0.2);
  }
}

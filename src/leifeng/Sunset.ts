import * as Phaser from 'phaser';
import { W, H } from '../core/config';
import { polyYAt } from '../art/paint';
import { ridge } from './art';

export interface SunsetOptions {
  horizon?: number;
  sunX?: number;
  sunY?: number;
  /** Parallax (0 = fixed to the screen). */
  scroll?: number;
  depth?: number;
  /** Draw the lake below the horizon (otherwise the scene paints its own ground). */
  lake?: boolean;
  /** 保俶塔 on the far northern hill. */
  baochu?: boolean;
}

/**
 * A West Lake sunset: violet-to-gold sky, the sun sinking behind the western
 * hills, and a path of light glittering across the water.
 */
export class Sunset {
  readonly horizon: number;
  readonly sun: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  private glitter: Phaser.GameObjects.Graphics | null = null;
  private farPts: Phaser.Math.Vector2[];
  private sunX: number;

  constructor(scene: Phaser.Scene, o: SunsetOptions = {}) {
    const hz = (this.horizon = o.horizon ?? 400);
    const sf = o.scroll ?? 0;
    const d = o.depth ?? 0;
    this.sunX = o.sunX ?? 1000;
    scene.add.image(0, 0, 'lfSky').setOrigin(0).setDisplaySize(W, hz + 4).setScrollFactor(sf).setDepth(d);
    this.glow = scene.add.image(this.sunX, o.sunY ?? 240, 'lfGlow').setScale(7).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setScrollFactor(sf).setDepth(d + 0.1);
    this.sun = scene.add.image(this.sunX, o.sunY ?? 240, 'lfSun').setScale(1.1).setScrollFactor(sf).setDepth(d + 0.2);
    // the hills: farthest (palest) first
    const g = scene.add.graphics().setScrollFactor(sf).setDepth(d + 0.3);
    this.farPts = ridge(g, hz - 8, 70, 41, 0xa8607a, 1);
    ridge(g, hz - 2, 46, 43, 0x7a4266, 1);
    if (o.baochu) {
      // 宝石山 and the slender 保俶塔 on the far north shore
      g.fillStyle(0x5e3458, 1);
      g.fillEllipse(260, hz + 4, 300, 70);
      g.fillStyle(0x5e3458, 1);
      g.fillTriangle(254, hz - 30, 266, hz - 30, 260, hz - 92);
      g.fillRect(259, hz - 104, 2, 14);
    }
    ridge(g, hz + 6, 22, 47, 0x553056, 1);
    if (o.lake !== false) {
      const lake = scene.add.graphics().setScrollFactor(sf).setDepth(d + 0.4);
      lake.fillGradientStyle(0xf2a868, 0xf2a868, 0x4a2c50, 0x4a2c50, 1);
      lake.fillRect(0, hz + 4, W, H - hz);
      // the reflection of the glowing sky near the horizon
      lake.fillStyle(0xffd890, 0.25);
      lake.fillRect(0, hz + 4, W, 10);
      this.glitter = scene.add.graphics().setScrollFactor(sf).setDepth(d + 0.5).setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  /** Height of the far hills at x — the sun sets behind them. */
  ridgeAt(x: number): number {
    return polyYAt(this.farPts, x);
  }

  setSun(y: number): void {
    this.sun.y = y;
    this.glow.y = y;
    // the lower the sun, the redder and dimmer it gets
    const k = Phaser.Math.Clamp((y - 200) / (this.horizon - 200), 0, 1);
    this.sun.setTint(Phaser.Display.Color.GetColor(255, Math.round(255 - k * 60), Math.round(255 - k * 120)));
    this.glow.setAlpha(0.55 - k * 0.15);
  }

  update(time: number): void {
    const g = this.glitter;
    if (!g) return;
    g.clear();
    const set = Phaser.Math.Clamp((this.sun.y - this.ridgeAt(this.sunX)) / 40, 0, 1);
    const strength = 1 - set * 0.85;
    for (let y = this.horizon + 8; y < H; y += 7) {
      const k = (y - this.horizon) / (H - this.horizon);
      const spread = 30 + k * 220;
      const n = 3 + Math.floor(k * 5);
      for (let i = 0; i < n; i++) {
        const seed = Math.sin(y * 12.9898 + i * 78.233) * 43758.5453;
        const fx = seed - Math.floor(seed);
        const flick = 0.5 + 0.5 * Math.sin(time * 0.004 + fx * 30 + y);
        const x = this.sunX + (fx - 0.5) * spread * 2;
        const len = 8 + k * 46 * fx;
        g.fillStyle(0xffd88a, 0.5 * flick * strength * (1 - Math.abs(fx - 0.5)));
        g.fillRect(x - len / 2, y, len, 1.6 + k * 1.6);
      }
    }
  }
}

import * as Phaser from 'phaser';
import { BOUGHS } from './art';
import { seeded } from './paint';

/** The breeze that moves every willow: a gentle sway, plus gusts that roll across as a wave (柳浪). */
export class Wind {
  private gusts: { start: number; from: number; to: number; dur: number; power: number }[] = [];
  base = 1;

  /** A gust sweeping from x=from to x=to over `dur` ms. */
  gust(now: number, from: number, to: number, dur = 2200, power = 1): void {
    this.gusts.push({ start: now, from, to, dur, power });
  }

  /** Sideways push at x, time t (in px for a strand tip). */
  at(x: number, t: number): number {
    let v = Math.sin(t * 0.0011 + x * 0.006) * 9 * this.base + Math.sin(t * 0.0023 + x * 0.013) * 4 * this.base;
    for (const g of this.gusts) {
      const k = (t - g.start) / g.dur;
      if (k < 0 || k > 1.4) continue;
      const front = g.from + (g.to - g.from) * k;
      const d = (x - front) / 160;
      v += Math.exp(-d * d) * 70 * g.power * Math.sign(g.to - g.from) * Math.min(1, (1.4 - k) * 2);
    }
    return v;
  }

  prune(t: number): void {
    this.gusts = this.gusts.filter((g) => (t - g.start) / g.dur < 1.5);
  }
}

interface Strand {
  ax: number;
  ay: number;
  len: number;
  out: number;
  phase: number;
  shade: number;
}

interface Push {
  x: number;
  y: number;
  dx: number;
  life: number;
}

const BARE = Phaser.Display.Color.ValueToColor(0x8a7458);
const BUD = Phaser.Display.Color.ValueToColor(0x9ac05a);
const LUSH = Phaser.Display.Color.ValueToColor(0x5a9a3a);

function mix(a: Phaser.Display.Color, b: Phaser.Display.Color, t: number): number {
  return Phaser.Display.Color.GetColor(a.red + (b.red - a.red) * t, a.green + (b.green - a.green) * t, a.blue + (b.blue - a.blue) * t);
}

/**
 * An old willow: a painted trunk and a curtain of living strands that sway in
 * the wind, part when you brush them aside, and green from bare twigs to full leaf.
 */
export class Willow {
  readonly x: number;
  readonly ground: number;
  readonly scale: number;
  green = 0;
  private strands: Strand[] = [];
  private pushes: Push[] = [];
  private g: Phaser.GameObjects.Graphics;
  readonly trunk: Phaser.GameObjects.Image;
  /** How far apart the strands have been pushed recently (0..1), for "is it parted?". */
  parted = 0;

  constructor(scene: Phaser.Scene, x: number, ground: number, scale: number, depth: number, seed: number, private wind: Wind) {
    this.x = x;
    this.ground = ground;
    this.scale = scale;
    this.trunk = scene.add.image(x, ground, 'llTrunk').setOrigin(0.5, 1).setScale(scale).setDepth(depth).setFlipX(seed % 2 === 1);
    this.g = scene.add.graphics().setDepth(depth + 0.5);
    const r = seeded(seed);
    const flip = seed % 2 === 1 ? -1 : 1;
    const topX = -4;
    const topY = -306;
    for (const [bx, by] of BOUGHS) {
      const n = 7;
      for (let k = 0; k < n; k++) {
        // strands hang all along each bough, not just from its tip, so the crown reads as one soft mass
        const u = 0.35 + (k / (n - 1)) * 0.65;
        const px = topX + (bx - topX) * u + (r() - 0.5) * 16;
        const py = topY + (by + 10 - topY) * u - Math.sin(u * Math.PI) * 26 + r() * 10;
        this.strands.push({
          ax: x + flip * px * scale,
          ay: ground + py * scale,
          len: (220 + r() * 190) * scale,
          out: Math.sign(bx || 1) * (6 + r() * 18) * scale,
          phase: r() * 6.28,
          shade: r(),
        });
      }
    }
  }

  /** Brush the strands sideways at a point (dx = the pointer's movement). */
  brush(x: number, y: number, dx: number): void {
    this.pushes.push({ x, y, dx: Phaser.Math.Clamp(dx * 3, -60, 60), life: 1 });
    if (this.pushes.length > 40) this.pushes.shift();
  }

  /** Is (x, y) inside this tree's curtain of strands? */
  covers(x: number, y: number): boolean {
    const top = this.ground - 440 * this.scale;
    const bottom = this.ground - 60 * this.scale;
    return Math.abs(x - this.x) < 150 * this.scale && y > top && y < bottom;
  }

  /** The middle of the curtain (where a hidden bird would sit). */
  heart(): { x: number; y: number } {
    return { x: this.x + 10 * this.scale, y: this.ground - 300 * this.scale };
  }

  update(t: number, dt: number): void {
    for (const p of this.pushes) p.life -= dt * 0.7;
    this.pushes = this.pushes.filter((p) => p.life > 0);
    // how parted the curtain is right now
    let open = 0;
    for (const p of this.pushes) open += Math.abs(p.dx) * p.life;
    this.parted = Math.min(1, open / 260);
    const g = this.g;
    g.clear();
    const green = this.green;
    const stemCol = green < 0.5 ? mix(BARE, BUD, green * 2) : mix(BUD, LUSH, (green - 0.5) * 2);
    const SEG = 10;
    for (const s of this.strands) {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= SEG; i++) {
        const k = i / SEG;
        let x = s.ax + s.out * Math.sin(k * Math.PI * 0.5);
        const y = s.ay + s.len * k;
        // the breeze, strongest at the tips
        x += (this.wind.at(s.ax, t) + Math.sin(t * 0.002 + s.phase) * 3) * Math.pow(k, 1.6);
        // hands brushing the strands aside
        for (const p of this.pushes) {
          const dd = ((x - p.x) * (x - p.x)) / 3600 + ((y - p.y) * (y - p.y)) / 14400;
          x += p.dx * p.life * Math.exp(-dd) * k;
        }
        pts.push(new Phaser.Math.Vector2(x, y));
      }
      const shade = 0.8 + s.shade * 0.4;
      const col = Phaser.Display.Color.ValueToColor(stemCol);
      g.lineStyle(1.3 * this.scale + 0.4, Phaser.Display.Color.GetColor(Math.min(255, col.red * shade), Math.min(255, col.green * shade), Math.min(255, col.blue * shade)), 0.95);
      g.strokePoints(pts, false, false);
      // buds, then leaves, along the strand
      if (green > 0.05) {
        const step = green > 0.6 ? 1 : 2;
        for (let i = 2; i <= SEG; i += step) {
          const p = pts[i];
          const leaf = (2 + green * 5) * this.scale + 0.5;
          const lc = green < 0.5 ? 0xb8d070 : s.shade > 0.5 ? 0x6aaa48 : 0x4f8a38;
          g.fillStyle(lc, Math.min(1, green * 1.6));
          g.fillEllipse(p.x - leaf * 0.7, p.y, leaf * 0.7, leaf * 1.8);
          g.fillEllipse(p.x + leaf * 0.7, p.y + leaf * 0.6, leaf * 0.7, leaf * 1.8);
        }
      }
    }
  }

  destroy(): void {
    this.g.destroy();
    this.trunk.destroy();
  }
}

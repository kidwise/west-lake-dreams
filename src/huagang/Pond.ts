import * as Phaser from 'phaser';
import { W, H } from '../core/config';
import { rng } from '../art/paint';
import { KoiBody, koiTopTexture, pondMix, variety, type VarietyId } from './koi';

/**
 * 红鱼池 seen from the zig-zag bridge (曲桥): looking straight down into the
 * water. Depths: floor 0 · caustics 2 · shadows 10 · fish 20–40 · pellets 50 ·
 * pads 60 · bridge 70 · sheen 80 · railing 90.
 */
type G = Phaser.GameObjects.Graphics;

export const POND = { left: 30, right: W - 30, top: 96, bottom: 660 };

/** The other zig-zag bridge across the pond (曲桥), as a polyline. */
const BRIDGE = [
  [-40, 330],
  [150, 330],
  [150, 230],
  [380, 230],
  [380, 150],
  [560, 150],
  [560, 60],
  [600, -40],
];

export function paintPond(scene: Phaser.Scene, opts: { railing?: boolean } = {}): { update: (time: number) => void } {
  const r = rng(77);
  // the pond floor: deeper in the middle, pebbles and dark weed
  const floor = scene.add.graphics().setDepth(0);
  floor.fillGradientStyle(0x2e6e66, 0x2a6563, 0x1b4a52, 0x1d4d55, 1);
  floor.fillRect(0, 0, W, H);
  for (let i = 0; i < 28; i++) {
    floor.fillStyle(0x0f3a40, 0.18 + r() * 0.12);
    floor.fillEllipse(r() * W, r() * H, 120 + r() * 220, 60 + r() * 110);
  }
  for (let i = 0; i < 220; i++) {
    floor.fillStyle(r() < 0.5 ? 0x5d8a78 : 0x26525a, 0.35 + r() * 0.3);
    floor.fillEllipse(r() * W, r() * H, 4 + r() * 10, 3 + r() * 7);
  }

  const caustA = scene.add.tileSprite(0, 0, W, H, 'hgCaustic').setOrigin(0).setDepth(2).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);
  const caustB = scene.add.tileSprite(0, 0, W, H, 'hgCaustic').setOrigin(0).setDepth(2).setAlpha(0.14).setBlendMode(Phaser.BlendModes.ADD).setTileScale(1.4);
  // a fainter layer of the same light on the fishes' backs
  const caustTop = scene.add.tileSprite(0, 0, W, H, 'hgCaustic').setOrigin(0).setDepth(45).setAlpha(0.07).setBlendMode(Phaser.BlendModes.ADD);

  // banks: Taihu rocks and grass along the top, and a little island top-right
  const bank = scene.add.graphics().setDepth(65);
  bank.fillStyle(0x0d3a30, 0.25);
  bank.fillRect(0, 0, W, 92);
  bank.fillStyle(0x6c9a54, 1);
  bank.fillRect(0, 0, W, 70);
  for (let x = 0; x < W; x += 26) {
    bank.fillStyle(0x7fae62, 1);
    bank.fillEllipse(x + r() * 10, 52 + r() * 14, 46, 24);
  }
  const rock = (x: number, y: number, s: number) => {
    bank.fillStyle(0x3d4a4a, 0.35);
    bank.fillEllipse(x + 8, y + 10, 70 * s, 44 * s);
    bank.fillStyle(0xa7a59c, 1);
    bank.fillEllipse(x, y, 66 * s, 42 * s);
    bank.fillStyle(0xc6c3b8, 1);
    bank.fillEllipse(x - 8 * s, y - 6 * s, 40 * s, 22 * s);
    bank.fillStyle(0x5f6262, 0.8);
    bank.fillCircle(x + 10 * s, y + 2 * s, 5 * s);
    bank.fillCircle(x - 14 * s, y + 6 * s, 3.5 * s);
  };
  for (let x = 40; x < W; x += 110 + r() * 60) rock(x, 70 + r() * 16, 0.7 + r() * 0.5);
  // the island
  bank.fillStyle(0x0d3a30, 0.25);
  bank.fillEllipse(W - 60, 130, 420, 250);
  bank.fillStyle(0x6c9a54, 1);
  bank.fillEllipse(W - 70, 110, 400, 230);
  for (let i = 0; i < 6; i++) rock(W - 250 + i * 46, 200 + Math.sin(i) * 14, 0.6 + r() * 0.3);
  // a tree on the island, seen from above
  const crown = scene.add.graphics().setDepth(86);
  crown.fillStyle(0x0d2a20, 0.25);
  crown.fillCircle(W - 110, 110, 120);
  for (let i = 0; i < 30; i++) {
    crown.fillStyle([0x3a7038, 0x4f8f4a, 0x5f9f50][i % 3], 1);
    crown.fillCircle(W - 130 + (r() - 0.5) * 170, 80 + (r() - 0.5) * 140, 30 + r() * 26);
  }
  for (let i = 0; i < 14; i++) {
    crown.fillStyle(0x79b06a, 0.8);
    crown.fillCircle(W - 150 + (r() - 0.5) * 140, 60 + (r() - 0.5) * 110, 12 + r() * 12);
  }

  // the zig-zag bridge with its shadow on the water
  const bridge = scene.add.graphics().setDepth(70);
  const shadow = scene.add.graphics().setDepth(12);
  const seg = (g: G, w: number, color: number, alpha: number, dx = 0, dy = 0) => {
    g.lineStyle(w, color, alpha);
    for (let i = 0; i < BRIDGE.length - 1; i++) {
      g.lineBetween(BRIDGE[i][0] + dx, BRIDGE[i][1] + dy, BRIDGE[i + 1][0] + dx, BRIDGE[i + 1][1] + dy);
    }
    g.fillStyle(color, alpha);
    for (const [x, y] of BRIDGE) g.fillRect(x - w / 2 + dx, y - w / 2 + dy, w, w);
  };
  seg(shadow, 60, 0x0b2c2e, 0.3, 14, 18);
  seg(bridge, 58, 0xb8b0a0, 1);
  seg(bridge, 50, 0xdcd6c8, 1);
  // stone slabs and rail posts
  for (let i = 0; i < BRIDGE.length - 1; i++) {
    const [x0, y0] = BRIDGE[i];
    const [x1, y1] = BRIDGE[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = (x1 - x0) / len;
    const ny = (y1 - y0) / len;
    for (let d = 0; d < len; d += 34) {
      const x = x0 + nx * d;
      const y = y0 + ny * d;
      bridge.lineStyle(1, 0xa69e8e, 0.7);
      bridge.lineBetween(x - ny * 24, y + nx * 24, x + ny * 24, y - nx * 24);
      bridge.fillStyle(0xa0988a, 1);
      bridge.fillRect(x - ny * 26 - 3, y + nx * 26 - 3, 6, 6);
      bridge.fillRect(x + ny * 26 - 3, y - nx * 26 - 3, 6, 6);
    }
  }
  // lily pads, some with flowers
  const pads: [number, number, number][] = [
    [90, 560, 1], [150, 610, 0.8], [60, 470, 0.7], [210, 640, 0.9],
    [1180, 480, 1], [1230, 560, 0.8], [1120, 600, 0.7],
    [760, 120, 0.8], [820, 160, 0.6],
  ];
  pads.forEach(([x, y, s], i) => {
    scene.add.image(x, y, 'hgPad').setScale(s).setAngle(r() * 360).setDepth(60);
    if (i % 3 === 0) scene.add.image(x + 10, y - 6, 'hgLily').setScale(s * 0.9).setDepth(61);
  });

  // a willow hanging in from the top-left corner
  const willow = scene.add.graphics().setDepth(87);
  const strands = Array.from({ length: 18 }, () => ({ x: r() * 360, len: 160 + r() * 240, ph: r() * 6 }));

  const sheen = scene.add.tileSprite(0, 0, W, H, 'hgSheen').setOrigin(0).setDepth(80).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD);

  if (opts.railing !== false) paintRailing(scene);

  return {
    update: (time: number) => {
      caustA.tilePositionX = time * 0.012;
      caustA.tilePositionY = time * 0.008;
      caustB.tilePositionX = -time * 0.009;
      caustB.tilePositionY = time * 0.011;
      caustTop.tilePositionX = time * 0.012;
      caustTop.tilePositionY = time * 0.008;
      sheen.tilePositionX = time * 0.006;
      willow.clear();
      for (const s of strands) {
        const sway = Math.sin(time * 0.0008 + s.ph) * 14;
        willow.lineStyle(1.5, 0x5a7a3a, 0.9);
        willow.beginPath();
        willow.moveTo(s.x, -10);
        for (let k = 1; k <= 8; k++) {
          const t = k / 8;
          willow.lineTo(s.x + sway * t * t + t * 30, -10 + s.len * t);
        }
        willow.strokePath();
        for (let k = 2; k <= 8; k++) {
          const t = k / 8;
          const x = s.x + sway * t * t + t * 30;
          const y = -10 + s.len * t;
          willow.fillStyle(k % 2 ? 0x8bbf5a : 0x6aa04a, 1);
          willow.fillEllipse(x + 5, y, 12, 4);
          willow.fillEllipse(x - 5, y + 5, 12, 4);
        }
      }
    },
  };
}

/** The stone railing of our bridge along the bottom edge, where we lean over to look down. */
function paintRailing(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(90);
  g.fillStyle(0x0b2c2e, 0.35);
  g.fillRect(0, H - 92, W, 30);
  g.fillStyle(0xbdb6a7, 1);
  g.fillRect(0, H - 76, W, 76);
  g.fillStyle(0xd8d2c4, 1);
  g.fillRect(0, H - 76, W, 22);
  g.lineStyle(2, 0xa69e8e, 1);
  for (let x = 0; x < W; x += 160) {
    g.strokeRect(x + 6, H - 50, 148, 44);
    g.fillStyle(0xcfc8bb, 1);
    g.fillRect(x - 12, H - 88, 24, 88);
    g.fillStyle(0xe2dccf, 1);
    g.fillRect(x - 12, H - 88, 24, 10);
  }
}

// ---- fish food and the fish ---------------------------------------------------------

export interface Pellet {
  x: number;
  y: number;
  img: Phaser.GameObjects.Image;
  landed: boolean;
  born: number;
  gone: boolean;
}

export interface PondFish {
  body: KoiBody;
  variety: VarietyId;
  tex: string;
  x: number;
  y: number;
  heading: number;
  speed: number;
  size: number;
  hunger: number;
  wave: number;
  bend: number;
  turn: number;
  target: Pellet | null;
  retarget: number;
  lift: number;
  gulp: number;
  shy: boolean;
  /** Formation target (the finale); null = swim freely. */
  goal: { x: number; y: number; a: number } | null;
}

export interface SchoolEvents {
  onGulp?: (f: PondFish) => void;
  onMountain?: (n: number, x: number, y: number) => void;
}

const angleDiff = (a: number, b: number) => Phaser.Math.Angle.Wrap(b - a);

/** All the koi in the pond and the food floating on it. */
export class School {
  readonly fish: PondFish[] = [];
  readonly pellets: Pellet[] = [];
  private scene: Phaser.Scene;
  private mouths: Phaser.GameObjects.Graphics;
  private ev: SchoolEvents;
  private mountainCheck = 0;
  private lastMountain = -99999;
  /** Biggest crowd of feeding fish seen so far. */
  best = 0;

  constructor(scene: Phaser.Scene, count: number, seed: number, ev: SchoolEvents = {}) {
    this.scene = scene;
    this.ev = ev;
    this.mouths = scene.add.graphics().setDepth(55);
    const r = rng(seed);
    pondMix(count, seed).forEach((v, i) => {
      const tex = koiTopTexture(scene, v, seed * 1000 + i);
      const body = new KoiBody(scene, tex, { shadow: true });
      const big = v === 'higoi' || v === 'kohaku' || v === 'showa';
      this.fish.push({
        body,
        variety: v,
        tex,
        x: POND.left + r() * (POND.right - POND.left),
        y: POND.top + r() * (POND.bottom - POND.top),
        heading: r() * Math.PI * 2,
        speed: 40,
        size: (big ? 0.75 : 0.6) + r() * (big ? 0.5 : 0.3),
        hunger: 0.6 + r() * 0.4,
        wave: r() * 6,
        bend: 0,
        turn: 0,
        target: null,
        retarget: r(),
        lift: 0,
        gulp: 0,
        shy: variety(v).shy,
        goal: null,
      });
    });
  }

  /** Drop a pellet onto the water at (x, y) after a flight from (fx, fy). */
  throwPellet(fx: number, fy: number, x: number, y: number, delay = 0): void {
    const img = this.scene.add.image(fx, fy, 'hgPellet').setDepth(95).setScale(1.6);
    const p: Pellet = { x, y, img, landed: false, born: this.scene.time.now, gone: false };
    this.pellets.push(p);
    const dur = 380 + Math.hypot(x - fx, y - fy) * 0.35;
    this.scene.tweens.add({ targets: img, x, y, delay, duration: dur, ease: 'Quad.easeOut' });
    this.scene.tweens.add({
      targets: img,
      scale: { from: 1.8, to: 1 },
      delay,
      duration: dur,
      ease: 'Quad.easeIn',
      onComplete: () => {
        p.landed = true;
        img.setDepth(50);
        this.ripple(x, y, 0.35);
      },
    });
  }

  ripple(x: number, y: number, scale = 0.5, depth = 52): void {
    const ring = this.scene.add.image(x, y, 'hgRing').setScale(scale * 0.3).setAlpha(0.8).setDepth(depth);
    this.scene.tweens.add({ targets: ring, scale, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }

  update(dt: number, time: number): void {
    const fish = this.fish;
    const sec = dt / 1000;
    // pellets drift a little and slowly dissolve
    for (const p of this.pellets) {
      if (!p.landed || p.gone) continue;
      p.x += Math.sin(time * 0.0007 + p.born) * 0.08;
      p.y += Math.cos(time * 0.0006 + p.born) * 0.06;
      p.img.setPosition(p.x, p.y);
      if (time - p.born > 40000) this.removePellet(p);
    }
    for (let i = this.pellets.length - 1; i >= 0; i--) if (this.pellets[i].gone) this.pellets.splice(i, 1);

    for (const f of fish) {
      // choose food
      f.retarget -= sec;
      if (f.target?.gone) f.target = null;
      if (f.retarget <= 0 && !f.goal) {
        f.retarget = 0.2 + Math.random() * 0.2;
        f.target = this.pickPellet(f);
      }
      let desired = f.heading;
      let want = 38 + 18 * f.size;
      let turnRate = 1.6;
      if (f.goal) {
        const dx = f.goal.x - f.x;
        const dy = f.goal.y - f.y;
        const d = Math.hypot(dx, dy);
        desired = d > 6 ? Math.atan2(dy, dx) : f.goal.a;
        want = Math.min(220, d * 2.2 + 8);
        turnRate = 5;
      } else if (f.target) {
        desired = Math.atan2(f.target.y - f.y, f.target.x - f.x);
        want = 120 + 60 * f.size + 60 * f.hunger;
        turnRate = 4.5;
      } else {
        desired = f.heading + Math.sin(time * 0.0004 + f.wave * 3) * 0.9;
      }
      // keep inside the pond
      const m = 70;
      let bx = 0;
      let by = 0;
      if (f.x < POND.left + m) bx = 1;
      if (f.x > POND.right - m) bx = -1;
      if (f.y < POND.top + m) by = 1;
      if (f.y > POND.bottom - m) by = -1;
      if ((bx || by) && !f.goal) {
        desired = Math.atan2(Math.sin(desired) + by * 2, Math.cos(desired) + bx * 2);
        turnRate = Math.max(turnRate, 2.6);
      }
      // separation (feeding fish crowd in; big fish shove small ones)
      let sx = 0;
      let sy = 0;
      let crowd = 0;
      for (const o of fish) {
        if (o === f) continue;
        const dx = f.x - o.x;
        const dy = f.y - o.y;
        const rr = 26 * (f.size + o.size);
        const d2 = dx * dx + dy * dy;
        if (d2 > rr * rr || d2 < 0.01) continue;
        const d = Math.sqrt(d2);
        const push = ((rr - d) / rr) * (o.size / f.size);
        sx += (dx / d) * push;
        sy += (dy / d) * push;
        if (f.target && o.target && d < 40 * f.size + 20) crowd++;
      }
      const sepW = f.goal ? 0 : f.target ? 0.35 : 1.2;
      if (sx || sy) {
        f.x += sx * sepW * 40 * sec;
        f.y += sy * sepW * 40 * sec;
      }
      // steer
      const diff = angleDiff(f.heading, desired);
      const maxTurn = turnRate * sec;
      const turn = Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
      f.heading = Phaser.Math.Angle.Wrap(f.heading + turn);
      f.turn += (turn / Math.max(sec, 0.001) - f.turn) * 0.1;
      f.speed += (want * (Math.abs(diff) > 1.6 && !f.goal ? 0.5 : 1) - f.speed) * Math.min(1, sec * 3);
      f.x += Math.cos(f.heading) * f.speed * sec;
      f.y += Math.sin(f.heading) * f.speed * sec;
      // eat
      if (f.target && f.target.landed && !f.target.gone && f.gulp <= 0) {
        const hx = f.x + Math.cos(f.heading) * 4;
        const hy = f.y + Math.sin(f.heading) * 4;
        if (Math.hypot(f.target.x - hx, f.target.y - hy) < 12 * f.size + 4) {
          this.removePellet(f.target);
          f.target = null;
          f.gulp = 1;
          f.hunger = Math.max(0.15, f.hunger - 0.06);
          this.ev.onGulp?.(f);
        }
      }
      f.hunger = Math.min(1, f.hunger + sec * 0.01);
      f.gulp = Math.max(0, f.gulp - sec * 1.6);
      // climbing over each other when the crowd is thick (鱼山)
      const liftWant = f.target ? Phaser.Math.Clamp((crowd - 1) / 4, 0, 1) : 0;
      f.lift += (liftWant - f.lift) * Math.min(1, sec * 4);

      // swim animation
      f.wave += sec * (4 + f.speed * 0.06);
      const amp = (f.goal ? 0.6 : 1) * (0.12 + Math.min(0.32, f.speed * 0.0016));
      f.bend = Phaser.Math.Clamp(-f.turn * 0.35, -0.9, 0.9);
      const s = f.size * (1 + 0.22 * f.lift) * 0.8;
      const jx = f.lift > 0.3 ? Math.sin(time * 0.03 + f.wave) * 1.5 * f.lift : 0;
      f.body.pose(f.x + jx, f.y, f.heading, f.bend, f.wave, amp, s);
      f.body.poseShadow(8 + 16 * f.lift, 12 + 22 * f.lift, s);
      f.body.setDepth(20 + f.lift * 12 + f.size * 2);
    }

    // open mouths at the surface around the food (嘬)
    const g = this.mouths;
    g.clear();
    for (const f of fish) {
      const near = f.target && f.target.landed && Math.hypot(f.target.x - f.x, f.target.y - f.y) < 90;
      if (!near && f.gulp <= 0) continue;
      const s = f.size * 0.8;
      const hx = f.x + Math.cos(f.heading) * 3 * s;
      const hy = f.y + Math.sin(f.heading) * 3 * s;
      const open = 0.5 + 0.5 * Math.sin(time * 0.025 + f.wave * 2);
      g.fillStyle(0xf3d2c0, 0.9);
      g.fillCircle(hx, hy, (4.5 + open * 1.5) * s * 1.4);
      g.fillStyle(0x3a1a1a, 1);
      g.fillCircle(hx, hy, (2 + open * 2.4) * s * 1.4);
      if (f.lift > 0.4) {
        // water splashing off the heads at the top of the pile
        g.fillStyle(0xffffff, 0.5 * f.lift);
        g.fillCircle(hx + Math.sin(time * 0.05 + f.wave) * 8, hy + Math.cos(time * 0.04 + f.wave) * 8, 2);
      }
    }

    // the biggest crowd right now
    this.mountainCheck -= sec;
    if (this.mountainCheck <= 0) {
      this.mountainCheck = 0.3;
      let bestN = 0;
      let bx = 0;
      let by = 0;
      for (const f of fish) {
        if (!f.target) continue;
        let n = 1;
        for (const o of fish) if (o !== f && o.target && Math.hypot(o.x - f.x, o.y - f.y) < 85) n++;
        if (n > bestN) {
          bestN = n;
          bx = f.x;
          by = f.y;
        }
      }
      if (bestN > this.best) this.best = bestN;
      if (bestN >= 12 && time - this.lastMountain > 4000) {
        this.lastMountain = time;
        this.ev.onMountain?.(bestN, bx, by);
      }
    }
  }

  private pickPellet(f: PondFish): Pellet | null {
    const sense = 230 + 220 * f.hunger;
    let best: Pellet | null = null;
    let bestCost = Infinity;
    for (const p of this.pellets) {
      if (p.gone) continue;
      const d = Math.hypot(p.x - f.x, p.y - f.y);
      if (d > sense) continue;
      if (f.shy) {
        // shy fish only go for food that the big crowd isn't already on
        let rivals = 0;
        for (const o of this.fish) if (!o.shy && Math.hypot(o.x - p.x, o.y - p.y) < 95) rivals++;
        if (rivals >= 2) continue;
      }
      const cost = d - 60 * f.size + (p.landed ? 0 : 40);
      if (cost < bestCost) {
        bestCost = cost;
        best = p;
      }
    }
    return best;
  }

  private removePellet(p: Pellet): void {
    if (p.gone) return;
    p.gone = true;
    p.img.destroy();
    this.ripple(p.x, p.y, 0.25);
  }

  destroy(): void {
    for (const f of this.fish) f.body.destroy();
    for (const p of this.pellets) p.img.destroy();
    this.mouths.destroy();
  }
}

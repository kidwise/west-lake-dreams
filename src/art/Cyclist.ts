import * as Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;

export interface Look {
  shirt: number;
  pants: number;
  bike: number;
  hair: 'short' | 'cap' | 'ponytail';
  cap?: number;
  backpack?: boolean;
}

export const LOOKS: Record<'me' | 'gogo' | 'koko', Look> = {
  me: { shirt: 0xf5f0e1, pants: 0x34495e, bike: 0xc0392b, hair: 'short', backpack: true },
  gogo: { shirt: 0x5dade2, pants: 0x2c3e50, bike: 0x1f618d, hair: 'cap', cap: 0xf4d03f },
  koko: { shirt: 0xf1948a, pants: 0x5b4b8a, bike: 0x17a589, hair: 'ponytail' },
};

const SKIN = 0xf1c7a5;
const HAIR = 0x2b2522;
const R = 26; // wheel radius

const P = (x: number, y: number) => ({ x, y });
type Pt = { x: number; y: number };

/** Two-bone IK: returns the joint (knee/elbow) between a and b. */
function joint(a: Pt, b: Pt, l1: number, l2: number, bendSign: number): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 0.01);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const ang = Math.atan2(dy, dx) + bendSign * Math.acos(Phaser.Math.Clamp(cosA, -1, 1));
  return P(a.x + Math.cos(ang) * l1, a.y + Math.sin(ang) * l1);
}

function limb(g: G, a: Pt, j: Pt, b: Pt, width: number, color: number): void {
  g.lineStyle(width, color, 1);
  g.lineBetween(a.x, a.y, j.x, j.y);
  g.lineBetween(j.x, j.y, b.x, b.y);
  g.fillStyle(color, 1);
  g.fillCircle(j.x, j.y, width / 2);
  g.fillCircle(b.x, b.y, width / 2);
}

function head(g: G, cx: number, cy: number, look: Look, facing = 1): void {
  if (look.hair === 'ponytail') {
    g.fillStyle(HAIR, 1);
    g.fillEllipse(cx - 13 * facing, cy + 6, 10, 22);
  }
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(HAIR, 1);
  g.slice(cx, cy, 11.5, Math.PI * 0.95, Math.PI * 2.05, false);
  g.fillPath();
  if (look.hair === 'cap') {
    g.fillStyle(look.cap ?? 0xf4d03f, 1);
    g.slice(cx, cy - 1, 12.5, Math.PI, Math.PI * 2, false);
    g.fillPath();
    g.fillRect(facing > 0 ? cx + 2 : cx - 18, cy - 3, 16, 3.5);
  }
  g.fillStyle(0x222222, 1);
  g.fillCircle(cx + 6 * facing, cy + 1, 1.5);
  g.fillStyle(0xe8988a, 0.6);
  g.fillCircle(cx + 4 * facing, cy + 5, 2.4);
}

/** Bike + rider drawn procedurally each frame so wheels, pedals and pose animate. */
export class Cyclist {
  readonly g: G;
  look: Look;
  wheelAngle = 0;
  crank = 0;
  cameraUp = false;
  withRider = true;

  constructor(scene: Phaser.Scene, look: Look, scale = 1) {
    this.look = look;
    this.g = scene.add.graphics();
    this.g.setScale(scale);
    this.draw();
  }

  /** Advance the animation: `dist` = distance travelled this frame, `pedaling` = legs turning. */
  roll(dist: number, pedaling: boolean): void {
    this.wheelAngle += dist / R;
    if (pedaling) this.crank += dist / (R * 1.6);
  }

  draw(): void {
    const g = this.g;
    const L = this.look;
    g.clear();

    const RH = P(-36, -R);
    const FH = P(36, -R);
    const BB = P(-4, -24);
    const SC = P(-12, -58);
    const HT = P(24, -60);
    const HB = P(28, -48);
    const SADDLE = P(-15, -68);
    const GRIP = P(18, -74);
    const crankLen = 10;
    const p1 = P(BB.x + Math.cos(this.crank) * crankLen, BB.y + Math.sin(this.crank) * crankLen);
    const p2 = P(BB.x - Math.cos(this.crank) * crankLen, BB.y - Math.sin(this.crank) * crankLen);

    const HIP = P(-14, -76);
    const SH = P(4, -108);
    const HEAD = P(12, -123);
    const pantsFar = Phaser.Display.Color.IntegerToColor(L.pants).darken(18).color;
    const shirtFar = Phaser.Display.Color.IntegerToColor(L.shirt).darken(14).color;

    // shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(0, 2, 120, 10);

    if (this.withRider) {
      // far leg + far arm (behind the frame)
      limb(g, HIP, joint(HIP, p2, 29, 29, -1), p2, 9, pantsFar);
      const farHand = GRIP;
      limb(g, SH, joint(SH, farHand, 20, 20, 1), farHand, 6, shirtFar);
    }

    // wheels
    for (const hub of [RH, FH]) {
      g.lineStyle(4.5, 0x2d2d2d, 1);
      g.strokeCircle(hub.x, hub.y, R);
      g.lineStyle(1.5, 0xa0a0a0, 1);
      g.strokeCircle(hub.x, hub.y, R - 4);
      g.lineStyle(1, 0x9a9a9a, 0.9);
      for (let i = 0; i < 8; i++) {
        const a = this.wheelAngle + (i * Math.PI) / 4;
        g.lineBetween(hub.x, hub.y, hub.x + Math.cos(a) * (R - 4), hub.y + Math.sin(a) * (R - 4));
      }
      g.fillStyle(0x555555, 1);
      g.fillCircle(hub.x, hub.y, 3);
    }

    // frame
    g.lineStyle(4.5, L.bike, 1);
    g.lineBetween(RH.x, RH.y, BB.x, BB.y);
    g.lineBetween(RH.x, RH.y, SC.x, SC.y);
    g.lineBetween(BB.x, BB.y, SC.x, SC.y);
    g.lineBetween(SC.x, SC.y, HT.x, HT.y);
    g.lineBetween(BB.x, BB.y, HB.x, HB.y);
    g.lineBetween(HT.x, HT.y, FH.x, FH.y);
    // seatpost, saddle, stem, bars
    g.lineStyle(3, 0x444444, 1);
    g.lineBetween(SC.x, SC.y, SADDLE.x, SADDLE.y);
    g.lineBetween(HT.x, HT.y, 22, -72);
    g.lineBetween(22, -72, GRIP.x - 4, GRIP.y);
    g.fillStyle(0x3b2f2a, 1);
    g.fillRoundedRect(SADDLE.x - 11, SADDLE.y - 4, 22, 6, 3);
    // front basket
    g.fillStyle(0xc9a26b, 1);
    g.fillRect(30, -78, 16, 14);
    g.lineStyle(1, 0x9c7a4a, 1);
    g.lineBetween(30, -71, 46, -71);
    // chainring + crank
    g.lineStyle(2, 0x666666, 1);
    g.strokeCircle(BB.x, BB.y, 6);
    g.lineStyle(3, 0x333333, 1);
    g.lineBetween(p1.x, p1.y, p2.x, p2.y);

    if (!this.withRider) return;

    // near leg
    limb(g, HIP, joint(HIP, p1, 29, 29, -1), p1, 10, L.pants);
    g.fillStyle(0x333333, 1);
    g.fillRoundedRect(p1.x - 6, p1.y - 3, 13, 5, 2);

    // backpack
    if (L.backpack) {
      g.fillStyle(0x2e6f8e, 1);
      g.fillRoundedRect(-22, -110, 16, 30, 6);
      g.fillStyle(0x245a74, 1);
      g.fillRoundedRect(-22, -94, 14, 12, 4);
    }

    // torso
    g.lineStyle(17, L.shirt, 1);
    g.lineBetween(HIP.x, HIP.y, SH.x, SH.y);
    g.fillStyle(L.shirt, 1);
    g.fillCircle(SH.x, SH.y, 8.5);
    g.fillCircle(HIP.x, HIP.y, 8.5);
    if (L.backpack) {
      g.lineStyle(3, 0x1d4a60, 1);
      g.lineBetween(-8, -82, SH.x + 2, SH.y + 2);
    }

    head(g, HEAD.x, HEAD.y, L);

    // near arm: on the handlebar, or raised holding the camera
    if (this.cameraUp) {
      const hand = P(34, -116);
      limb(g, SH, joint(SH, hand, 18, 18, 1), hand, 7, L.shirt);
      g.fillStyle(SKIN, 1);
      g.fillCircle(hand.x, hand.y, 4);
      g.fillStyle(0x2b2b2b, 1);
      g.fillRoundedRect(hand.x - 2, hand.y - 9, 22, 15, 3);
      g.fillStyle(0x666666, 1);
      g.fillCircle(hand.x + 16, hand.y - 1, 5);
      g.fillStyle(0x9fd3ff, 1);
      g.fillCircle(hand.x + 16, hand.y - 1, 2.5);
      // camera strap
      g.lineStyle(1.5, 0x222222, 1);
      g.lineBetween(hand.x, hand.y - 6, SH.x + 4, SH.y + 6);
    } else {
      limb(g, SH, joint(SH, GRIP, 20, 20, 1), GRIP, 7, L.shirt);
      g.fillStyle(SKIN, 1);
      g.fillCircle(GRIP.x, GRIP.y, 4);
    }
  }
}

/** A standing figure (for the pavilion scene). Ground at y=0. */
export function drawPerson(g: G, look: Look, opts: { facing?: 1 | -1; armUp?: boolean; backpack?: boolean } = {}): void {
  const f = opts.facing ?? 1;
  g.clear();
  g.fillStyle(0x000000, 0.12);
  g.fillEllipse(0, 2, 46, 8);
  // legs
  g.lineStyle(10, look.pants, 1);
  g.lineBetween(-5, -58, -7, -4);
  g.lineBetween(5, -58, 7, -4);
  g.fillStyle(0x333333, 1);
  g.fillRoundedRect(-14 + (f > 0 ? 2 : -2), -6, 14, 6, 2);
  g.fillRoundedRect(1 + (f > 0 ? 2 : -2), -6, 14, 6, 2);
  // backpack
  if (opts.backpack) {
    g.fillStyle(0x2e6f8e, 1);
    g.fillRoundedRect(-f * 20 - 8, -98, 16, 32, 6);
  }
  // torso
  g.fillStyle(look.shirt, 1);
  g.fillRoundedRect(-14, -102, 28, 48, 9);
  // arms
  g.lineStyle(7, look.shirt, 1);
  g.lineBetween(-12, -96, -16, -64);
  if (opts.armUp) {
    g.lineBetween(12, -96, 26 * f > 0 ? 24 : -24, -124);
    g.fillStyle(SKIN, 1);
    g.fillCircle(f > 0 ? 24 : -24, -126, 4.5);
  } else {
    g.lineBetween(12, -96, 16, -64);
    g.fillStyle(SKIN, 1);
    g.fillCircle(16, -62, 4);
  }
  g.fillStyle(SKIN, 1);
  g.fillCircle(-16, -62, 4);
  head(g, 0, -116, look, f);
}

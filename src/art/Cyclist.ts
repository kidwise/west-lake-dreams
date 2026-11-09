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

/**
 * How the kids are outlined. The game uses 'soft': a faint, darker edge of each
 * part's own colour, in the clean style of 曲院风荷 and 花港观鱼.
 */
export type OutlineMode = 'ink' | 'soft' | 'none';
let OUTLINE: OutlineMode = 'soft';
export function setOutlineMode(m: OutlineMode): void {
  OUTLINE = m;
}
const inkC = () => (OUTLINE === 'ink' ? 0x3a2a22 : 0x000000);
const inkA = (a: number) => (OUTLINE === 'ink' ? a : OUTLINE === 'soft' ? a * 0.16 : 0);

/** Darker shade of a colour (for the shadowed side of clothes). */
export function shade(c: number, amt = 16): number {
  return Phaser.Display.Color.IntegerToColor(c).darken(amt).color;
}

function limb(g: G, a: Pt, j: Pt, b: Pt, width: number, color: number): void {
  // ink outline first, then the colour on top, like a picture book
  g.lineStyle(width + 2.4, inkC(), inkA(0.85));
  g.lineBetween(a.x, a.y, j.x, j.y);
  g.lineBetween(j.x, j.y, b.x, b.y);
  g.fillStyle(inkC(), inkA(0.85));
  g.fillCircle(j.x, j.y, width / 2 + 1.2);
  g.fillCircle(b.x, b.y, width / 2 + 1.2);
  g.lineStyle(width, color, 1);
  g.lineBetween(a.x, a.y, j.x, j.y);
  g.lineBetween(j.x, j.y, b.x, b.y);
  g.fillStyle(color, 1);
  g.fillCircle(j.x, j.y, width / 2);
  g.fillCircle(b.x, b.y, width / 2);
}

/**
 * A child's head in profile-ish three-quarter view: ink outline, hair with a
 * shine, an ear, a bright eye with a glint, an eyebrow, rosy cheek and a smile.
 */
export function drawHead(g: G, cx: number, cy: number, look: Look, facing = 1): void {
  const f = facing;
  const hairHi = 0x5a4a44;
  if (look.hair === 'ponytail') {
    // a ponytail with a pink band, swinging behind
    g.fillStyle(inkC(), inkA(0.85));
    g.fillEllipse(cx - 14 * f, cy + 7, 12.4, 24.4);
    g.fillStyle(HAIR, 1);
    g.fillEllipse(cx - 14 * f, cy + 7, 10, 22);
    g.fillStyle(hairHi, 0.8);
    g.fillEllipse(cx - 15 * f, cy + 2, 3, 10);
    g.fillStyle(0xf06a9a, 1);
    g.fillRoundedRect(cx - 14 * f - 4, cy - 4, 8, 4, 2);
  }
  // face
  g.fillStyle(inkC(), inkA(0.85));
  g.fillCircle(cx, cy, 12.3);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, cy, 11);
  // a soft shadow under the jaw
  g.fillStyle(0xd8a888, 0.5);
  g.slice(cx, cy, 11, Math.PI * 0.15, Math.PI * 0.85, false);
  g.fillPath();
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx + 1 * f, cy - 1.5, 10);
  // ear
  g.fillStyle(inkC(), inkA(0.85));
  g.fillCircle(cx - 3 * f, cy + 1, 3.6);
  g.fillStyle(0xf4c0a0, 1);
  g.fillCircle(cx - 3 * f, cy + 1, 2.6);
  // hair: a full cap of hair over the top and back, a fringe falling forward
  g.fillStyle(inkC(), inkA(0.85));
  g.slice(cx, cy, 12.6, Math.PI * 0.9, Math.PI * 2.08, false);
  g.fillPath();
  g.fillStyle(HAIR, 1);
  g.slice(cx, cy, 11.6, Math.PI * 0.92, Math.PI * 2.06, false);
  g.fillPath();
  g.fillTriangle(cx + 2 * f, cy - 5, cx + 11 * f, cy - 4, cx + 6 * f, cy + 0.5);
  g.fillTriangle(cx - 2 * f, cy - 6, cx + 5 * f, cy - 5, cx + 1 * f, cy);
  if (look.hair === 'short') {
    // sideburn and a little tuft at the crown
    g.fillRect(cx - 7 * f - (f > 0 ? 0 : 3), cy - 2, 3, 5);
    g.fillTriangle(cx - 4, cy - 11, cx + 2, cy - 15, cx + 3, cy - 10);
  }
  // shine on the hair
  g.lineStyle(1.6, hairHi, 0.9);
  g.beginPath();
  g.arc(cx - 1 * f, cy - 2, 8, Math.PI * (f > 0 ? 1.15 : 1.55), Math.PI * (f > 0 ? 1.45 : 1.85), false);
  g.strokePath();
  if (look.hair === 'cap') {
    const cap = look.cap ?? 0xf4d03f;
    g.fillStyle(inkC(), inkA(0.85));
    g.slice(cx, cy - 1, 13.6, Math.PI, Math.PI * 2, false);
    g.fillPath();
    g.fillRoundedRect(f > 0 ? cx + 1 : cx - 20, cy - 4.2, 19, 5.6, 2.4);
    g.fillStyle(cap, 1);
    g.slice(cx, cy - 1, 12.5, Math.PI, Math.PI * 2, false);
    g.fillPath();
    g.fillRect(f > 0 ? cx + 2 : cx - 19, cy - 3.2, 17, 3.6);
    // panel seams, a button on top, a sunlit side
    g.fillStyle(shade(cap, 18), 1);
    g.slice(cx, cy - 1, 12.5, f > 0 ? Math.PI : Math.PI * 1.55, f > 0 ? Math.PI * 1.45 : Math.PI * 2, false);
    g.fillPath();
    g.lineStyle(1, shade(cap, 30), 0.9);
    g.lineBetween(cx, cy - 13.5, cx + 3 * f, cy - 1);
    g.fillStyle(shade(cap, 25), 1);
    g.fillCircle(cx, cy - 13, 2);
  }
  // eye: white, iris, glint — and an eyebrow
  const ex = cx + 5.5 * f;
  const ey = cy + 0.5;
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(ex, ey, 4.4, 5);
  g.fillStyle(0x2a1e18, 1);
  g.fillEllipse(ex + 0.6 * f, ey + 0.4, 3, 3.8);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(ex + 1.2 * f, ey - 0.6, 0.9);
  g.lineStyle(1.3, HAIR, 1);
  g.lineBetween(ex - 2.4, ey - 4.2, ex + 2.4, ey - 4.6);
  // nose, cheek and a small smile
  g.fillStyle(0xe8a888, 1);
  g.fillCircle(cx + 10 * f, cy + 3, 1.6);
  g.fillStyle(0xf08a8a, 0.55);
  g.fillEllipse(cx + 3.5 * f, cy + 5, 4.8, 3);
  g.lineStyle(1.2, 0xa8504a, 1);
  g.beginPath();
  g.arc(cx + 6.5 * f, cy + 5.5, 2.6, f > 0 ? Math.PI * 0.25 : Math.PI * 0.35, f > 0 ? Math.PI * 0.75 : Math.PI * 0.85, false);
  g.strokePath();
}

/** Bike + rider drawn procedurally each frame so wheels, pedals and pose animate. */
export class Cyclist {
  readonly g: G;
  look: Look;
  wheelAngle = 0;
  crank = 0;
  cameraUp = false;
  withRider = true;
  /** Crouched low over the handlebars (against the wind). */
  tuck = false;

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

    const HIP = this.tuck ? P(-12, -73) : P(-14, -76);
    const SH = this.tuck ? P(14, -95) : P(4, -108);
    const HEAD = this.tuck ? P(26, -103) : P(12, -123);
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
    g.fillStyle(inkC(), inkA(1));
    g.fillRoundedRect(p1.x - 7, p1.y - 4, 15, 7, 3);
    g.fillStyle(0x4a4a52, 1);
    g.fillRoundedRect(p1.x - 6, p1.y - 3, 13, 5, 2);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(p1.x - 6, p1.y + 1, 13, 1.2);

    // backpack
    if (L.backpack) {
      // sits on the back, between hip and shoulder
      const bx = (HIP.x + SH.x) / 2 - 14;
      const by = (HIP.y + SH.y) / 2 - 16;
      g.fillStyle(0x2e6f8e, 1);
      g.fillRoundedRect(bx, by, 16, 30, 6);
      g.fillStyle(0x245a74, 1);
      g.fillRoundedRect(bx, by + 16, 14, 12, 4);
    }

    // torso: ink outline, the shirt, a shaded back and a collar
    g.lineStyle(19.6, inkC(), inkA(0.85));
    g.lineBetween(HIP.x, HIP.y, SH.x, SH.y);
    g.fillStyle(inkC(), inkA(0.85));
    g.fillCircle(SH.x, SH.y, 9.8);
    g.fillCircle(HIP.x, HIP.y, 9.8);
    g.lineStyle(17, L.shirt, 1);
    g.lineBetween(HIP.x, HIP.y, SH.x, SH.y);
    g.fillStyle(L.shirt, 1);
    g.fillCircle(SH.x, SH.y, 8.5);
    g.fillCircle(HIP.x, HIP.y, 8.5);
    g.lineStyle(6, shade(L.shirt, 12), 1);
    g.lineBetween(HIP.x - 5, HIP.y + 1, SH.x - 6, SH.y + 2);
    g.fillStyle(shade(L.shirt, 22), 1);
    g.fillCircle(SH.x + 3, SH.y - 5, 3.2);
    if (L.backpack) {
      g.lineStyle(3, 0x1d4a60, 1);
      g.lineBetween(-8, -82, SH.x + 2, SH.y + 2);
    }

    drawHead(g, HEAD.x, HEAD.y, L);

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

/** A standing figure (for the pavilion scene and most story scenes). Ground at y=0. */
export function drawPerson(g: G, look: Look, opts: { facing?: 1 | -1; armUp?: boolean; backpack?: boolean } = {}): void {
  const f = opts.facing ?? 1;
  g.clear();
  g.fillStyle(0x000000, 0.14);
  g.fillEllipse(0, 2, 46, 8);
  // legs: trousers with a crease, then shoes with white soles
  for (const [x0, x1] of [[-5, -7], [5, 7]] as const) {
    g.lineStyle(12.4, inkC(), inkA(0.85));
    g.lineBetween(x0, -58, x1, -5);
    g.lineStyle(10, x0 < 0 ? shade(look.pants, 10) : look.pants, 1);
    g.lineBetween(x0, -58, x1, -5);
  }
  for (const x of [-14, 1]) {
    const sx = x + (f > 0 ? 2 : -2);
    g.fillStyle(inkC(), inkA(1));
    g.fillRoundedRect(sx - 1, -8, 16, 9, 3);
    g.fillStyle(0x4a4a52, 1);
    g.fillRoundedRect(sx, -7, 14, 6, 2.5);
    g.fillStyle(0xffffff, 1);
    g.fillRect(sx, -2.4, 14, 1.6);
  }
  // backpack, with a flap and a strap
  if (opts.backpack) {
    const bx = -f * 20 - 8;
    g.fillStyle(inkC(), inkA(0.85));
    g.fillRoundedRect(bx - 1.2, -99.2, 18.4, 34.4, 7);
    g.fillStyle(0x2e6f8e, 1);
    g.fillRoundedRect(bx, -98, 16, 32, 6);
    g.fillStyle(0x245a74, 1);
    g.fillRoundedRect(bx + 1, -97, 14, 11, 5);
    g.fillStyle(0xe8c050, 1);
    g.fillRect(bx + 6, -88, 4, 3);
  }
  // torso: shirt with a shaded side, a collar and a hem
  g.fillStyle(inkC(), inkA(0.85));
  g.fillRoundedRect(-15.2, -103.2, 30.4, 50.4, 10);
  g.fillStyle(look.shirt, 1);
  g.fillRoundedRect(-14, -102, 28, 48, 9);
  g.fillStyle(shade(look.shirt, 12), 1);
  g.fillRoundedRect(f > 0 ? -14 : 6, -102, 8, 48, { tl: f > 0 ? 9 : 0, bl: f > 0 ? 9 : 0, tr: f > 0 ? 0 : 9, br: f > 0 ? 0 : 9 });
  g.fillStyle(shade(look.shirt, 22), 1);
  g.fillRect(-14, -58, 28, 3);
  // collar
  g.fillStyle(0xffffff, look.shirt === 0xf5f0e1 ? 0 : 0.85);
  g.fillTriangle(-7, -102, 0, -94, 0, -102);
  g.fillTriangle(7, -102, 0, -94, 0, -102);
  g.lineStyle(1, inkC(), inkA(0.5));
  g.lineBetween(-7, -102, 0, -94);
  g.lineBetween(7, -102, 0, -94);
  if (opts.backpack) {
    g.lineStyle(3.4, 0x1d4a60, 1);
    g.lineBetween(-f * 6, -100, f * 3, -66);
  }
  // arms
  g.lineStyle(9.4, inkC(), inkA(0.85));
  g.lineBetween(-12, -96, -16, -64);
  g.lineStyle(7, shade(look.shirt, 8), 1);
  g.lineBetween(-12, -96, -16, -64);
  const hx = opts.armUp ? (f > 0 ? 24 : -24) : 16;
  const hy = opts.armUp ? -126 : -62;
  g.lineStyle(9.4, inkC(), inkA(0.85));
  g.lineBetween(12, -96, hx, opts.armUp ? -124 : -64);
  g.lineStyle(7, look.shirt, 1);
  g.lineBetween(12, -96, hx, opts.armUp ? -124 : -64);
  for (const [x, y] of [[-16, -62], [hx, hy]]) {
    g.fillStyle(inkC(), inkA(0.85));
    g.fillCircle(x, y, 5.4);
    g.fillStyle(SKIN, 1);
    g.fillCircle(x, y, 4.4);
  }
  // neck
  g.fillStyle(0xe0b090, 1);
  g.fillRect(-3, -106, 6, 5);
  drawHead(g, 0, -116, look, f);
}

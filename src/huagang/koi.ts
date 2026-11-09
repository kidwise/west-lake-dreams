import * as Phaser from 'phaser';
import type { StrKey } from '../core/i18n';
import { rng } from '../art/paint';

/**
 * Koi (锦鲤) for 花港观鱼, drawn in code.
 *
 * Every fish gets its own pattern, painted onto a small canvas (so patches can
 * be clipped to the body), then bent along its spine with a Phaser Rope so the
 * body sways and the tail swishes as it swims.
 */
export type VarietyId = 'higoi' | 'kohaku' | 'sanke' | 'showa' | 'asagi' | 'ogon' | 'tancho';

export interface Variety {
  id: VarietyId;
  name: StrKey;
  /** Share of the pond (红鱼池 is mostly plain red carp). */
  weight: number;
  /** Shy fish keep away from the crowd of big fish. */
  shy: boolean;
}

export const VARIETIES: Variety[] = [
  { id: 'higoi', name: 'koi.higoi', weight: 0.42, shy: false },
  { id: 'kohaku', name: 'koi.kohaku', weight: 0.16, shy: false },
  { id: 'sanke', name: 'koi.sanke', weight: 0.11, shy: false },
  { id: 'showa', name: 'koi.showa', weight: 0.09, shy: false },
  { id: 'asagi', name: 'koi.asagi', weight: 0.08, shy: false },
  { id: 'ogon', name: 'koi.ogon', weight: 0.08, shy: true },
  { id: 'tancho', name: 'koi.tancho', weight: 0.06, shy: true },
];

export const variety = (id: VarietyId): Variety => VARIETIES.find((v) => v.id === id) as Variety;

/** A weighted mix of varieties, with at least `min` of each. */
export function pondMix(n: number, seed: number, min = 2): VarietyId[] {
  const r = rng(seed);
  const out: VarietyId[] = [];
  for (const v of VARIETIES) for (let i = 0; i < min; i++) out.push(v.id);
  while (out.length < n) {
    let k = r();
    for (const v of VARIETIES) {
      k -= v.weight;
      if (k <= 0) {
        out.push(v.id);
        break;
      }
    }
    if (k > 0) out.push('higoi');
  }
  // shuffle
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---- texture painting ---------------------------------------------------------

export const TOP_W = 128;
export const TOP_H = 56;
export const SIDE_W = 140;
export const SIDE_H = 66;

const RED = ['#d9341f', '#e2401f', '#cf2c1c', '#e8502a'];

type Ctx = CanvasRenderingContext2D;

/** Half width of the body seen from above, u = 0 (snout) .. 1 (tail root). */
function topHalf(u: number): number {
  if (u < 0.26) return 17 * Math.sqrt(Math.max(0, 1 - ((0.26 - u) / 0.29) ** 2));
  return 17 * (1 - 0.8 * ((u - 0.26) / 0.74) ** 1.25);
}

/** A soft, wobbly blob for a pattern patch (紅斑 / 墨斑). */
function blob(ctx: Ctx, r: () => number, cx: number, cy: number, rx: number, ry: number): void {
  ctx.beginPath();
  const n = 14;
  const ph = r() * 6;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.18 * Math.sin(a * 3 + ph) + 0.1 * Math.sin(a * 5 + ph * 2);
    const x = cx + Math.cos(a) * rx * k;
    const y = cy + Math.sin(a) * ry * k;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Paint the variety's pattern inside the current clip. `x0..x1` is the body
 * length, `cy` its centre line and `hw` the half width (for scaling patches).
 */
function pattern(ctx: Ctx, id: VarietyId, r: () => number, x0: number, x1: number, cy: number, hw: number, side: boolean): void {
  const L = x1 - x0;
  const base: Record<VarietyId, string> = {
    higoi: '#e4572e',
    kohaku: '#f8f4ec',
    sanke: '#f8f4ec',
    showa: '#1f1d22',
    asagi: '#8ea4b4',
    ogon: '#f0be45',
    tancho: '#f8f4ec',
  };
  ctx.fillStyle = base[id];
  ctx.fillRect(0, 0, 400, 200);
  const red = RED[Math.floor(r() * RED.length)];
  const along = (u: number) => x0 + L * u;
  const reds = (count: number, from = 0.08, to = 0.8) => {
    ctx.fillStyle = red;
    for (let i = 0; i < count; i++) {
      const u = from + ((to - from) * (i + 0.2 + r() * 0.6)) / count;
      blob(ctx, r, along(u), cy + (r() - 0.5) * hw * (side ? 0.6 : 0.5) - (side ? hw * 0.3 : 0), L * (0.07 + r() * 0.07), hw * (0.55 + r() * 0.45));
    }
  };
  const sumi = (count: number, size: number) => {
    ctx.fillStyle = '#17161a';
    for (let i = 0; i < count; i++) {
      blob(ctx, r, along(0.25 + r() * 0.6), cy + (r() - 0.5) * hw * 1.2 - (side ? hw * 0.4 : 0), L * size * (0.5 + r()), hw * size * 2.2 * (0.5 + r()));
    }
  };
  switch (id) {
    case 'higoi': {
      // a deeper red along the back
      const g = ctx.createLinearGradient(0, cy - hw, 0, cy + hw);
      g.addColorStop(0, side ? '#c93a1c' : '#ef7a44');
      g.addColorStop(0.5, side ? '#e4572e' : '#d8401f');
      g.addColorStop(1, side ? '#f6a36a' : '#ef7a44');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 400, 200);
      break;
    }
    case 'kohaku':
      reds(2 + Math.floor(r() * 3));
      break;
    case 'sanke':
      reds(2 + Math.floor(r() * 2));
      sumi(3 + Math.floor(r() * 4), 0.035);
      break;
    case 'showa':
      ctx.fillStyle = '#f5f1e8';
      for (let i = 0; i < 3; i++) blob(ctx, r, along(0.2 + r() * 0.6), cy + (r() - 0.5) * hw, L * 0.08, hw * 0.6);
      reds(2 + Math.floor(r() * 2), 0.04, 0.75);
      // black wraps back over the patches in bold strokes
      ctx.strokeStyle = '#1f1d22';
      ctx.lineWidth = hw * 0.4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const u = 0.2 + r() * 0.6;
        ctx.moveTo(along(u), cy - hw * 1.2);
        ctx.quadraticCurveTo(along(u + 0.06), cy, along(u - 0.02), cy + hw * 1.2);
        ctx.stroke();
      }
      break;
    case 'asagi': {
      // orange flanks and a net of pale scale edges on a blue back
      ctx.fillStyle = '#e06b3a';
      if (side) ctx.fillRect(0, cy + hw * 0.15, 400, 200);
      else {
        ctx.fillRect(0, cy - hw * 2, 400, hw * 1.15);
        ctx.fillRect(0, cy + hw * 0.85, 400, hw * 2);
      }
      ctx.strokeStyle = 'rgba(220,235,245,0.75)';
      ctx.lineWidth = 1;
      for (let x = x0 + 14; x < x1 - 4; x += 5) {
        for (let y = cy - hw; y < cy + hw; y += 5) {
          ctx.beginPath();
          ctx.arc(x + ((y / 5) % 2) * 2.5, y, 2.6, Math.PI * 0.5, Math.PI * 1.5);
          ctx.stroke();
        }
      }
      // head stays pale
      ctx.fillStyle = 'rgba(214,226,234,0.9)';
      blob(ctx, r, along(0.06), cy, L * 0.09, hw);
      break;
    }
    case 'ogon': {
      const g = ctx.createLinearGradient(0, cy - hw, 0, cy + hw);
      g.addColorStop(0, '#f6d77a');
      g.addColorStop(0.45, '#fff2b8');
      g.addColorStop(0.6, '#e9b437');
      g.addColorStop(1, '#f6d77a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 400, 200);
      break;
    }
    case 'tancho':
      // one round red crown on the head, like the red-crowned crane (丹顶鹤)
      ctx.fillStyle = red;
      ctx.beginPath();
      ctx.arc(along(side ? 0.1 : 0.1), cy - (side ? hw * 0.55 : 0), hw * (side ? 0.42 : 0.55), 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  // subtle scales over everything
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 0.8;
  for (let x = x0 + 16; x < x1 - 2; x += 4.5) {
    for (let y = cy - hw; y < cy + hw; y += 4.5) {
      ctx.beginPath();
      ctx.arc(x + ((Math.round(y / 4.5) % 2) * 2.2), y, 2.4, Math.PI * 0.55, Math.PI * 1.45);
      ctx.stroke();
    }
  }
}

function finColor(id: VarietyId): string {
  return { higoi: 'rgba(240,120,70,0.55)', kohaku: 'rgba(250,246,238,0.6)', sanke: 'rgba(250,246,238,0.6)', showa: 'rgba(60,55,60,0.55)', asagi: 'rgba(230,120,80,0.55)', ogon: 'rgba(248,214,110,0.6)', tancho: 'rgba(250,246,238,0.6)' }[id];
}

function paintTop(ctx: Ctx, id: VarietyId, seed: number): void {
  const r = rng(seed);
  const cy = TOP_H / 2;
  const x0 = 6;
  const x1 = 98;
  const L = x1 - x0;
  const fin = finColor(id);
  // fins first, under the body
  ctx.fillStyle = fin;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  for (const s of [-1, 1]) {
    // pectoral fins: soft fans near the head
    ctx.beginPath();
    ctx.moveTo(x0 + L * 0.2, cy + s * 11);
    ctx.quadraticCurveTo(x0 + L * 0.22, cy + s * 28, x0 + L * 0.4, cy + s * 26);
    ctx.quadraticCurveTo(x0 + L * 0.34, cy + s * 16, x0 + L * 0.3, cy + s * 11);
    ctx.fill();
    // pelvic fins
    ctx.beginPath();
    ctx.moveTo(x0 + L * 0.5, cy + s * 6);
    ctx.quadraticCurveTo(x0 + L * 0.54, cy + s * 18, x0 + L * 0.64, cy + s * 15);
    ctx.lineTo(x0 + L * 0.58, cy + s * 5);
    ctx.fill();
  }
  // tail: two lobes with a notch, and fine rays
  ctx.beginPath();
  ctx.moveTo(x1 - 6, cy - 3);
  ctx.quadraticCurveTo(x1 + 10, cy - 10, TOP_W - 2, cy - 20);
  ctx.quadraticCurveTo(x1 + 18, cy - 4, x1 + 16, cy);
  ctx.quadraticCurveTo(x1 + 18, cy + 4, TOP_W - 2, cy + 20);
  ctx.quadraticCurveTo(x1 + 10, cy + 10, x1 - 6, cy + 3);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 0.7;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x1 - 4, cy + i * 0.8);
    ctx.lineTo(TOP_W - 6, cy + i * 5.5);
    ctx.stroke();
  }

  // body outline
  const body = new Path2D();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = x0 + L * u;
    const y = cy - topHalf(u);
    if (i === 0) body.moveTo(x, y);
    else body.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    body.lineTo(x0 + L * u, cy + topHalf(u));
  }
  body.closePath();

  ctx.save();
  ctx.clip(body);
  pattern(ctx, id, r, x0, x1, cy, 17, false);
  // roundness: darker towards the edges, a highlight along the spine
  const shade = ctx.createLinearGradient(0, cy - 17, 0, cy + 17);
  shade.addColorStop(0, 'rgba(0,0,0,0.28)');
  shade.addColorStop(0.3, 'rgba(0,0,0,0)');
  shade.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  shade.addColorStop(0.7, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, TOP_W, TOP_H);
  // dorsal fin seen from above: a thin dark ridge
  ctx.strokeStyle = 'rgba(40,20,20,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + L * 0.34, cy);
  ctx.lineTo(x0 + L * 0.74, cy);
  ctx.stroke();
  ctx.restore();

  // eyes on both sides of the head
  ctx.fillStyle = '#1a1414';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x0 + 9, cy + s * 8, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Body height above / below the centre line seen from the side. */
function sideTop(u: number): number {
  if (u < 0.2) return 15 * Math.sqrt(Math.max(0, 1 - ((0.2 - u) / 0.23) ** 2));
  return 15 * (1 - 0.8 * ((u - 0.2) / 0.8) ** 1.1);
}
function sideBottom(u: number): number {
  if (u < 0.22) return 12 * Math.sqrt(Math.max(0, 1 - ((0.22 - u) / 0.24) ** 2));
  return 12 * (1 - 0.78 * ((u - 0.22) / 0.78) ** 1.0);
}

function paintSide(ctx: Ctx, id: VarietyId, seed: number): void {
  const r = rng(seed);
  const cy = SIDE_H / 2 + 2;
  const x0 = 6;
  const x1 = 104;
  const L = x1 - x0;
  const fin = finColor(id);
  ctx.fillStyle = fin;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  // dorsal fin
  ctx.beginPath();
  ctx.moveTo(x0 + L * 0.3, cy - sideTop(0.3) + 2);
  ctx.quadraticCurveTo(x0 + L * 0.36, cy - 28, x0 + L * 0.5, cy - 26);
  ctx.lineTo(x0 + L * 0.74, cy - sideTop(0.74) - 6);
  ctx.lineTo(x0 + L * 0.74, cy - sideTop(0.74) + 1);
  ctx.closePath();
  ctx.fill();
  // pectoral, pelvic and anal fins
  for (const [u, len, drop] of [[0.2, 0.16, 14], [0.48, 0.12, 11], [0.74, 0.1, 9]] as const) {
    ctx.beginPath();
    ctx.moveTo(x0 + L * u, cy + sideBottom(u) - 3);
    ctx.quadraticCurveTo(x0 + L * (u + len * 0.3), cy + sideBottom(u) + drop, x0 + L * (u + len), cy + sideBottom(u) + drop * 0.7);
    ctx.lineTo(x0 + L * (u + len * 0.8), cy + sideBottom(u + len * 0.8) - 2);
    ctx.closePath();
    ctx.fill();
  }
  // tail
  ctx.beginPath();
  ctx.moveTo(x1 - 6, cy - 4);
  ctx.quadraticCurveTo(x1 + 12, cy - 12, SIDE_W - 2, cy - 24);
  ctx.quadraticCurveTo(x1 + 22, cy - 4, x1 + 20, cy);
  ctx.quadraticCurveTo(x1 + 22, cy + 4, SIDE_W - 2, cy + 22);
  ctx.quadraticCurveTo(x1 + 12, cy + 10, x1 - 6, cy + 3);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 0.7;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x1 - 4, cy + i * 0.8);
    ctx.lineTo(SIDE_W - 6, cy + i * 6);
    ctx.stroke();
  }

  const body = new Path2D();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = x0 + L * u;
    if (i === 0) body.moveTo(x, cy - sideTop(u));
    else body.lineTo(x, cy - sideTop(u));
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    body.lineTo(x0 + L * u, cy + sideBottom(u));
  }
  body.closePath();
  ctx.save();
  ctx.clip(body);
  pattern(ctx, id, r, x0, x1, cy - 1, 14, true);
  // pale belly and a rounded shading
  const shade = ctx.createLinearGradient(0, cy - 15, 0, cy + 12);
  shade.addColorStop(0, 'rgba(0,0,0,0.25)');
  shade.addColorStop(0.35, 'rgba(255,255,255,0.12)');
  shade.addColorStop(0.75, 'rgba(255,255,255,0.22)');
  shade.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, SIDE_W, SIDE_H);
  // gill cover
  ctx.strokeStyle = 'rgba(80,30,20,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x0 + L * 0.06, cy, 12, -0.9, 0.9);
  ctx.stroke();
  ctx.restore();

  // eye, mouth and whiskers (须)
  ctx.fillStyle = '#fbf6ea';
  ctx.beginPath();
  ctx.arc(x0 + 9, cy - 4, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#121010';
  ctx.beginPath();
  ctx.arc(x0 + 8.5, cy - 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,60,40,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0 + 1, cy + 3);
  ctx.quadraticCurveTo(x0 - 3, cy + 8, x0 + 2, cy + 11);
  ctx.moveTo(x0 + 3, cy + 4);
  ctx.quadraticCurveTo(x0 + 1, cy + 9, x0 + 6, cy + 12);
  ctx.stroke();
}

/** Ink-brush body for 魚, the character that ran away from the stele. */
function paintInk(ctx: Ctx, w: number, h: number, mirror: boolean): void {
  void mirror;
  const r = rng(808);
  const cy = h / 2 + 2;
  const x0 = 6;
  const x1 = w - 40;
  const L = x1 - x0;
  // dry-brush strokes along the body
  for (let k = 0; k < 26; k++) {
    const off = (r() - 0.5) * 2;
    ctx.strokeStyle = `rgba(18,16,20,${0.25 + r() * 0.5})`;
    ctx.lineWidth = 1 + r() * 4;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      const top = sideTop(u) * 1.05;
      const bottom = sideBottom(u) * 1.05;
      const y = cy - top + (top + bottom) * (0.5 + off * 0.45) + Math.sin(u * 9 + k) * 0.8;
      const x = x0 + L * u;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // solid core
  ctx.fillStyle = 'rgba(20,18,22,0.85)';
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    const x = x0 + L * u;
    if (i === 0) ctx.moveTo(x, cy - sideTop(u) * 0.8);
    else ctx.lineTo(x, cy - sideTop(u) * 0.8);
  }
  for (let i = 30; i >= 0; i--) ctx.lineTo(x0 + (L * i) / 30, cy + sideBottom(i / 30) * 0.8);
  ctx.closePath();
  ctx.fill();
  // fins as flicked brush strokes
  ctx.strokeStyle = 'rgba(18,16,20,0.75)';
  ctx.lineCap = 'round';
  for (const [ax, ay, bx, by, cxp, cyp, lw] of [
    [0.32, -1, 0.6, -1.9, 0.42, -2.2, 3],
    [0.22, 1, 0.38, 2.0, 0.26, 2.0, 2.5],
    [0.55, 0.9, 0.68, 1.7, 0.6, 1.8, 2.2],
  ]) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x0 + L * ax, cy + ay * 12);
    ctx.quadraticCurveTo(x0 + L * cxp, cy + cyp * 12, x0 + L * bx, cy + by * 12);
    ctx.stroke();
  }
  // a split, flying tail
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      ctx.lineWidth = 3.5 - k * 0.7;
      ctx.strokeStyle = `rgba(18,16,20,${0.85 - k * 0.15})`;
      ctx.beginPath();
      ctx.moveTo(x1 - 6, cy + s * 2);
      ctx.quadraticCurveTo(x1 + 14, cy + s * (6 + k * 2), w - 4 - k * 3, cy + s * (22 - k * 3));
      ctx.stroke();
    }
  }
  // the eye: a single dot of ink with a white glint
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x0 + 10, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x0 + 11, cy - 5, 1, 0, Math.PI * 2);
  ctx.fill();
}

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  paint(ctx);
  tex.refresh();
}

/** Same picture flipped upside down (for side-view fish swimming the other way). */
function mirrored(scene: Phaser.Scene, key: string, w: number, h: number): void {
  const mk = `${key}-m`;
  if (scene.textures.exists(mk)) return;
  const src = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
  canvasTexture(scene, mk, w, h, (ctx) => {
    ctx.translate(0, h);
    ctx.scale(1, -1);
    ctx.drawImage(src, 0, 0);
  });
}

export function koiTopTexture(scene: Phaser.Scene, id: VarietyId, seed: number): string {
  const key = `koiT-${id}-${seed}`;
  canvasTexture(scene, key, TOP_W, TOP_H, (ctx) => paintTop(ctx, id, seed));
  return key;
}

/** Returns the base key; `${key}-m` is the mirrored copy. */
export function koiSideTexture(scene: Phaser.Scene, id: VarietyId, seed: number): string {
  const key = `koiS-${id}-${seed}`;
  canvasTexture(scene, key, SIDE_W, SIDE_H, (ctx) => paintSide(ctx, id, seed));
  mirrored(scene, key, SIDE_W, SIDE_H);
  return key;
}

export function inkFishTexture(scene: Phaser.Scene): string {
  const key = 'inkFish';
  canvasTexture(scene, key, SIDE_W + 10, SIDE_H + 6, (ctx) => paintInk(ctx, SIDE_W + 10, SIDE_H + 6, false));
  mirrored(scene, key, SIDE_W + 10, SIDE_H + 6);
  return key;
}

// ---- a bendable body -----------------------------------------------------------

const SEGS = 9;

/**
 * The fish's body as a Rope bent along its spine. The rope sits at the fish's
 * head; spine points are local (unscaled) so `setScale` sizes the whole fish.
 */
export class KoiBody {
  readonly rope: Phaser.GameObjects.Rope;
  readonly shadow: Phaser.GameObjects.Rope | null;
  private pts: { x: number; y: number }[];
  private shadowPts: { x: number; y: number }[] = [];
  private seg: number;
  /** Side view: which texture is showing (base or mirrored). */
  private baseKey: string;
  private side: boolean;
  private flipped = false;

  constructor(scene: Phaser.Scene, key: string, opts: { side?: boolean; shadow?: boolean; length?: number } = {}) {
    this.side = !!opts.side;
    this.baseKey = key;
    const len = opts.length ?? (this.side ? SIDE_W : TOP_W);
    this.seg = len / (SEGS - 1);
    this.pts = Array.from({ length: SEGS }, (_, i) => ({ x: -i * this.seg, y: 0 }));
    this.rope = scene.add.rope(0, 0, key, undefined, this.pts as Phaser.Types.Math.Vector2Like[], true);
    if (opts.shadow) {
      this.shadowPts = this.pts.map((p) => ({ ...p }));
      this.shadow = scene.add.rope(0, 0, key, undefined, this.shadowPts as Phaser.Types.Math.Vector2Like[], true);
      this.shadow.setTintMode(Phaser.TintModes.FILL);
      this.shadow.setColors(0x0b2c2e);
      this.shadow.setAlphas(0.32);
    } else {
      this.shadow = null;
    }
  }

  /**
   * Bend the body. `heading` is the swimming direction; `bend` the turn
   * (radians across the body); `wave` the swimming phase and `amp` its size.
   */
  pose(x: number, y: number, heading: number, bend: number, wave: number, amp: number, scale: number): void {
    let px = 0;
    let py = 0;
    for (let i = 0; i < SEGS; i++) {
      const k = i / (SEGS - 1);
      this.pts[i].x = px;
      this.pts[i].y = py;
      const a = heading + bend * k + amp * Math.sin(wave - i * 0.75) * k ** 1.5;
      px -= Math.cos(a) * this.seg;
      py -= Math.sin(a) * this.seg;
    }
    this.rope.setPosition(x, y).setScale(scale);
    this.rope.setDirty();
    if (this.side) {
      // the texture's top edge sits to the left of the head→tail direction:
      // swimming right, the base texture would be upside down
      const wantFlip = Math.cos(heading) > 0.08 ? true : Math.cos(heading) < -0.08 ? false : this.flipped;
      if (wantFlip !== this.flipped) {
        this.flipped = wantFlip;
        this.rope.setTexture(wantFlip ? `${this.baseKey}-m` : this.baseKey);
      }
    }
  }

  /** Place the shadow on the pond floor, offset by how high the fish is. */
  poseShadow(dx: number, dy: number, scale: number): void {
    if (!this.shadow) return;
    for (let i = 0; i < SEGS; i++) {
      this.shadowPts[i].x = this.pts[i].x;
      this.shadowPts[i].y = this.pts[i].y;
    }
    this.shadow.setPosition(this.rope.x + dx, this.rope.y + dy).setScale(scale);
    this.shadow.setDirty();
  }

  setDepth(d: number): void {
    this.rope.setDepth(d);
  }

  setVisible(v: boolean): void {
    this.rope.setVisible(v);
    this.shadow?.setVisible(v);
  }

  setAlpha(a: number): void {
    this.rope.setAlpha(a);
    this.shadow?.setAlpha(a);
  }

  /** Tint the whole body (multiply). */
  tint(color: number): void {
    this.rope.setColors(color);
  }

  destroy(): void {
    this.rope.destroy();
    this.shadow?.destroy();
  }
}

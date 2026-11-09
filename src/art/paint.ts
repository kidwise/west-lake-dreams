import * as Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;
type V = Phaser.Math.Vector2;
const vec = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** Deterministic pseudo-random generator, so the scenery is the same every play. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lens / petal shaped polygon from a base point toward `angle`
 * (radians, 0 = straight up, positive = clockwise).
 */
export function petal(bx: number, by: number, len: number, width: number, angle: number, steps = 14): V[] {
  const left: V[] = [];
  const right: V[] = [];
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const along = len * t;
    // fuller near the tip, pointed at the very end
    const half = width * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)), 0.9) * (t < 0.15 ? t / 0.15 * 0.6 + 0.4 : 1);
    const ax = bx + sin * along;
    const ay = by - cos * along;
    left.push(vec(ax - cos * half, ay - sin * half));
    right.push(vec(ax + cos * half, ay + sin * half));
  }
  return [...left, ...right.reverse()];
}

/** Quadratic bezier sampled into points. */
export function quad(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, steps = 16): V[] {
  const pts: V[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push(vec(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1));
  }
  return pts;
}

export function strokeCurve(g: G, pts: V[]): void {
  g.strokePoints(pts, false, false);
}

/** A ridge line of hills using layered sine waves; filled down to `bottom`. */
export function hillPolygon(
  width: number,
  baseY: number,
  amp: number,
  bottom: number,
  seed: number,
  step = 16,
): V[] {
  const r = rng(seed);
  const waves = Array.from({ length: 4 }, (_, i) => ({
    f: (0.0016 + r() * 0.002) * (i + 1),
    p: r() * Math.PI * 2,
    a: amp / (i + 1.2),
  }));
  const pts: V[] = [vec(0, bottom)];
  for (let x = 0; x <= width + step; x += step) {
    let y = baseY;
    for (const w of waves) y -= Math.sin(x * w.f + w.p) * w.a + w.a * 0.6;
    pts.push(vec(x, y));
  }
  pts.push(vec(width + step, bottom));
  return pts;
}

/** Height of a hill polygon at x (for placing pagodas on ridges). */
export function polyYAt(pts: V[], x: number): number {
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (x >= a.x && x <= b.x) return a.y + ((x - a.x) / (b.x - a.x || 1)) * (b.y - a.y);
  }
  return pts[1]?.y ?? 0;
}

/** A slender pagoda silhouette (like Baochu Pagoda on the hills north of the lake). */
export function pagoda(g: G, x: number, groundY: number, height: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  const tiers = 7;
  const baseW = height * 0.16;
  for (let i = 0; i < tiers; i++) {
    const y0 = groundY - (height * i) / tiers;
    const y1 = groundY - (height * (i + 1)) / tiers;
    const w = baseW * (1 - i * 0.08);
    g.fillRect(x - w / 2, y1, w, y0 - y1 + 1);
    g.fillRect(x - w * 0.7, y1 + 1, w * 1.4, 2);
  }
  g.fillTriangle(x - 2, groundY - height, x + 2, groundY - height, x, groundY - height - height * 0.12);
}

/** Linear blend between two 0xRRGGBB colours. */
export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Small canvas-painting helpers shared by the 柳浪闻莺 art (picture-book style, ink outlines). */
export type Ctx = CanvasRenderingContext2D;

export const INK = '#3a2a22';

export function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function rad(ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient, rot = 0): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** Fill the current path, then ink its outline. */
export function inked(ctx: Ctx, fill: string | CanvasGradient, width = 1.4, ink = INK): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** A smooth stroke through points given as quadratic segments: x0,y0, cx,cy,x,y, cx,cy,x,y… */
export function curve(ctx: Ctx, pts: number[], color: string, width: number, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 4) ctx.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
  ctx.stroke();
  ctx.restore();
}

/** A closed path through points, smoothed with quadratic curves between midpoints. */
export function blob(ctx: Ctx, pts: number[]): void {
  const n = pts.length / 2;
  ctx.beginPath();
  const mx = (i: number) => (pts[(i % n) * 2] + pts[((i + 1) % n) * 2]) / 2;
  const my = (i: number) => (pts[(i % n) * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2;
  ctx.moveTo(mx(0), my(0));
  for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(pts[(i % n) * 2], pts[(i % n) * 2 + 1], mx(i), my(i));
  ctx.closePath();
}

export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

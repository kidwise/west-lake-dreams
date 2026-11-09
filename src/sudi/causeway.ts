/**
 * 苏堤 as a side-scrolling track. The six single-arch stone bridges, from the
 * south end to the north end: 映波, 锁澜, 望山, 压堤, 东浦, 跨虹.
 * The camera looks west across 西里湖 towards the western hills, so riding to
 * the right is riding north.
 */
export const BASE = 520; // road surface on the causeway
export const WATER = 578; // waterline (foreground lake and arch feet)
export const HORIZON = 432; // far shore of 西里湖
export const SPAN = 520;
export const GAP = 760;
export const START_X = 700;

export interface Bridge {
  index: number;
  /** Two-character name used on the seal (印章). */
  seal: string;
  x0: number;
  height: number;
}

const SEALS = ['映波', '锁澜', '望山', '压堤', '东浦', '跨虹'];
const HEIGHTS = [96, 118, 150, 124, 142, 170];

export const BRIDGES: Bridge[] = SEALS.map((seal, i) => ({
  index: i,
  seal,
  x0: START_X + i * (SPAN + GAP),
  height: HEIGHTS[i],
}));

export const FINISH_X = BRIDGES[5].x0 + SPAN + 260;
export const WORLD_W = FINISH_X + 900;

export function bridgeAt(x: number): Bridge | null {
  for (const b of BRIDGES) if (x >= b.x0 && x <= b.x0 + SPAN) return b;
  return null;
}

/** Road height (screen y) at world x. */
export function ground(x: number): number {
  const b = bridgeAt(x);
  if (!b) return BASE;
  const u = (x - b.x0) / SPAN;
  return BASE - b.height * Math.sin(Math.PI * u);
}

export function slope(x: number): number {
  return (ground(x + 1) - ground(x - 1)) / 2;
}

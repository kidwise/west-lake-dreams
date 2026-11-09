/**
 * 三潭印月 — the lake around 小瀛洲 island as a tiny 3D world.
 *
 * The boat scene renders a first-person view by projecting these objects
 * from the boat's position and heading, so "trying different viewing angles"
 * is real: every place on the lake shows a different composition.
 *
 * Coordinates are metres: x = east, y = north. Headings and bearings are
 * compass degrees (0 = north, 90 = east). Pure logic, no Phaser imports.
 */

export interface Pose {
  x: number;
  y: number;
  heading: number;
}

export interface WorldObj {
  id: string;
  tex: string;
  x: number;
  y: number;
  /** Height above the water in metres. */
  h: number;
  /** Collision radius for the boat (0 = none). */
  r: number;
}

// ---- camera ----------------------------------------------------------------
export const VIEW_W = 1280;
export const VIEW_H = 500;
export const HORIZON = 300;
export const FOV = 52; // horizontal degrees across the whole view
export const FOCAL = VIEW_W / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
export const CAM_H = 1.4; // eye height above the water

/** The square photo frame (screen px) — photos and similarity use this. */
export const FRAME = { x: 420, y: 36, w: 440, h: 440 };

/** Similarity needed for a photo to count as a match. */
export const MATCH = 0.72;

// ---- the lake ----------------------------------------------------------------
export const ISLAND = { x: 0, y: 0, r: 50 };
export const LAKE = { x: 0, y: -40, r: 270 };
export const START: Pose = { x: 0, y: -215, heading: 0 };

const deg = Math.PI / 180;

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The three pagodas form an equilateral triangle (side 60 m in this little world). */
export const PAGODA_IDS = ['p1', 'p2', 'p3'] as const;
const TRI = { x: 0, y: -112, side: 60 };
const PAGODA_POS = [0, 120, 240].map((bearing) => ({
  // vertices at compass bearings 0° / 120° / 240° from the triangle's centre
  x: TRI.x + (TRI.side / Math.sqrt(3)) * Math.sin(bearing * deg),
  y: TRI.y + (TRI.side / Math.sqrt(3)) * Math.cos(bearing * deg),
}));

function buildObjects(): WorldObj[] {
  const objs: WorldObj[] = [
    // the three stone pagodas (三潭) south of the island, standing in an
    // equilateral triangle as they do in reality
    ...PAGODA_POS.map((q, i) => ({ id: PAGODA_IDS[i], tex: 'santanPagoda', x: q.x, y: q.y, h: 5.2, r: 3 })),
    // 我心相印亭 on the south shore, and the old camphor tree
    { id: 'pavilion', tex: 'xinxiangTing', x: -8, y: -47, h: 7.5, r: 0 },
    { id: 'camphor', tex: 'treeCamphor', x: 24, y: -40, h: 15, r: 0 },
    { id: 'pine', tex: 'treePine', x: -40, y: -26, h: 16, r: 0 },
  ];
  // a ring of trees around the island, leaving the pavilion view open
  const r = seeded(8);
  const kinds = ['treeRound', 'treeWillowDark', 'treeRound', 'treePine2'];
  for (let a = 0; a < 360; a += 13 + r() * 9) {
    if (a > 160 && a < 205) continue; // the pavilion's open south shore
    const rad = 34 + r() * 14;
    objs.push({
      id: `t${Math.round(a)}`,
      tex: kinds[Math.floor(r() * kinds.length)],
      x: Math.sin(a * deg) * rad,
      y: Math.cos(a * deg) * rad,
      h: 9 + r() * 5,
      r: 0,
    });
  }
  // the zig-zag bridge (九曲桥) along the south shore
  for (let i = 0; i < 5; i++) {
    objs.push({ id: `bridge${i}`, tex: 'zigBridge', x: -34 + i * 15, y: -52 - (i % 2) * 5, h: 2.2, r: 0 });
  }
  return objs;
}

export const OBJECTS = buildObjects();
const BY_ID = new Map(OBJECTS.map((o) => [o.id, o]));

/** Distant landmarks on the hills (effectively at infinity: only bearing matters). */
export const LANDMARKS = {
  baochu: { bearing: 6, elev: 4.6 }, // 保俶塔 on 宝石山, north
  leifeng: { bearing: 148, elev: 3.4 }, // 雷峰塔, south-east
};

/** Elevation (degrees) of the hill ridge at a compass bearing. */
export function ridge(bearing: number): number {
  const b = ((bearing % 360) + 360) % 360;
  let e = 0.7 + 0.35 * Math.sin(b * 3 * deg) + 0.25 * Math.sin(b * 7 * deg + 1) + 0.12 * Math.sin(b * 17 * deg);
  // the western hills (西山) — tallest, layered
  e += 3.4 * Math.exp(-(((b - 275) / 45) ** 2)) + 1.2 * Math.exp(-(((b - 238) / 14) ** 2));
  // 北高峰 peak
  e += 1.6 * Math.exp(-(((b - 318) / 9) ** 2));
  // 宝石山 (low, north) with the pagoda's hill
  e += 1.1 * Math.exp(-(((b - 6) / 14) ** 2));
  // 南屏山 / 夕照山 (south)
  e += 1.5 * Math.exp(-(((b - 170) / 22) ** 2));
  return Math.max(0.35, e);
}

// ---- projection ----------------------------------------------------------------
export const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

export function bearingTo(p: Pose, x: number, y: number): number {
  return Math.atan2(x - p.x, y - p.y) / deg;
}

export interface Projected {
  sx: number;
  /** Depth along the view axis (m). <= 0 means behind the camera. */
  z: number;
  /** Apparent height in px. */
  size: number;
  /** Screen y of the water line at the object's base. */
  baseY: number;
}

export function project(p: Pose, o: { x: number; y: number; h: number }): Projected {
  const rel = wrap180(bearingTo(p, o.x, o.y) - p.heading);
  const d = Math.hypot(o.x - p.x, o.y - p.y);
  const z = d * Math.cos(rel * deg);
  if (z <= 0.5 || Math.abs(rel) > 80) return { sx: NaN, z: -1, size: 0, baseY: HORIZON };
  return {
    sx: VIEW_W / 2 + FOCAL * Math.tan(rel * deg),
    z,
    size: (FOCAL * o.h) / z,
    baseY: HORIZON + (FOCAL * CAM_H) / z,
  };
}

/** Screen x of a bearing (for hills and landmarks at infinity). NaN if behind. */
export function bearingX(p: Pose, bearing: number): number {
  const rel = wrap180(bearing - p.heading);
  if (Math.abs(rel) > 80) return NaN;
  return VIEW_W / 2 + FOCAL * Math.tan(rel * deg);
}

export function elevY(elevDeg: number): number {
  return HORIZON - FOCAL * Math.tan(elevDeg * deg);
}

// ---- the banknote picture and its three "local views" ------------------------
//
// The back of the one-yuan note shows the three stone pagodas: a big one close
// on the left, a small far one in the middle, a medium one on the right, with
// a slender pagoda on the distant hills behind. In reality the pagodas stand in
// an equilateral triangle, and it is reported that the photographer's angle
// could only capture two of them — the third was added on the note. In this
// world that is true too: no viewpoint can match all three at once.

export type TargetId = 'near' | 'pair' | 'far';

/** One element of a composition: any pagoda, or a distant landmark. */
interface Elem {
  kind: 'pagoda' | '@baochu';
  /** Horizontal position in the frame, 0..1. */
  fx: number;
  /** Apparent height / frame height (pagodas only). */
  size?: number;
}

export interface Target {
  id: TargetId;
  /** A viewpoint that matches this part of the note (used for hints). */
  pose: Pose;
  elems: Elem[];
}

/** The whole note picture, measured across a frame three photos wide. */
export const NOTE_PAGODAS: Elem[] = [
  { kind: 'pagoda', fx: 0.2, size: 0.62 }, // left: big and close
  { kind: 'pagoda', fx: 0.45, size: 0.17 }, // middle: small and far
  { kind: 'pagoda', fx: 0.6, size: 0.32 }, // right: medium
];
const BAOCHU_FX_WIDE = 0.8;
const WIDE = { x: VIEW_W / 2 - 1.5 * FRAME.w, w: 3 * FRAME.w };

/** Each photo is one third of the note picture. */
const third = (fxWide: number, k: number) => (fxWide - k / 3) * 3;

export const TARGETS: Target[] = [
  // 近塔: a pagoda as big and close as the one on the left of the note
  { id: 'near', pose: { x: 29, y: -154, heading: 0 }, elems: [{ kind: 'pagoda', fx: third(0.2, 0), size: 0.62 }] },
  // 双塔: one small far pagoda and one nearer, spaced like the middle of the note
  {
    id: 'pair',
    pose: { x: 74, y: -142, heading: 280 },
    elems: [
      { kind: 'pagoda', fx: third(0.45, 1), size: 0.17 },
      { kind: 'pagoda', fx: third(0.6, 1), size: 0.32 },
    ],
  },
  // 远景: the slender pagoda on the far hills where the note shows it
  { id: 'far', pose: { x: 0, y: -215, heading: 8 }, elems: [{ kind: '@baochu', fx: third(BAOCHU_FX_WIDE, 2) }] },
];

const SIGMA_X = 0.085;
const SIGMA_SIZE = 0.33;

function pagodaView(p: Pose, id: string, frame: { x: number; w: number }): { fx: number; size: number } | null {
  const o = BY_ID.get(id);
  if (!o) return null;
  const pr = project(p, o);
  if (pr.z <= 0) return null;
  return { fx: (pr.sx - frame.x) / frame.w, size: pr.size / FRAME.h };
}

function elemScore(p: Pose, e: Elem, frame: { x: number; w: number }, pagodaId?: string): number {
  let fx: number;
  let size = 0;
  if (e.kind === '@baochu') {
    const sx = bearingX(p, LANDMARKS.baochu.bearing);
    if (Number.isNaN(sx)) return 0;
    fx = (sx - frame.x) / frame.w;
  } else {
    const v = pagodaView(p, pagodaId ?? '', frame);
    if (!v) return 0;
    fx = v.fx;
    size = v.size;
  }
  if (fx < -0.05 || fx > 1.05) return 0;
  let err = ((fx - e.fx) / SIGMA_X) ** 2;
  if (e.size) err += (Math.log(Math.max(1e-4, size) / e.size) / SIGMA_SIZE) ** 2;
  return Math.exp(-err / 2);
}

/** All ways to assign distinct pagodas to n pagoda slots. */
function assignments(n: number): string[][] {
  const out: string[][] = [];
  const rec = (cur: string[]) => {
    if (cur.length === n) return void out.push(cur);
    for (const id of PAGODA_IDS) if (!cur.includes(id)) rec([...cur, id]);
  };
  rec([]);
  return out;
}
const ASSIGN = [0, 1, 2, 3].map(assignments);

function compositionScore(p: Pose, elems: Elem[], frame: { x: number; w: number }): number[] {
  const pagodaSlots = elems.filter((e) => e.kind === 'pagoda');
  let best: number[] = elems.map(() => 0);
  let bestMean = -1;
  for (const ids of ASSIGN[pagodaSlots.length]) {
    let k = 0;
    const scores = elems.map((e) => (e.kind === 'pagoda' ? elemScore(p, e, frame, ids[k++]) : elemScore(p, e, frame)));
    const logMean = scores.reduce((a, b) => a + Math.log(Math.max(1e-9, b)), 0) / scores.length;
    if (logMean > bestMean || bestMean === -1) {
      bestMean = logMean;
      best = scores;
    }
  }
  return best;
}

/** How similar the photo frame is to one part of the note (0..1). */
export function similarity(p: Pose, t: Target): number {
  const scores = compositionScore(p, t.elems, FRAME);
  return Math.exp(scores.reduce((a, b) => a + Math.log(Math.max(1e-9, b)), 0) / scores.length);
}

/** Per-pagoda match against the whole note; a pagoda counts as matched at >= this. */
export const PAGODA_MATCH = 0.6;

/**
 * How many of the note's three pagodas the current view matches at once.
 * The best possible anywhere on the lake is two — just like in reality.
 */
export function wholeMatch(p: Pose): number {
  const scores = compositionScore(p, NOTE_PAGODAS, WIDE);
  let best = 0;
  // compositionScore maximises the overall fit; also try maximising the count
  for (const ids of ASSIGN[3]) {
    const n = NOTE_PAGODAS.filter((e, i) => elemScore(p, e, WIDE, ids[i]) >= PAGODA_MATCH).length;
    best = Math.max(best, n);
  }
  return Math.max(best, scores.filter((s) => s >= PAGODA_MATCH).length);
}

// ---- boat movement constraints -------------------------------------------------
export function collide(p: { x: number; y: number }): { x: number; y: number } {
  let { x, y } = p;
  // stay inside the lake
  const dl = Math.hypot(x - LAKE.x, y - LAKE.y);
  if (dl > LAKE.r) {
    x = LAKE.x + ((x - LAKE.x) / dl) * LAKE.r;
    y = LAKE.y + ((y - LAKE.y) / dl) * LAKE.r;
  }
  // stay off the island and away from the pagodas
  const obstacles = [{ x: ISLAND.x, y: ISLAND.y, r: ISLAND.r + 6 }, ...OBJECTS.filter((o) => o.r > 0).map((o) => ({ x: o.x, y: o.y, r: o.r + 3 }))];
  for (const ob of obstacles) {
    const d = Math.hypot(x - ob.x, y - ob.y);
    if (d < ob.r) {
      const k = ob.r / (d || 1);
      x = ob.x + (x - ob.x) * k;
      y = ob.y + (y - ob.y) * k;
    }
  }
  return { x, y };
}

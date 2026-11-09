import * as Phaser from 'phaser';
import { type Ctx, lin, rad, ell, blob, curve, seeded, INK, inked } from './paint';
import { paintMom, MOM_TEX, paintOriole, ORIOLE_TEX, paintKite, KITE_TEX, type KiteKind } from './characters';

const W = 1280;
const H = 720;

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

export const KITES: KiteKind[] = ['swallow', 'butterfly', 'centipede', 'cow', 'rabbit', 'koi', 'crab', 'bell', 'umbrella', 'lotus', 'peach', 'lantern'];

// ---- the lakeside at 柳浪闻莺 ------------------------------------------------------------------------

export const SHORE = { horizon: 300, walk: 470, lawn: 560 };

interface Season {
  sky: [string, string, string];
  hillFar: string;
  hillNear: string;
  lake: [string, string];
  walk: [string, string];
  lawn: [string, string];
  spring: boolean;
}

const BARE: Season = {
  sky: ['#c4ccd8', '#d8dce2', '#e8e6e2'],
  hillFar: '#a8b0bc',
  hillNear: '#8e98a6',
  lake: ['#c8d0d6', '#a8b4bc'],
  walk: ['#b8b0a6', '#9a9288'],
  lawn: ['#a8a888', '#8a8a6e'],
  spring: false,
};
const SPRING: Season = {
  sky: ['#8ec8ec', '#bce0f2', '#f2f0dc'],
  hillFar: '#8ab0b8',
  hillNear: '#6a9a8a',
  lake: ['#a8d8d0', '#6eb0b0'],
  walk: ['#d8ccb4', '#b8a88c'],
  lawn: ['#8cc86a', '#5a9a48'],
  spring: true,
};

/** Soft cumulus, lit from above. */
function cloud(ctx: Ctx, x: number, y: number, s: number, alpha: number): void {
  const r = seeded(Math.round(x + y));
  for (let i = 0; i < 7; i++) {
    const cx = x + (i - 3) * 20 * s + (r() - 0.5) * 10 * s;
    const cy = y - Math.sin((i / 6) * Math.PI) * 16 * s;
    ell(ctx, cx, cy + 6 * s, 26 * s, 14 * s, `rgba(180,200,220,${alpha * 0.4})`);
    ell(ctx, cx, cy, 24 * s, 18 * s, `rgba(255,255,255,${alpha})`);
  }
}

/** A peach tree in blossom (or just bare twigs in early spring). */
function peachTree(ctx: Ctx, x: number, y: number, s: number, bloom: boolean, seed: number): void {
  const r = seeded(seed);
  ctx.strokeStyle = '#5a4034';
  ctx.lineCap = 'round';
  const branch = (bx: number, by: number, a: number, len: number, w: number, depth: number) => {
    const ex = bx + Math.cos(a) * len;
    const ey = by + Math.sin(a) * len;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    if (depth > 0) {
      branch(ex, ey, a - 0.4 - r() * 0.3, len * 0.72, w * 0.65, depth - 1);
      branch(ex, ey, a + 0.4 + r() * 0.3, len * 0.72, w * 0.65, depth - 1);
    } else if (bloom) {
      for (let k = 0; k < 6; k++) ell(ctx, ex + (r() - 0.5) * 14 * s, ey + (r() - 0.5) * 12 * s, 5 * s, 5 * s, r() < 0.5 ? '#f8b8cc' : '#fcd8e2');
    }
  };
  branch(x, y, -Math.PI / 2, 40 * s, 7 * s, 4);
}

function paintShore(ctx: Ctx, se: Season): void {
  const { horizon, walk, lawn } = SHORE;
  // the sky
  ctx.fillStyle = lin(ctx, 0, 0, 0, horizon, [[0, se.sky[0]], [0.6, se.sky[1]], [1, se.sky[2]]]);
  ctx.fillRect(0, 0, W, horizon);
  if (se.spring) {
    cloud(ctx, 200, 90, 1.1, 0.95);
    cloud(ctx, 760, 60, 0.9, 0.9);
    cloud(ctx, 1120, 130, 1.2, 0.9);
  } else {
    // a low, flat overcast
    for (let i = 0; i < 5; i++) ell(ctx, 120 + i * 280, 80 + (i % 2) * 40, 260, 24, 'rgba(255,255,255,0.35)');
  }
  // the western hills across the lake, with 雷峰塔 small on the left and 保俶塔 far right
  const r = seeded(3);
  const ridge = (base: number, amp: number, seed: number) => {
    const q = seeded(seed);
    const w = [0, 1, 2].map((i) => ({ f: (0.003 + q() * 0.004) * (i + 1), p: q() * 7, a: amp / (i + 1.2) }));
    return (x: number) => base - w.reduce((s, v) => s + (Math.sin(x * v.f + v.p) * 0.5 + 0.5) * v.a, 0);
  };
  const far = ridge(horizon - 4, 70, 5);
  ctx.fillStyle = se.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, far(x));
  ctx.lineTo(W, horizon);
  ctx.fill();
  const near = ridge(horizon + 4, 34, 9);
  ctx.fillStyle = se.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 6);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, near(x));
  ctx.lineTo(W, horizon + 6);
  ctx.fill();
  // tiny pagodas
  ctx.fillStyle = se.spring ? '#7a5a4a' : '#7a7a82';
  const lx = 210;
  const ly = near(lx);
  for (let k = 0; k < 5; k++) ctx.fillRect(lx - 7 + k, ly - 8 - k * 7, 14 - k * 2, 5);
  ctx.fillRect(lx - 1, ly - 50, 2, 10);
  ctx.beginPath();
  ctx.moveTo(1180, far(1180) + 2);
  ctx.lineTo(1186, far(1180) - 40);
  ctx.lineTo(1192, far(1180) + 2);
  ctx.fill();
  // the lake
  ctx.fillStyle = lin(ctx, 0, horizon, 0, walk, [[0, se.lake[0]], [1, se.lake[1]]]);
  ctx.fillRect(0, horizon + 4, W, walk - horizon);
  // 苏堤 far off, and a few boats
  ctx.fillStyle = se.spring ? 'rgba(60,110,80,0.7)' : 'rgba(110,120,130,0.6)';
  ctx.fillRect(380, horizon + 22, 520, 3);
  for (let x = 384; x < 900; x += 8) ell(ctx, x, horizon + 20, 4, 3 + (x % 3), ctx.fillStyle as string);
  for (const [bx, by] of [[300, horizon + 70], [980, horizon + 50], [640, horizon + 110]]) {
    ctx.fillStyle = se.spring ? '#6a4a3a' : '#7a7a7a';
    ctx.beginPath();
    ctx.moveTo(bx - 22, by);
    ctx.lineTo(bx + 22, by);
    ctx.lineTo(bx + 15, by + 6);
    ctx.lineTo(bx - 15, by + 6);
    ctx.fill();
    ctx.fillRect(bx - 8, by - 9, 14, 9);
  }
  // ripples and glints
  for (let i = 0; i < 90; i++) {
    const y = horizon + 12 + r() * (walk - horizon - 20);
    const x = r() * W;
    ctx.fillStyle = se.spring ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, 10 + r() * 30 * ((y - horizon) / 170), 1.4);
  }
  // the lakeside walk: a stone edge and paving
  ctx.fillStyle = lin(ctx, 0, walk, 0, lawn, [[0, se.walk[0]], [1, se.walk[1]]]);
  ctx.fillRect(0, walk, W, lawn - walk);
  ctx.fillStyle = se.spring ? '#9a9080' : '#8a8478';
  ctx.fillRect(0, walk - 6, W, 10);
  ctx.strokeStyle = 'rgba(80,70,60,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 56) {
    ctx.beginPath();
    ctx.moveTo(x, walk + 4);
    ctx.lineTo(x - 20, lawn);
    ctx.stroke();
  }
  // the lawn
  ctx.fillStyle = lin(ctx, 0, lawn, 0, H, [[0, se.lawn[0]], [1, se.lawn[1]]]);
  ctx.fillRect(0, lawn, W, H - lawn);
  for (let i = 0; i < 900; i++) {
    const x = r() * W;
    const y = lawn + r() * (H - lawn);
    const k = (y - lawn) / (H - lawn);
    ctx.strokeStyle = se.spring ? (r() < 0.5 ? 'rgba(60,120,50,0.5)' : 'rgba(170,220,120,0.5)') : 'rgba(110,100,80,0.45)';
    ctx.lineWidth = 1 + k;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 4, y - 4 - k * 8);
    ctx.stroke();
  }
  if (se.spring) {
    // wild flowers in the grass
    for (let i = 0; i < 120; i++) {
      const x = r() * W;
      const y = lawn + 10 + r() * (H - lawn - 10);
      const c = ['#ffffff', '#ffe060', '#f8a0c0', '#c8a0f0'][i % 4];
      for (let k = 0; k < 5; k++) ell(ctx, x + Math.cos(k * 1.26) * 2.6, y + Math.sin(k * 1.26) * 2.6, 2, 2, c);
      ell(ctx, x, y, 1.4, 1.4, '#f0a020');
    }
  }
  // peach trees along the far side of the walk
  for (const [x, s] of [[120, 1], [560, 0.8], [1010, 1.1]] as const) peachTree(ctx, x, walk + 2, s, se.spring, x);
}

// ---- the lawn for kites ------------------------------------------------------------------------------

export const LAWN = { horizon: 470 };

function paintLawn(ctx: Ctx): void {
  const hz = LAWN.horizon;
  ctx.fillStyle = lin(ctx, 0, 0, 0, hz, [[0, '#5aa8e0'], [0.5, '#9ad0f0'], [1, '#e6f2ea']]);
  ctx.fillRect(0, 0, W, hz);
  // big soft clouds, the highest ones where the kites will go
  cloud(ctx, 220, 110, 1.6, 0.95);
  cloud(ctx, 700, 60, 1.3, 0.9);
  cloud(ctx, 1080, 150, 1.8, 0.95);
  cloud(ctx, 480, 260, 1, 0.8);
  // the lake and the hills beyond the trees
  ctx.fillStyle = '#86b4b8';
  ctx.beginPath();
  ctx.moveTo(0, hz);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, hz - 30 - Math.sin(x * 0.006) * 14 - Math.sin(x * 0.017) * 6);
  ctx.lineTo(W, hz);
  ctx.fill();
  ctx.fillStyle = '#9ed0cc';
  ctx.fillRect(0, hz - 4, W, 14);
  // a band of willows and peach blossom at the far edge of the lawn
  const r = seeded(11);
  for (let x = -20; x < W + 40; x += 30 + r() * 30) {
    const y = hz + 10;
    for (let k = 0; k < 4; k++) ell(ctx, x + (r() - 0.5) * 30, y - 20 - r() * 20, 26 + r() * 14, 22 + r() * 10, r() < 0.2 ? '#f6b8c8' : r() < 0.5 ? '#7ab85a' : '#5a9a48');
    // drooping willow fringes
    ctx.strokeStyle = 'rgba(90,150,70,0.7)';
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) {
      const sx = x + (r() - 0.5) * 50;
      ctx.beginPath();
      ctx.moveTo(sx, y - 30);
      ctx.quadraticCurveTo(sx + 4, y - 10, sx + 2, y + 6);
      ctx.stroke();
    }
  }
  // the great lawn
  ctx.fillStyle = lin(ctx, 0, hz + 10, 0, H, [[0, '#a8d878'], [1, '#5a9a48']]);
  ctx.fillRect(0, hz + 10, W, H - hz - 10);
  for (let i = 0; i < 1100; i++) {
    const x = r() * W;
    const y = hz + 14 + r() * (H - hz - 14);
    const k = (y - hz) / (H - hz);
    ctx.strokeStyle = r() < 0.5 ? 'rgba(60,120,50,0.45)' : 'rgba(190,230,130,0.5)';
    ctx.lineWidth = 0.8 + k * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 4, y - 3 - k * 9);
    ctx.stroke();
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * W;
    const y = hz + 30 + r() * (H - hz - 30);
    const c = ['#ffffff', '#ffe060', '#f8a0c0'][i % 3];
    for (let k = 0; k < 5; k++) ell(ctx, x + Math.cos(k * 1.26) * 2.4, y + Math.sin(k * 1.26) * 2.4, 1.8, 1.8, c);
  }
  // far-off people picnicking, and their kites already up
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 140 + r() * 40;
    const y = hz + 30 + r() * 30;
    ctx.fillStyle = ['#e86a5a', '#5a8ae8', '#f0c040', '#8a5ac8'][i % 4];
    ctx.fillRect(x - 3, y - 14, 6, 12);
    ell(ctx, x, y - 18, 3.4, 3.4, '#f1c7a5');
    if (i % 3 === 0) {
      ctx.fillStyle = ['#f8d0a0', '#a0d0f8', '#f8a0c0'][i % 3];
      ctx.fillRect(x + 10, y - 2, 40, 12);
    }
    if (i % 2) {
      const kx = x + 40 + r() * 80;
      const ky = 160 + r() * 140;
      ctx.strokeStyle = 'rgba(80,80,80,0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + 3, y - 16);
      ctx.quadraticCurveTo((x + kx) / 2, (y + ky) / 2 + 40, kx, ky);
      ctx.stroke();
      ctx.fillStyle = ['#e84a4a', '#4a8ae8', '#f0c040'][i % 3];
      ctx.beginPath();
      ctx.moveTo(kx, ky - 10);
      ctx.lineTo(kx + 8, ky);
      ctx.lineTo(kx, ky + 12);
      ctx.lineTo(kx - 8, ky);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// ---- the stone bench by the water, for making whistles ----------------------------------------------

function paintBench(ctx: Ctx): void {
  // soft, out-of-focus spring behind: lake, willows, blossom
  ctx.fillStyle = lin(ctx, 0, 0, 0, 420, [[0, '#cfe6ee'], [0.6, '#b8d8d0'], [1, '#9ac4b8']]);
  ctx.fillRect(0, 0, W, 420);
  const r = seeded(21);
  // a blurred far shore
  ctx.fillStyle = 'rgba(120,160,150,0.35)';
  ctx.fillRect(0, 230, W, 40);
  // soft out-of-focus blobs (bokeh): blossom, leaves, sparkles on the water
  const bokeh = (x: number, y: number, rr: number, rgb: string, a: number) => {
    ctx.fillStyle = rad(ctx, x, y, rr * 0.2, rr, [[0, `rgba(${rgb},${a})`], [0.7, `rgba(${rgb},${a * 0.7})`], [1, `rgba(${rgb},0)`]]);
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  };
  for (let i = 0; i < 60; i++) {
    const kind = r();
    bokeh(r() * W, r() * 230, 30 + r() * 50, kind < 0.35 ? '248,180,205' : kind < 0.7 ? '140,200,120' : '255,255,255', 0.35);
  }
  for (let i = 0; i < 50; i++) bokeh(r() * W, 280 + r() * 130, 6 + r() * 14, '255,255,250', 0.7);
  // willow strands hanging into the top of the frame, softly blurred
  for (let i = 0; i < 40; i++) {
    const x = r() * W;
    ctx.strokeStyle = `rgba(110,170,90,${0.25 + r() * 0.25})`;
    ctx.lineWidth = 3 + r() * 4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 10, 60, x + 4, 80 + r() * 120);
    ctx.stroke();
  }
  // the bench top: speckled granite, seen close up
  ctx.fillStyle = lin(ctx, 0, 420, 0, H, [[0, '#c8c2b8'], [0.15, '#b0a89c'], [1, '#7a7268']]);
  ctx.fillRect(0, 420, W, H - 420);
  for (let i = 0; i < 1600; i++) {
    const x = r() * W;
    const y = 420 + r() * (H - 420);
    ctx.fillStyle = r() < 0.5 ? 'rgba(60,56,52,0.35)' : 'rgba(255,250,240,0.35)';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, 420, W, 3);
  // a few willow leaves and a pocketknife lying on the bench
  for (let i = 0; i < 9; i++) {
    const x = 100 + r() * 1080;
    const y = 600 + r() * 90;
    ell(ctx, x, y, 14, 3.6, '#7ab84a', r() * 3);
  }
  ctx.save();
  ctx.translate(1060, 640);
  ctx.rotate(-0.2);
  ctx.fillStyle = lin(ctx, 0, -8, 0, 8, [[0, '#d84a3a'], [1, '#8a2a20']]);
  ctx.beginPath();
  ctx.roundRect(-60, -9, 90, 18, 8);
  ctx.fill();
  ctx.fillStyle = lin(ctx, 0, -6, 0, 6, [[0, '#f4f6f8'], [1, '#9aa0a8']]);
  ctx.beginPath();
  ctx.moveTo(30, -6);
  ctx.lineTo(90, -2);
  ctx.lineTo(30, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---- my room, a spring morning -------------------------------------------------------------------------

function paintRoom(ctx: Ctx): void {
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#f4ead8'], [1, '#e2d2b8']]);
  ctx.fillRect(0, 0, W, H);
  // the window: willow green outside, sunlight
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(700, 70, 460, 360);
  ctx.fillStyle = lin(ctx, 0, 84, 0, 416, [[0, '#9ad0f0'], [1, '#e8f4e0']]);
  ctx.fillRect(714, 84, 432, 332);
  const r = seeded(5);
  for (let i = 0; i < 70; i++) {
    const x = 714 + r() * 432;
    ctx.strokeStyle = r() < 0.5 ? 'rgba(90,160,70,0.85)' : 'rgba(140,200,100,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, 84);
    ctx.quadraticCurveTo(x + 6, 160, x + 2, 180 + r() * 180);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(926, 70, 10, 360);
  ctx.fillRect(700, 246, 460, 10);
  // the sill
  ctx.fillStyle = '#a8865e';
  ctx.fillRect(686, 428, 488, 18);
  // a sunbeam across the room
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = lin(ctx, 900, 100, 400, 700, [[0, 'rgba(255,240,190,0.35)'], [1, 'rgba(255,230,170,0)']]);
  ctx.beginPath();
  ctx.moveTo(714, 84);
  ctx.lineTo(1146, 84);
  ctx.lineTo(700, H);
  ctx.lineTo(160, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // the bed with a flowered quilt
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(40, 430, 560, 40);
  ctx.fillStyle = lin(ctx, 0, 380, 0, 470, [[0, '#f8c8c8'], [1, '#e0a0a8']]);
  ctx.beginPath();
  ctx.roundRect(60, 380, 540, 80, 20);
  ctx.fill();
  for (let i = 0; i < 18; i++) {
    const x = 90 + (i % 9) * 58;
    const y = 400 + Math.floor(i / 9) * 32;
    for (let k = 0; k < 5; k++) ell(ctx, x + Math.cos(k * 1.26) * 5, y + Math.sin(k * 1.26) * 5, 4, 4, '#ffffff');
    ell(ctx, x, y, 3, 3, '#f8d050');
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(70, 350, 150, 50, 20);
  ctx.fill();
  // a kite leaning in the corner, waiting
  ctx.save();
  ctx.translate(1190, 560);
  ctx.rotate(-0.2);
  ctx.scale(0.7, 0.7);
  ctx.fillStyle = '#1e2230';
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.quadraticCurveTo(-60, -90, -90, -70);
  ctx.quadraticCurveTo(-40, -50, -20, -40);
  ctx.lineTo(-14, 30);
  ctx.lineTo(0, 10);
  ctx.lineTo(14, 30);
  ctx.lineTo(20, -40);
  ctx.quadraticCurveTo(40, -50, 90, -70);
  ctx.quadraticCurveTo(60, -90, 0, -80);
  ctx.fill();
  ell(ctx, 0, -40, 10, 18, '#ffffff');
  ell(ctx, -40, -70, 10, 4, '#e84a4a');
  ell(ctx, 40, -70, 10, 4, '#e84a4a');
  ctx.restore();
  // the floor
  ctx.fillStyle = lin(ctx, 0, 600, 0, H, [[0, '#b88a5a'], [1, '#8a6038']]);
  ctx.fillRect(0, 600, W, H - 600);
  ctx.strokeStyle = 'rgba(80,50,20,0.3)';
  for (let y = 616; y < H; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

// ---- willow trunk ---------------------------------------------------------------------------------------

export const TRUNK = { w: 260, h: 460 };
/** Where strands hang from on the trunk texture (relative to its centre-bottom origin). */
export const BOUGHS: [number, number][] = [
  [-96, -380],
  [-60, -410],
  [-20, -428],
  [20, -432],
  [60, -416],
  [96, -386],
  [-110, -340],
  [110, -344],
];

/** A gnarled old willow trunk, leaning a little, with its boughs spreading at the top. */
function paintTrunk(ctx: Ctx): void {
  const cx = TRUNK.w / 2;
  const by = TRUNK.h - 6;
  ell(ctx, cx, by, 60, 8, 'rgba(0,0,0,0.18)');
  // the trunk
  blob(ctx, [cx - 34, by, cx - 26, by - 110, cx - 30, by - 200, cx - 18, by - 300, cx - 4, by - 352, cx + 14, by - 346, cx + 22, by - 260, cx + 18, by - 150, cx + 30, by - 40, cx + 44, by]);
  inked(ctx, lin(ctx, cx - 40, 0, cx + 40, 0, [[0, '#4a3a30'], [0.4, '#7a6450'], [0.75, '#8a7458'], [1, '#4a3a30']]), 1.8);
  // bark ridges
  const r = seeded(7);
  for (let i = 0; i < 26; i++) {
    const x = cx - 22 + r() * 44;
    const y0 = by - r() * 340;
    curve(ctx, [x, y0, x + (r() - 0.5) * 8, y0 - 20, x + (r() - 0.5) * 6, y0 - 40 - r() * 30], 'rgba(40,28,20,0.5)', 1.4);
  }
  // a knot hole
  ell(ctx, cx + 4, by - 170, 8, 12, '#3a2a20');
  ell(ctx, cx + 5, by - 168, 4, 7, '#1e140e');
  // boughs to the hanging points
  const top = { x: cx - 4, y: by - 300 };
  for (const [bx, bY] of BOUGHS) {
    const ex = cx + bx;
    const ey = by + bY + 10;
    curve(ctx, [top.x, top.y, (top.x + ex) / 2, top.y - 30, ex, ey], '#5a4636', 5);
    curve(ctx, [top.x, top.y, (top.x + ex) / 2, top.y - 30, ex, ey], INK, 0.8, 0.5);
  }
}

// ---- small things ---------------------------------------------------------------------------------------

function paintWhistle(ctx: Ctx): void {
  ctx.save();
  ctx.scale(2, 2);
  ctx.beginPath();
  ctx.roundRect(6, 10, 100, 20, 9);
  inked(ctx, lin(ctx, 0, 10, 0, 30, [[0, '#8ab86a'], [0.5, '#5a8a42'], [1, '#3e6a2e']]), 1.3);
  // the mouthpiece, its green skin scraped back to pale wood
  ctx.beginPath();
  ctx.roundRect(6, 10, 18, 20, 8);
  inked(ctx, lin(ctx, 0, 10, 0, 30, [[0, '#f4ecc8'], [1, '#d8c890']]), 1.1);
  ell(ctx, 106, 20, 4, 9, '#2a3a1e');
  ctx.restore();
}

export function generateLiulangTextures(scene: Phaser.Scene): void {
  canvas(scene, 'llParkBare', W, H, (ctx) => paintShore(ctx, BARE));
  canvas(scene, 'llParkSpring', W, H, (ctx) => paintShore(ctx, SPRING));
  canvas(scene, 'llLawn', W, H, paintLawn);
  canvas(scene, 'llBench', W, H, paintBench);
  canvas(scene, 'llRoom', W, H, paintRoom);
  canvas(scene, 'llTrunk', TRUNK.w, TRUNK.h, paintTrunk);
  canvas(scene, 'llMom', MOM_TEX.w, MOM_TEX.h, (ctx) => paintMom(ctx, 'stand'));
  canvas(scene, 'llMomKite', MOM_TEX.w, MOM_TEX.h, (ctx) => paintMom(ctx, 'kite'));
  for (const p of ['perch', 'up', 'down', 'sing'] as const) canvas(scene, `llOriole-${p}`, ORIOLE_TEX.w, ORIOLE_TEX.h, (ctx) => paintOriole(ctx, p));
  for (const k of KITES) canvas(scene, `llKite-${k}`, KITE_TEX.w, KITE_TEX.h, (ctx) => paintKite(ctx, k));
  canvas(scene, 'llWhistle', 224, 80, paintWhistle);
  canvas(scene, 'llPetal', 24, 24, (ctx) => {
    ell(ctx, 12, 12, 9, 6, rad(ctx, 10, 10, 1, 10, [[0, '#ffffff'], [1, '#f8a8c0']]), 0.5);
  });
}

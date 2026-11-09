/**
 * 西湖十景全图: one long handscroll painting of the whole lake, ink and light
 * colour on old paper, with each of the ten scenes in its place round the shore.
 */
import type * as Phaser from 'phaser';
import { FONT_SERIF } from '../core/config';

type Ctx = CanvasRenderingContext2D;

export const PANO = { w: 3600, h: 560 };
/** The ten scenes in order round the lake, and where each sits on the scroll. */
export const STATIONS: { id: string; x: number }[] = [
  'duanqiao',
  'pinghu',
  'quyuan',
  'sudi',
  'huagang',
  'shuangfeng',
  'leifeng',
  'nanping',
  'santan',
  'liulang',
].map((id, i) => ({ id, x: 280 + i * 340 }));

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function wash(ctx: Ctx, pts: [number, number][], color: string, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function ink(ctx: Ctx, w: number, a = 0.85): void {
  ctx.strokeStyle = `rgba(40,36,32,${a})`;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/** Ink-wash mountains: a soft, wet-edged ridge, darker at the crest. */
function mountains(ctx: Ctx, base: number, amp: number, seed: number, color: string, alpha: number): void {
  const r = rng(seed);
  const waves = [0, 1, 2, 3].map((i) => ({ f: (0.0012 + r() * 0.002) * (i + 1), p: r() * 7, a: amp / (i + 1.1) }));
  const top = (x: number) => base - waves.reduce((s, w) => s + (Math.sin(x * w.f + w.p) * 0.5 + 0.5) * w.a, 0);
  for (let layer = 0; layer < 3; layer++) {
    const pts: [number, number][] = [[0, base + 30]];
    for (let x = 0; x <= PANO.w; x += 12) pts.push([x, top(x) + layer * 10 + (r() - 0.5) * 2]);
    pts.push([PANO.w, base + 30]);
    wash(ctx, pts, color, alpha * (0.5 - layer * 0.12));
  }
  // crest strokes and texture strokes (皴)
  ink(ctx, 1.4, alpha * 0.6);
  ctx.beginPath();
  for (let x = 0; x <= PANO.w; x += 12) (x ? ctx.lineTo(x, top(x)) : ctx.moveTo(x, top(x)));
  ctx.stroke();
  for (let i = 0; i < PANO.w / 30; i++) {
    const x = r() * PANO.w;
    const y = top(x) + 8 + r() * 30;
    ink(ctx, 1, alpha * 0.35);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6 + r() * 8, y + 10 + r() * 10);
    ctx.stroke();
  }
}

/** A little tree of dots and strokes, the way they're painted on old scrolls. */
function tree(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ink(ctx, 1.6 * s);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 2, y - 26 * s);
  ctx.stroke();
  const r = rng(Math.round(x));
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + (r() - 0.5) * 22 * s, y - 26 * s - r() * 16 * s, 4 * s, 3 * s, r(), 0, Math.PI * 2);
    ctx.fill();
  }
}

function willow(ctx: Ctx, x: number, y: number, s: number): void {
  ink(ctx, 2 * s);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 4, y - 20 * s, x + 2, y - 40 * s);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const sx = x - 18 * s + i * 2.8 * s;
    ctx.strokeStyle = 'rgba(90,140,70,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, y - 40 * s);
    ctx.quadraticCurveTo(sx + 3, y - 20 * s, sx + 1, y - 4 * s - (i % 3) * 4);
    ctx.stroke();
  }
}

function pagoda(ctx: Ctx, x: number, y: number, h: number, color: string): void {
  ctx.fillStyle = color;
  for (let k = 0; k < 5; k++) {
    const w = h * 0.3 * (1 - k * 0.12);
    ctx.fillRect(x - w / 2, y - (k + 1) * (h / 6), w, h / 6 - 2);
    ctx.fillRect(x - w * 0.75, y - (k + 1) * (h / 6) - 2, w * 1.5, 2.5);
  }
  ctx.fillRect(x - 1, y - h, 2, h / 6);
}

/** The ten landmarks, each painted small in its place. */
function landmark(ctx: Ctx, id: string, x: number, water: number): void {
  const r = rng(x);
  switch (id) {
    case 'duanqiao': {
      // the Broken Bridge, its arch half white with lingering snow
      ink(ctx, 2.4);
      ctx.beginPath();
      ctx.moveTo(x - 90, water);
      ctx.quadraticCurveTo(x, water - 50, x + 90, water);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, water + 8, 26, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - 20, water - 22);
      ctx.quadraticCurveTo(x + 30, water - 30, x + 80, water - 4);
      ctx.stroke();
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(x - 120 + r() * 240, 120 + r() * 260, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'pinghu': {
      // a pavilion on a terrace over the water, and the autumn moon
      ctx.fillStyle = 'rgba(250,236,190,0.95)';
      ctx.beginPath();
      ctx.arc(x + 50, 150, 30, 0, Math.PI * 2);
      ctx.fill();
      ink(ctx, 1.4, 0.5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(40,36,32,0.85)';
      ctx.fillRect(x - 60, water - 14, 120, 6);
      ctx.fillRect(x - 40, water - 50, 4, 36);
      ctx.fillRect(x + 36, water - 50, 4, 36);
      ctx.beginPath();
      ctx.moveTo(x - 56, water - 48);
      ctx.quadraticCurveTo(x, water - 80, x + 56, water - 48);
      ctx.lineTo(x + 66, water - 54);
      ctx.lineTo(x - 66, water - 54);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(250,236,190,0.6)';
      ctx.fillRect(x + 36, water + 20, 30, 3);
      break;
    }
    case 'quyuan': {
      // lotus leaves and pink flowers on the water
      for (let i = 0; i < 16; i++) {
        const lx = x - 100 + r() * 200;
        const ly = water + 6 + r() * 60;
        ctx.fillStyle = `rgba(${70 + r() * 30},${130 + r() * 30},${80},0.75)`;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        const fx = x - 80 + r() * 160;
        const fy = water - 10 + r() * 50;
        ctx.fillStyle = 'rgba(232,110,150,0.9)';
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.ellipse(fx + (k - 2) * 4, fy - Math.abs(k - 2) * -2, 3.4, 8, (k - 2) * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'sudi': {
      // the causeway at dawn: willows and peach blossom along it, the sun just up
      ctx.fillStyle = 'rgba(250,180,120,0.8)';
      ctx.beginPath();
      ctx.arc(x - 60, water - 70, 22, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(150,130,100,0.7)';
      ctx.fillRect(x - 150, water + 2, 300, 7);
      for (let k = -2; k <= 2; k++) {
        ink(ctx, 1.8);
        ctx.beginPath();
        ctx.arc(x + k * 60, water + 10, 9, Math.PI, 0);
        ctx.stroke();
      }
      for (let k = 0; k < 7; k++) {
        if (k % 2) willow(ctx, x - 140 + k * 44, water + 2, 0.8);
        else tree(ctx, x - 140 + k * 44, water + 2, 0.8, 'rgba(240,160,180,0.9)');
      }
      break;
    }
    case 'huagang': {
      // the fish pond, alive with koi, a peony by the bank
      ctx.fillStyle = 'rgba(160,200,200,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, water + 30, 100, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 12; i++) {
        const fx = x - 80 + r() * 160;
        const fy = water + 18 + r() * 24;
        ctx.fillStyle = r() < 0.6 ? 'rgba(230,90,40,0.95)' : 'rgba(255,250,240,0.95)';
        ctx.beginPath();
        ctx.ellipse(fx, fy, 8, 3, r() - 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = 'rgba(220,80,120,0.9)';
        ctx.beginPath();
        ctx.arc(x + 110 + Math.cos(k) * 8, water - 10 + Math.sin(k) * 6, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'shuangfeng': {
      // two peaks, each with its pagoda, piercing a sea of cloud
      for (const [px, ph] of [[x - 60, 150], [x + 60, 190]] as const) {
        wash(ctx, [[px - 90, water], [px, water - ph], [px + 90, water]], '#4a5a50', 0.55);
        pagoda(ctx, px, water - ph + 4, 46, 'rgba(40,36,32,0.9)');
      }
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.ellipse(x - 130 + i * 32, water - 70 + Math.sin(i) * 8, 30, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'leifeng': {
      // Leifeng Pagoda on its hill, lit gold by the setting sun
      ctx.fillStyle = 'rgba(250,150,90,0.55)';
      ctx.beginPath();
      ctx.arc(x + 70, water - 120, 34, 0, Math.PI * 2);
      ctx.fill();
      wash(ctx, [[x - 110, water], [x - 20, water - 70], [x + 60, water - 60], [x + 120, water]], '#5a4a40', 0.5);
      pagoda(ctx, x - 10, water - 66, 110, 'rgba(150,80,40,0.95)');
      break;
    }
    case 'nanping': {
      // the temple under the hill, and the evening bell's sound rolling out
      ctx.fillStyle = 'rgba(220,170,70,0.85)';
      ctx.fillRect(x - 70, water - 40, 140, 30);
      ctx.fillStyle = 'rgba(40,36,32,0.9)';
      ctx.beginPath();
      ctx.moveTo(x - 86, water - 40);
      ctx.quadraticCurveTo(x, water - 76, x + 86, water - 40);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,120,60,0.6)';
      ctx.lineWidth = 2;
      for (let k = 1; k <= 4; k++) {
        ctx.beginPath();
        ctx.arc(x, water - 60, 30 + k * 22, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      break;
    }
    case 'santan': {
      // three stone lanterns in the water, the moon between them
      ctx.fillStyle = 'rgba(250,236,190,0.9)';
      ctx.beginPath();
      ctx.arc(x, 150, 26, 0, Math.PI * 2);
      ctx.fill();
      for (const dx of [-70, 0, 70]) {
        ctx.fillStyle = 'rgba(60,56,52,0.9)';
        ctx.fillRect(x + dx - 3, water + 4, 6, 26);
        ctx.beginPath();
        ctx.arc(x + dx, water - 4, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + dx - 9, water - 14);
        ctx.lineTo(x + dx, water - 30);
        ctx.lineTo(x + dx + 9, water - 14);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,210,120,0.95)';
        ctx.beginPath();
        ctx.arc(x + dx, water - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'liulang': {
      // a row of willows, and orioles among them
      for (let k = 0; k < 5; k++) willow(ctx, x - 120 + k * 60, water + 4, 1.3);
      for (let i = 0; i < 4; i++) {
        const bx = x - 90 + r() * 180;
        const by = water - 60 - r() * 40;
        ctx.fillStyle = 'rgba(255,200,30,0.95)';
        ctx.beginPath();
        ctx.ellipse(bx, by, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(30,26,24,0.95)';
        ctx.fillRect(bx + 2, by - 3, 6, 2);
      }
      break;
    }
  }
}

export function paintPanorama(ctx: Ctx): void {
  const { w, h } = PANO;
  // old paper
  ctx.fillStyle = '#efe4cc';
  ctx.fillRect(0, 0, w, h);
  const r = rng(99);
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(160,130,90,0.08)' : 'rgba(255,255,250,0.15)';
    ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1);
  }
  const water = 330;
  // distant hills, then nearer ones, in washes of blue-green ink
  mountains(ctx, 240, 120, 3, '#6a8a8a', 0.5);
  mountains(ctx, 300, 70, 7, '#4a6a5e', 0.55);
  // the lake: a pale wash with dry-brush ripples
  ctx.fillStyle = 'rgba(150,190,190,0.28)';
  ctx.fillRect(0, water, w, 160);
  for (let i = 0; i < 700; i++) {
    const x = r() * w;
    const y = water + 6 + r() * 150;
    ink(ctx, 0.8, 0.15);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10 + r() * 30, y);
    ctx.stroke();
  }
  // the near shore with trees, all along the bottom
  for (let x = 20; x < w; x += 40 + r() * 40) {
    // keep the space under each scene clear for its caption
    if (STATIONS.some((s) => Math.abs(s.x - x) < 150)) continue;
    tree(ctx, x, h - 24 - r() * 12, 0.8 + r() * 0.4, 'rgba(60,80,60,0.55)');
  }
  ctx.fillStyle = 'rgba(120,110,80,0.25)';
  ctx.fillRect(0, h - 40, w, 40);
  for (const s of STATIONS) landmark(ctx, s.id, s.x, water);
  // the scroll's mounting: silk borders top and bottom
  ctx.fillStyle = '#8a6a48';
  ctx.fillRect(0, 0, w, 14);
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillStyle = '#c8a870';
  ctx.fillRect(0, 14, w, 3);
  ctx.fillRect(0, h - 17, w, 3);
  // the painting's own title at the start, and an inscription
  ctx.fillStyle = 'rgba(40,36,32,0.9)';
  ctx.font = `46px ${FONT_SERIF}`;
  ctx.textAlign = 'center';
  ['西', '湖', '十', '景', '图'].forEach((c, i) => ctx.fillText(c, 70, 110 + i * 56));
}

export function generatePanorama(scene: Phaser.Scene): void {
  if (scene.textures.exists('tenPanorama')) return;
  const tex = scene.textures.createCanvas('tenPanorama', PANO.w, PANO.h);
  if (!tex) return;
  paintPanorama(tex.getContext());
  tex.refresh();
}

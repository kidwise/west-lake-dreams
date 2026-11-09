/**
 * Painted bedroom furniture shared by the waking-up scenes: a wooden bed with a
 * patterned quilt, a nightstand with an alarm clock and a lamp, and curtains.
 */
import type * as Phaser from 'phaser';

type Ctx = CanvasRenderingContext2D;
const INK = '#3a2a22';

function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function inked(ctx: Ctx, fill: string | CanvasGradient, w = 2): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function wood(ctx: Ctx, x: number, y: number, w: number, h: number, base: string, dark: string): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  inked(ctx, lin(ctx, x, y, x, y + h, [[0, base], [1, dark]]));
  ctx.strokeStyle = 'rgba(40,20,10,0.25)';
  ctx.lineWidth = 1;
  for (let k = 1; k < 5; k++) {
    ctx.beginPath();
    ctx.moveTo(x + 6, y + (h * k) / 5);
    ctx.bezierCurveTo(x + w * 0.3, y + (h * k) / 5 - 3, x + w * 0.7, y + (h * k) / 5 + 3, x + w - 6, y + (h * k) / 5);
    ctx.stroke();
  }
}

export interface QuiltStyle {
  quilt: [string, string];
  motif: string;
  pillow: string;
}

/** A single bed seen from the side, headboard on the left. Canvas 600×280, the floor at y=270. */
function paintBed(ctx: Ctx, st: QuiltStyle): void {
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(300, 272, 300, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // headboard and footboard
  wood(ctx, 8, 40, 36, 230, '#8a5a3a', '#5a3a24');
  wood(ctx, 556, 130, 30, 140, '#8a5a3a', '#5a3a24');
  ctx.fillStyle = '#c8945a';
  ctx.beginPath();
  ctx.arc(26, 40, 10, 0, Math.PI * 2);
  ctx.arc(571, 130, 9, 0, Math.PI * 2);
  ctx.fill();
  // frame
  wood(ctx, 30, 190, 540, 50, '#9a6a44', '#6a4428');
  for (const x of [40, 548]) {
    ctx.beginPath();
    ctx.rect(x, 236, 14, 34);
    inked(ctx, '#5a3a24');
  }
  // mattress edge
  ctx.beginPath();
  ctx.roundRect(40, 168, 520, 30, 10);
  inked(ctx, lin(ctx, 0, 168, 0, 198, [[0, '#ffffff'], [1, '#dcd6cc']]));
  // pillow
  ctx.beginPath();
  ctx.moveTo(50, 150);
  ctx.bezierCurveTo(46, 104, 90, 98, 140, 104);
  ctx.bezierCurveTo(200, 108, 206, 160, 190, 170);
  ctx.bezierCurveTo(140, 178, 80, 176, 50, 150);
  ctx.closePath();
  inked(ctx, lin(ctx, 60, 100, 160, 180, [[0, '#ffffff'], [1, st.pillow]]));
  ctx.strokeStyle = 'rgba(120,110,100,0.4)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(90, 130);
  ctx.quadraticCurveTo(120, 140, 160, 132);
  ctx.stroke();
  // the quilt: puffed up over a sleeping shape, with folds and a pattern
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(150, 186);
  ctx.bezierCurveTo(150, 120, 230, 112, 300, 126);
  ctx.bezierCurveTo(380, 140, 420, 116, 480, 128);
  ctx.bezierCurveTo(560, 140, 574, 180, 572, 214);
  ctx.lineTo(150, 214);
  ctx.closePath();
  inked(ctx, lin(ctx, 0, 116, 0, 214, [[0, st.quilt[0]], [1, st.quilt[1]]]), 2.2);
  ctx.clip();
  // a printed flower pattern
  for (let y = 132; y < 214; y += 26) {
    for (let x = 166 + ((y / 26) % 2) * 20; x < 570; x += 40) {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        ctx.fillStyle = st.motif;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 4.2, y + Math.sin(a) * 4.2, 3.4, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f8d050';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // folds and shading
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 3;
  for (const [x0, x1] of [[250, 270], [360, 340], [470, 500]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 130);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 10, 170, x1, 212);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(300, 136, 110, 14, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // the turned-down white sheet at the top
  ctx.beginPath();
  ctx.moveTo(150, 186);
  ctx.bezierCurveTo(150, 140, 180, 124, 214, 120);
  ctx.lineTo(230, 128);
  ctx.bezierCurveTo(196, 136, 172, 160, 170, 196);
  ctx.closePath();
  inked(ctx, '#fbf8f0', 1.6);
  // the quilt hanging over the side
  ctx.beginPath();
  ctx.moveTo(150, 212);
  ctx.lineTo(572, 212);
  ctx.lineTo(566, 238);
  ctx.quadraticCurveTo(360, 246, 156, 238);
  ctx.closePath();
  inked(ctx, st.quilt[1], 2);
}

/** A bedside table with a drawer, an alarm clock and a little lamp. Canvas 180×220, floor at y=214. */
function paintNightstand(ctx: Ctx): void {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(90, 214, 80, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  wood(ctx, 20, 110, 140, 104, '#9a6a44', '#6a4428');
  ctx.beginPath();
  ctx.rect(32, 124, 116, 34);
  inked(ctx, 'rgba(255,255,255,0.08)', 1.4);
  ctx.fillStyle = '#d8b070';
  ctx.beginPath();
  ctx.arc(90, 141, 4, 0, Math.PI * 2);
  ctx.fill();
  // the lamp
  ctx.beginPath();
  ctx.rect(124, 72, 6, 40);
  inked(ctx, '#c8a060', 1.2);
  ctx.beginPath();
  ctx.moveTo(108, 72);
  ctx.lineTo(146, 72);
  ctx.lineTo(138, 40);
  ctx.lineTo(116, 40);
  ctx.closePath();
  inked(ctx, lin(ctx, 108, 0, 146, 0, [[0, '#f0d8a0'], [1, '#fff4d8']]), 1.6);
  ctx.beginPath();
  ctx.ellipse(127, 112, 16, 4, 0, 0, Math.PI * 2);
  inked(ctx, '#a07840', 1.2);
  // the alarm clock: red, two bells, a white face
  for (const x of [44, 72]) {
    ctx.beginPath();
    ctx.arc(x, 66, 9, Math.PI, 0);
    inked(ctx, '#d8402e', 1.4);
  }
  ctx.beginPath();
  ctx.arc(58, 86, 24, 0, Math.PI * 2);
  inked(ctx, lin(ctx, 34, 62, 82, 110, [[0, '#f06a50'], [1, '#b02a1e']]), 2);
  ctx.beginPath();
  ctx.arc(58, 86, 18, 0, Math.PI * 2);
  inked(ctx, '#fffaf0', 1.4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(58, 86);
  ctx.lineTo(58, 73);
  ctx.moveTo(58, 86);
  ctx.lineTo(67, 92);
  ctx.stroke();
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(58 + Math.cos(a) * 14.5, 86 + Math.sin(a) * 14.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const x of [42, 74]) {
    ctx.beginPath();
    ctx.rect(x - 2, 108, 4, 4);
    inked(ctx, '#3a2a22', 1);
  }
}

/** A gathered curtain with folds, a tie-back and a lace hem. Canvas 90×340. */
function paintCurtain(ctx: Ctx, base: string, dark: string): void {
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(86, 0);
  ctx.quadraticCurveTo(70, 160, 56, 210);
  ctx.quadraticCurveTo(80, 270, 86, 336);
  ctx.lineTo(4, 336);
  ctx.quadraticCurveTo(10, 270, 30, 210);
  ctx.quadraticCurveTo(12, 160, 4, 0);
  ctx.closePath();
  inked(ctx, lin(ctx, 0, 0, 90, 0, [[0, dark], [0.35, base], [0.6, dark], [0.85, base], [1, dark]]), 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  for (const x of [22, 44, 66]) {
    ctx.beginPath();
    ctx.moveTo(x, 4);
    ctx.quadraticCurveTo(x + (44 - x) * 0.5, 160, 44, 210);
    ctx.quadraticCurveTo(44 + (x - 44) * 0.6, 270, x, 334);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(44, 210, 22, 7, 0, 0, Math.PI * 2);
  inked(ctx, '#e8c060', 1.4);
  ctx.fillStyle = '#ffffff';
  for (let x = 8; x < 86; x += 8) {
    ctx.beginPath();
    ctx.arc(x, 334, 3.4, 0, Math.PI);
    ctx.fill();
  }
}

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

export function generateRoomTextures(scene: Phaser.Scene): void {
  canvas(scene, 'roomBedBlue', 600, 280, (ctx) => paintBed(ctx, { quilt: ['#9cc6e4', '#5a8ab4'], motif: 'rgba(255,255,255,0.7)', pillow: '#dce8f0' }));
  canvas(scene, 'roomBedRed', 600, 280, (ctx) => paintBed(ctx, { quilt: ['#ee7a70', '#c03a32'], motif: 'rgba(255,220,220,0.8)', pillow: '#f0dcd8' }));
  canvas(scene, 'roomNightstand', 180, 220, paintNightstand);
  canvas(scene, 'roomCurtainPurple', 90, 340, (ctx) => paintCurtain(ctx, '#a888b8', '#7a5a8e'));
  canvas(scene, 'roomCurtainCream', 90, 340, (ctx) => paintCurtain(ctx, '#f0e4cc', '#d0bfa0'));
}

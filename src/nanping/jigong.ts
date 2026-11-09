/**
 * 济公, painted in detail: a scruffy, cheerful monk in a patched robe and a
 * battered cap, waving a holey palm-leaf fan, a wine gourd in his other hand.
 *
 * Drawn in a 200×280 design space and rendered at 2× (the texture is 400×560;
 * show it at scale 0.5 for "life size"), with ink outlines like a picture book.
 */
type Ctx = CanvasRenderingContext2D;

export const JIGONG_TEX = { w: 400, h: 560, scale: 0.5 };

const INK = '#3a2618';

function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function rad(ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** Fill the current path, then ink its outline. */
function inked(ctx: Ctx, fill: string | CanvasGradient, width = 1.4): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function line(ctx: Ctx, pts: number[], color: string, width: number, alpha = 1): void {
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

function dot(ctx: Ctx, x: number, y: number, r: number, fill: string | CanvasGradient): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A rough patch of cloth with running stitches round the edge. */
function patch(ctx: Ctx, pts: number[], fill: string, stitch: string): void {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,24,14,0.55)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([1.6, 1.8]);
  ctx.strokeStyle = stitch;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  // stitches just inside the edge
  const cx = pts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / (pts.length / 2);
  const cy = pts.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) / (pts.length / 2);
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i] + (cx - pts[i]) * 0.14;
    const y = pts[i + 1] + (cy - pts[i + 1]) * 0.14;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function paintJigong(ctx: Ctx): void {
  ctx.save();
  ctx.scale(2, 2);
  ctx.translate(0, 7);

  // ---- soft shadow on the ground ----
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(100, 268, 48, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- legs: skinny, bare shins, trousers rolled up, straw sandals ----
  for (const [x0, x1, flip] of [[86, 80, -1], [112, 120, 1]] as const) {
    ctx.beginPath();
    ctx.moveTo(x0 - 5, 228);
    ctx.quadraticCurveTo(x1 - 6, 248, x1 - 5, 262);
    ctx.lineTo(x1 + 5, 262);
    ctx.quadraticCurveTo(x1 + 5, 246, x0 + 5, 228);
    ctx.closePath();
    inked(ctx, lin(ctx, x1 - 6, 0, x1 + 6, 0, [[0, '#d89a70'], [0.5, '#f2c49a'], [1, '#d89a70']]), 1.2);
    // ankle bone and a bit of leg hair
    line(ctx, [x1 + flip * 2, 254, x1 + flip * 4, 256, x1 + flip * 3, 258], 'rgba(140,80,50,0.6)', 0.8);
    // straw sandal
    ctx.beginPath();
    ctx.ellipse(x1 + flip * 3, 266, 13, 4.2, 0, 0, Math.PI * 2);
    inked(ctx, lin(ctx, 0, 262, 0, 270, [[0, '#e2c27a'], [1, '#a8823e']]), 1.1);
    ctx.strokeStyle = 'rgba(110,80,30,0.7)';
    ctx.lineWidth = 0.7;
    for (let k = -10; k <= 10; k += 3) {
      ctx.beginPath();
      ctx.moveTo(x1 + flip * 3 + k, 263);
      ctx.lineTo(x1 + flip * 3 + k - 1, 269);
      ctx.stroke();
    }
    // toes and the strap
    for (let k = 0; k < 4; k++) dot(ctx, x1 + flip * (10 - k * 2.4), 263.5 - (k % 2) * 0.5, 1.5, '#e8b088');
    line(ctx, [x1 - 4, 260, x1 + flip * 4, 258, x1 + 8, 262], '#7a5428', 1.6);
  }
  // rolled-up trouser cuffs
  for (const x of [86, 112]) {
    ctx.beginPath();
    ctx.ellipse(x, 230, 9, 4, 0, 0, Math.PI * 2);
    inked(ctx, '#6a6658', 1.1);
  }

  // ---- the arm holding the gourd (behind the body) ----
  // ---- the robe: long, loose, with a ragged hem ----
  ctx.beginPath();
  ctx.moveTo(78, 96);
  ctx.quadraticCurveTo(64, 120, 62, 160);
  ctx.quadraticCurveTo(58, 196, 54, 226);
  // ragged, torn hem
  const hem = [54, 226, 60, 232, 64, 225, 70, 234, 76, 227, 82, 235, 89, 228, 96, 236, 103, 229, 110, 237, 117, 229, 124, 236, 131, 228, 138, 234, 144, 225, 148, 230];
  for (let i = 0; i < hem.length; i += 2) ctx.lineTo(hem[i], hem[i + 1]);
  ctx.quadraticCurveTo(144, 196, 138, 160);
  ctx.quadraticCurveTo(134, 120, 122, 96);
  ctx.quadraticCurveTo(100, 88, 78, 96);
  ctx.closePath();
  inked(ctx, lin(ctx, 56, 0, 148, 0, [[0, '#6a5e4a'], [0.45, '#958668'], [0.75, '#a8987a'], [1, '#7a6c54']]), 1.6);

  // folds in the robe
  ctx.save();
  ctx.clip();
  line(ctx, [84, 140, 78, 186, 74, 230], 'rgba(50,36,22,0.35)', 2.2);
  line(ctx, [100, 150, 102, 190, 98, 234], 'rgba(50,36,22,0.28)', 2);
  line(ctx, [118, 142, 124, 186, 128, 232], 'rgba(50,36,22,0.3)', 2.2);
  line(ctx, [92, 150, 94, 190, 90, 230], 'rgba(255,240,210,0.18)', 2.4);
  line(ctx, [126, 150, 132, 190, 138, 226], 'rgba(255,240,210,0.22)', 2.4);
  // a darker, worn band near the hem
  ctx.fillStyle = 'rgba(60,40,24,0.18)';
  ctx.fillRect(50, 214, 100, 30);
  ctx.restore();

  // patches, each a different scrap of cloth
  patch(ctx, [66, 168, 82, 165, 84, 182, 68, 185], '#5a6a86', 'rgba(230,220,190,0.9)');
  patch(ctx, [112, 190, 130, 188, 132, 206, 114, 208], '#9a5a3a', 'rgba(240,220,180,0.9)');
  patch(ctx, [96, 120, 108, 118, 110, 130, 98, 132], '#b89a52', 'rgba(90,60,30,0.9)');
  patch(ctx, [74, 206, 86, 204, 87, 216, 75, 218], '#7a8a5a', 'rgba(230,220,190,0.9)');
  // a frayed hole with threads
  ctx.beginPath();
  ctx.ellipse(126, 156, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();
  line(ctx, [123, 159, 121, 163, 122, 166], 'rgba(150,130,100,0.9)', 0.7);
  line(ctx, [129, 158, 131, 162, 130, 165], 'rgba(150,130,100,0.9)', 0.7);

  // the crossed collar (交领) of the under-robe
  ctx.beginPath();
  ctx.moveTo(84, 94);
  ctx.lineTo(102, 128);
  ctx.lineTo(116, 94);
  ctx.lineTo(110, 92);
  ctx.lineTo(102, 116);
  ctx.lineTo(90, 92);
  ctx.closePath();
  inked(ctx, lin(ctx, 0, 92, 0, 128, [[0, '#e8dcc0'], [1, '#c8b896']]), 1.1);

  // the rope sash, knotted, ends dangling
  ctx.beginPath();
  ctx.moveTo(62, 146);
  ctx.quadraticCurveTo(100, 156, 138, 144);
  ctx.lineTo(138, 151);
  ctx.quadraticCurveTo(100, 163, 62, 153);
  ctx.closePath();
  inked(ctx, lin(ctx, 0, 144, 0, 160, [[0, '#d8b870'], [1, '#9a7838']]), 1.1);
  ctx.strokeStyle = 'rgba(100,70,30,0.6)';
  ctx.lineWidth = 0.7;
  for (let x = 66; x < 136; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 148 + Math.sin((x - 62) / 76 * Math.PI) * 5);
    ctx.lineTo(x + 3, 153 + Math.sin((x - 62) / 76 * Math.PI) * 5);
    ctx.stroke();
  }
  dot(ctx, 116, 156, 4.2, '#b8924a');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(116, 156, 4.2, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, [114, 159, 112, 172, 116, 184], '#b8924a', 3);
  line(ctx, [118, 159, 122, 170, 120, 180], '#a8823e', 3);
  line(ctx, [114, 159, 112, 172, 116, 184], INK, 0.6, 0.6);

  // ---- big wooden prayer beads round the neck ----
  for (let k = 0; k < 17; k++) {
    const a = Math.PI * 0.08 + (k / 16) * Math.PI * 0.84;
    const x = 101 + Math.cos(a) * 26;
    const y = 96 + Math.sin(a) * 22;
    const big = k === 8;
    dot(ctx, x, y, big ? 4.6 : 3.4, rad(ctx, x - 1, y - 1, 0.3, big ? 5 : 3.6, big ? [[0, '#ffe8a0'], [1, '#c08a2a']] : [[0, '#a8683a'], [1, '#4a2210']]));
    dot(ctx, x - 1, y - 1.2, 0.8, 'rgba(255,240,220,0.7)');
  }
  // the tassel
  line(ctx, [101, 122, 100, 130, 102, 138], '#c0281e', 2.2);

  // ---- the arm holding the gourd, across the front ----
  ctx.beginPath();
  ctx.moveTo(80, 98);
  ctx.quadraticCurveTo(58, 112, 56, 138);
  ctx.quadraticCurveTo(54, 152, 62, 160);
  ctx.lineTo(80, 156);
  ctx.quadraticCurveTo(74, 142, 78, 128);
  ctx.quadraticCurveTo(84, 116, 92, 110);
  ctx.closePath();
  inked(ctx, lin(ctx, 54, 0, 92, 0, [[0, '#6a5e4a'], [1, '#958668']]), 1.4);
  // ragged sleeve end
  line(ctx, [60, 158, 66, 162, 72, 158], INK, 1.1);
  line(ctx, [72, 158, 76, 162, 80, 156], INK, 1.1);
  // hand round the gourd's neck
  ctx.beginPath();
  ctx.ellipse(72, 164, 7, 6, 0.3, 0, Math.PI * 2);
  inked(ctx, lin(ctx, 64, 0, 80, 0, [[0, '#e0a47a'], [1, '#f6caa0']]), 1.1);

  // ---- the wine gourd ----
  const gx = 70;
  const gy = 186;
  ctx.beginPath();
  ctx.ellipse(gx, gy + 14, 15, 17, 0, 0, Math.PI * 2);
  inked(ctx, rad(ctx, gx - 5, gy + 6, 2, 20, [[0, '#ffe2a0'], [0.5, '#e0a040'], [1, '#9a5a18']]), 1.3);
  ctx.beginPath();
  ctx.ellipse(gx, gy - 6, 9, 10, 0, 0, Math.PI * 2);
  inked(ctx, rad(ctx, gx - 3, gy - 10, 1, 12, [[0, '#ffe2a0'], [0.6, '#e0a040'], [1, '#a8661e']]), 1.3);
  // red cord round the waist of the gourd, with a tassel
  ctx.beginPath();
  ctx.ellipse(gx, gy + 3, 7.5, 2.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c0281e';
  ctx.fill();
  line(ctx, [gx + 6, gy + 4, gx + 12, gy + 10, gx + 10, gy + 18], '#c0281e', 1.6);
  dot(ctx, gx + 10, gy + 20, 2.2, '#e04a2e');
  // stopper
  ctx.beginPath();
  ctx.rect(gx - 3.5, gy - 19, 7, 6);
  inked(ctx, '#7a4a22', 1);
  // shine
  ctx.fillStyle = 'rgba(255,255,240,0.55)';
  ctx.beginPath();
  ctx.ellipse(gx - 6, gy + 8, 2.4, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  dot(ctx, gx - 3, gy - 9, 1.6, 'rgba(255,255,240,0.6)');

  // ---- the fan arm, raised ----
  ctx.beginPath();
  ctx.moveTo(118, 98);
  ctx.quadraticCurveTo(140, 96, 150, 78);
  ctx.quadraticCurveTo(156, 68, 156, 60);
  ctx.lineTo(166, 64);
  ctx.quadraticCurveTo(166, 76, 160, 88);
  ctx.quadraticCurveTo(148, 110, 124, 116);
  ctx.closePath();
  inked(ctx, lin(ctx, 118, 0, 166, 0, [[0, '#958668'], [1, '#b0a080']]), 1.4);
  // wide sleeve falling back from the raised arm, ragged
  ctx.beginPath();
  ctx.moveTo(150, 80);
  ctx.quadraticCurveTo(170, 92, 172, 112);
  ctx.lineTo(166, 108);
  ctx.lineTo(163, 116);
  ctx.lineTo(158, 109);
  ctx.lineTo(152, 116);
  ctx.quadraticCurveTo(150, 100, 140, 96);
  ctx.closePath();
  inked(ctx, lin(ctx, 140, 80, 172, 116, [[0, '#a8987a'], [1, '#7a6c54']]), 1.2);
  // bony wrist and hand on the fan's handle
  ctx.beginPath();
  ctx.ellipse(161, 58, 6, 6.5, 0.2, 0, Math.PI * 2);
  inked(ctx, lin(ctx, 154, 0, 168, 0, [[0, '#e0a47a'], [1, '#f6caa0']]), 1.1);
  line(ctx, [157, 56, 160, 54, 164, 55], 'rgba(120,70,40,0.7)', 0.8);

  // ---- the holey palm-leaf fan (破蒲扇) ----
  ctx.save();
  ctx.translate(166, 40);
  ctx.rotate(0.35);
  // the leaf: broad, rounded, a little frayed
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.bezierCurveTo(-26, 4, -28, -30, -6, -38);
  ctx.bezierCurveTo(4, -42, 10, -40, 14, -36);
  ctx.bezierCurveTo(30, -26, 26, 4, 0, 14);
  ctx.closePath();
  inked(ctx, rad(ctx, -2, -14, 2, 34, [[0, '#f4e2a8'], [0.7, '#d8bc72'], [1, '#b0904a']]), 1.3);
  ctx.save();
  ctx.clip();
  // ribs radiating from the handle
  ctx.strokeStyle = 'rgba(140,100,40,0.6)';
  ctx.lineWidth = 0.7;
  for (let k = -6; k <= 6; k++) {
    const a = -Math.PI / 2 + k * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(Math.cos(a) * 46, 12 + Math.sin(a) * 46);
    ctx.stroke();
  }
  // a woven rim
  ctx.strokeStyle = 'rgba(120,84,30,0.8)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.bezierCurveTo(-26, 4, -28, -30, -6, -38);
  ctx.bezierCurveTo(4, -42, 10, -40, 14, -36);
  ctx.bezierCurveTo(30, -26, 26, 4, 0, 14);
  ctx.stroke();
  ctx.restore();
  // holes, with torn edges
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (const [x, y, rx, ry] of [[-10, -20, 4.5, 3.6], [8, -26, 3, 2.6], [-2, -2, 2.4, 2]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // a bite out of the edge
  ctx.beginPath();
  ctx.arc(17, -18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  for (const [x, y, rx, ry] of [[-10, -20, 4.5, 3.6], [8, -26, 3, 2.6], [-2, -2, 2.4, 2]]) {
    ctx.strokeStyle = 'rgba(90,60,20,0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // the handle, bound with string
  ctx.beginPath();
  ctx.rect(-2.2, 12, 4.4, 18);
  inked(ctx, '#8a5a2a', 1);
  for (let k = 0; k < 4; k++) line(ctx, [-2.4, 14 + k * 2.4, 0, 15 + k * 2.4, 2.4, 14 + k * 2.4], '#d8c8a0', 0.8);
  ctx.restore();

  // ---- the head ----
  // big ears
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(100 + s * 23, 66, 5.5, 8.5, s * 0.2, 0, Math.PI * 2);
    inked(ctx, '#eab088', 1.2);
    line(ctx, [100 + s * 23, 61, 100 + s * 21, 66, 100 + s * 23, 71], 'rgba(150,80,50,0.6)', 0.9);
  }
  // face
  ctx.beginPath();
  ctx.moveTo(78, 56);
  ctx.quadraticCurveTo(78, 34, 100, 33);
  ctx.quadraticCurveTo(122, 34, 122, 56);
  ctx.quadraticCurveTo(122, 80, 112, 86);
  ctx.quadraticCurveTo(100, 92, 88, 86);
  ctx.quadraticCurveTo(78, 80, 78, 56);
  ctx.closePath();
  inked(ctx, rad(ctx, 104, 52, 4, 32, [[0, '#ffe2c4'], [0.7, '#f4c49c'], [1, '#e0a07a']]), 1.5);
  // stubble round the jaw and upper lip
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(90,90,110,0.18)';
  ctx.beginPath();
  ctx.ellipse(100, 82, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(60,50,60,0.4)';
  for (let k = 0; k < 70; k++) {
    const a = Math.PI * (0.05 + (k / 70) * 0.9);
    const rr = 14 + ((k * 7) % 9);
    ctx.fillRect(100 + Math.cos(a) * rr * 1.2, 72 + Math.sin(a) * rr * 0.7, 0.7, 0.7);
  }
  ctx.restore();
  // cheeks, flushed with wine
  dot(ctx, 85, 68, 5.5, 'rgba(240,110,100,0.35)');
  dot(ctx, 115, 68, 5.5, 'rgba(240,110,100,0.35)');
  // bushy eyebrows, raised in glee
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(100 + s * 4, 50);
    ctx.quadraticCurveTo(100 + s * 11, 42, 100 + s * 18, 47);
    ctx.quadraticCurveTo(100 + s * 11, 46, 100 + s * 4, 52);
    ctx.closePath();
    ctx.fillStyle = '#2e2420';
    ctx.fill();
  }
  // squeezed-shut laughing eyes, with laugh lines
  for (const s of [-1, 1]) {
    line(ctx, [100 + s * 5, 58, 100 + s * 11, 53, 100 + s * 17, 58], INK, 1.8);
    line(ctx, [100 + s * 18, 59, 100 + s * 21, 59, 100 + s * 22, 61], 'rgba(120,70,40,0.7)', 0.8);
    line(ctx, [100 + s * 18, 61, 100 + s * 20, 63, 100 + s * 21, 65], 'rgba(120,70,40,0.6)', 0.8);
  }
  // a round red nose (he does like his wine)
  dot(ctx, 100, 66, 4.6, rad(ctx, 99, 64.5, 0.5, 5, [[0, '#ff9a8a'], [1, '#d85848']]));
  dot(ctx, 98.6, 64.6, 1.2, 'rgba(255,255,255,0.75)');
  // a huge grin: teeth on top, a gap, a tongue
  ctx.beginPath();
  ctx.moveTo(88, 73);
  ctx.quadraticCurveTo(100, 76, 112, 73);
  ctx.quadraticCurveTo(110, 86, 100, 87);
  ctx.quadraticCurveTo(90, 86, 88, 73);
  ctx.closePath();
  inked(ctx, '#6a1a14', 1.3);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(88, 72, 24, 4.4);
  ctx.fillStyle = '#6a1a14';
  ctx.fillRect(101, 72, 2.2, 4.6);
  dot(ctx, 100, 86, 6, '#e8707a');
  ctx.restore();
  // dimples
  line(ctx, [86, 72, 85, 74, 86, 76], 'rgba(140,70,40,0.7)', 0.9);
  line(ctx, [114, 72, 115, 74, 114, 76], 'rgba(140,70,40,0.7)', 0.9);

  // ---- the battered cap (僧帽), tilted, with a patch and a hole ----
  ctx.save();
  ctx.translate(100, 38);
  ctx.rotate(-0.16);
  ctx.beginPath();
  ctx.moveTo(-25, 6);
  ctx.quadraticCurveTo(-27, -12, -20, -28);
  ctx.quadraticCurveTo(-8, -36, 4, -30);
  ctx.lineTo(10, -40);
  ctx.quadraticCurveTo(20, -30, 22, -22);
  ctx.quadraticCurveTo(27, -8, 25, 6);
  ctx.quadraticCurveTo(0, 12, -25, 6);
  ctx.closePath();
  inked(ctx, lin(ctx, -26, 0, 26, 0, [[0, '#4e4436'], [0.5, '#6e624e'], [1, '#5a4e3e']]), 1.4);
  ctx.save();
  ctx.clip();
  // creases in the soft cloth
  line(ctx, [-16, 2, -14, -14, -10, -26], 'rgba(30,20,10,0.35)', 1.6);
  line(ctx, [8, 2, 10, -12, 14, -24], 'rgba(30,20,10,0.35)', 1.6);
  line(ctx, [-4, 4, -2, -12, 0, -26], 'rgba(255,240,210,0.18)', 2);
  ctx.restore();
  // the folded brim
  ctx.beginPath();
  ctx.moveTo(-27, 2);
  ctx.quadraticCurveTo(0, 9, 27, 2);
  ctx.lineTo(27, 9);
  ctx.quadraticCurveTo(0, 16, -27, 9);
  ctx.closePath();
  inked(ctx, lin(ctx, 0, 2, 0, 14, [[0, '#7a6e58'], [1, '#4a4034']]), 1.2);
  // a red patch sewn on, and a hole showing his bald head
  patch(ctx, [-12, -16, -2, -18, -1, -8, -11, -6], '#b8321e', 'rgba(255,220,180,0.9)');
  ctx.beginPath();
  ctx.ellipse(13, -14, 4, 3.2, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c49a';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.stroke();
  line(ctx, [10, -11, 9, -8, 10, -6], 'rgba(200,180,150,0.9)', 0.7);
  ctx.restore();

  ctx.restore();
}

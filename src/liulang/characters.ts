/**
 * Mum, the black-naped oriole, and the kites — painted at 2× in picture-book
 * style with ink outlines (show the textures at scale 0.5).
 */
import { type Ctx, INK, lin, rad, ell, inked, curve, blob } from './paint';

// ---- Mum --------------------------------------------------------------------------------------------

export const MOM_TEX = { w: 400, h: 620 };

/**
 * Mum in early spring, the way I remember her: a soft permed bob with a pink
 * clip, a pink cardigan over a white blouse with a round collar, a navy skirt,
 * a canvas tote with an embroidered flower. `kite` raises her arms with a spool.
 */
export function paintMom(ctx: Ctx, pose: 'stand' | 'kite'): void {
  ctx.save();
  ctx.scale(2, 2);
  ctx.translate(0, 6);
  // shadow
  ell(ctx, 100, 296, 46, 6, 'rgba(0,0,0,0.2)');
  // legs in pale stockings, flat red shoes
  for (const [x, dx] of [[90, -2], [110, 3]] as const) {
    ctx.beginPath();
    ctx.moveTo(x - 6, 248);
    ctx.quadraticCurveTo(x - 6 + dx, 270, x - 4 + dx, 288);
    ctx.lineTo(x + 5 + dx, 288);
    ctx.quadraticCurveTo(x + 6 + dx, 268, x + 6, 248);
    ctx.closePath();
    inked(ctx, lin(ctx, x - 6, 0, x + 6, 0, [[0, '#e0bfa6'], [0.5, '#f6dcc6'], [1, '#e0bfa6']]), 1.2);
    ctx.beginPath();
    ctx.ellipse(x + 2 + dx * 1.6, 291, 10, 4.2, 0, 0, Math.PI * 2);
    inked(ctx, lin(ctx, 0, 286, 0, 295, [[0, '#c8463a'], [1, '#8a2a22']]), 1.2);
    ell(ctx, x - 1 + dx * 1.6, 289.5, 3, 1, 'rgba(255,220,210,0.6)');
  }
  // the navy A-line skirt
  ctx.beginPath();
  ctx.moveTo(78, 160);
  ctx.quadraticCurveTo(70, 210, 62, 252);
  ctx.quadraticCurveTo(100, 260, 138, 252);
  ctx.quadraticCurveTo(130, 210, 122, 160);
  ctx.closePath();
  inked(ctx, lin(ctx, 62, 0, 138, 0, [[0, '#2a3456'], [0.55, '#3e4c78'], [1, '#2e3a60']]), 1.5);
  ctx.save();
  ctx.clip();
  for (const [x0, x1, c] of [[88, 80, 'rgba(10,14,30,0.35)'], [100, 101, 'rgba(10,14,30,0.3)'], [112, 122, 'rgba(10,14,30,0.35)'], [94, 92, 'rgba(160,180,230,0.2)'], [118, 130, 'rgba(160,180,230,0.22)']] as const) {
    curve(ctx, [x0, 170, (x0 + x1) / 2, 210, x1, 256], c, 2.2);
  }
  ctx.restore();

  // the tote bag on her left shoulder, hanging at her hip
  const bag = () => {
    curve(ctx, [80, 98, 66, 130, 70, 168], '#c8b48a', 3.2);
    curve(ctx, [80, 98, 66, 130, 70, 168], INK, 0.6, 0.5);
    ctx.beginPath();
    ctx.moveTo(56, 166);
    ctx.lineTo(86, 164);
    ctx.lineTo(90, 206);
    ctx.quadraticCurveTo(72, 212, 54, 206);
    ctx.closePath();
    inked(ctx, lin(ctx, 54, 160, 90, 210, [[0, '#ecdcb8'], [1, '#c8b48a']]), 1.3);
    // an embroidered red flower with green leaves
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      ell(ctx, 72 + Math.cos(a) * 4.5, 186 + Math.sin(a) * 4.5, 3.4, 3.4, '#d84a4a');
    }
    ell(ctx, 72, 186, 2.2, 2.2, '#f8d050');
    ell(ctx, 64, 194, 4, 1.6, '#5a9a4a', 0.6);
    ell(ctx, 80, 195, 4, 1.6, '#5a9a4a', -0.6);
    ctx.save();
    ctx.setLineDash([1.6, 1.6]);
    ctx.strokeStyle = 'rgba(120,90,50,0.7)';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(58, 169, 29, 34);
    ctx.restore();
  };

  // the torso: a pink cardigan over a white blouse
  ctx.beginPath();
  ctx.moveTo(82, 92);
  ctx.quadraticCurveTo(70, 100, 72, 128);
  ctx.quadraticCurveTo(74, 150, 78, 164);
  ctx.quadraticCurveTo(100, 170, 122, 164);
  ctx.quadraticCurveTo(128, 150, 128, 128);
  ctx.quadraticCurveTo(130, 100, 118, 92);
  ctx.quadraticCurveTo(100, 86, 82, 92);
  ctx.closePath();
  inked(ctx, lin(ctx, 70, 0, 130, 0, [[0, '#e8a8a8'], [0.5, '#f6c4c0'], [1, '#e2a0a0']]), 1.5);
  // the blouse showing down the middle, and buttons on the cardigan edge
  ctx.beginPath();
  ctx.moveTo(94, 94);
  ctx.lineTo(106, 94);
  ctx.lineTo(108, 164);
  ctx.lineTo(96, 166);
  ctx.closePath();
  inked(ctx, lin(ctx, 0, 94, 0, 166, [[0, '#ffffff'], [1, '#e8e6ee']]), 1.1);
  for (let k = 0; k < 4; k++) {
    ell(ctx, 110, 112 + k * 13, 1.8, 1.8, '#fff4e8');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(110, 112 + k * 13, 1.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  // knitted texture
  ctx.save();
  ctx.strokeStyle = 'rgba(180,110,110,0.35)';
  ctx.lineWidth = 0.6;
  for (let y = 100; y < 162; y += 4) {
    ctx.beginPath();
    ctx.moveTo(76, y);
    ctx.lineTo(92, y + 1);
    ctx.moveTo(112, y + 1);
    ctx.lineTo(126, y);
    ctx.stroke();
  }
  ctx.restore();
  // the round "Peter Pan" collar
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(100, 92);
    ctx.quadraticCurveTo(100 + s * 14, 90, 100 + s * 15, 100);
    ctx.quadraticCurveTo(100 + s * 8, 104, 100, 98);
    ctx.closePath();
    inked(ctx, '#ffffff', 1.1);
  }

  if (pose === 'stand') {
    bag();
    // left arm down by the bag strap
    ctx.beginPath();
    ctx.moveTo(80, 98);
    ctx.quadraticCurveTo(68, 118, 70, 150);
    ctx.lineTo(80, 150);
    ctx.quadraticCurveTo(80, 124, 88, 108);
    ctx.closePath();
    inked(ctx, lin(ctx, 68, 0, 88, 0, [[0, '#e2a0a0'], [1, '#f2bcb8']]), 1.3);
    ell(ctx, 75, 154, 5.4, 5.8, '#f4d0b8');
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(75, 154, 5.4, 5.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    // right arm bent, an open hand as if pointing something out
    ctx.beginPath();
    ctx.moveTo(120, 98);
    ctx.quadraticCurveTo(134, 112, 132, 132);
    ctx.quadraticCurveTo(140, 134, 150, 124);
    ctx.lineTo(154, 132);
    ctx.quadraticCurveTo(140, 146, 124, 140);
    ctx.quadraticCurveTo(118, 124, 114, 110);
    ctx.closePath();
    inked(ctx, lin(ctx, 114, 0, 154, 0, [[0, '#e8a8a8'], [1, '#f6c4c0']]), 1.3);
    ctx.beginPath();
    ctx.moveTo(150, 122);
    ctx.quadraticCurveTo(160, 114, 166, 116);
    ctx.quadraticCurveTo(164, 120, 160, 122);
    ctx.lineTo(166, 122);
    ctx.quadraticCurveTo(162, 130, 154, 132);
    ctx.closePath();
    inked(ctx, '#f4d0b8', 1.1);
  } else {
    bag();
    // both arms raised in front, holding a wooden spool with the kite line
    for (const [sx, ex] of [[82, 134], [118, 146]] as const) {
      ctx.beginPath();
      ctx.moveTo(sx, 100);
      ctx.quadraticCurveTo(sx + (ex - sx) * 0.4, 84, ex - 6, 70);
      ctx.lineTo(ex + 4, 76);
      ctx.quadraticCurveTo(sx + (ex - sx) * 0.5, 100, sx + 6, 112);
      ctx.closePath();
      inked(ctx, lin(ctx, sx, 0, ex, 0, [[0, '#e2a0a0'], [1, '#f6c4c0']]), 1.3);
    }
    // the spool
    ctx.beginPath();
    ctx.ellipse(142, 66, 12, 7, -0.4, 0, Math.PI * 2);
    inked(ctx, lin(ctx, 130, 0, 154, 0, [[0, '#a8743a'], [1, '#e0b070']]), 1.2);
    ctx.beginPath();
    ctx.ellipse(142, 66, 6, 3.4, -0.4, 0, Math.PI * 2);
    inked(ctx, '#f4f0e0', 0.9);
    ell(ctx, 138, 70, 5, 5, '#f4d0b8');
    ell(ctx, 148, 62, 5, 5, '#f4d0b8');
  }

  // neck
  ctx.beginPath();
  ctx.rect(95, 76, 12, 16);
  inked(ctx, '#f0c8ae', 1.1);
  // hair behind the head: a soft permed bob
  blob(ctx, [74, 52, 76, 30, 92, 18, 112, 18, 128, 30, 132, 52, 134, 74, 128, 92, 118, 90, 110, 70, 92, 70, 84, 90, 72, 92, 68, 72]);
  inked(ctx, rad(ctx, 102, 40, 4, 60, [[0, '#6a4434'], [0.6, '#4a2c22'], [1, '#2e1a14']]), 1.5);
  // the face (three-quarter view, looking right)
  ctx.beginPath();
  ctx.moveTo(84, 52);
  ctx.quadraticCurveTo(84, 30, 104, 30);
  ctx.quadraticCurveTo(124, 31, 124, 52);
  ctx.quadraticCurveTo(124, 72, 112, 80);
  ctx.quadraticCurveTo(104, 84, 96, 80);
  ctx.quadraticCurveTo(84, 72, 84, 52);
  ctx.closePath();
  inked(ctx, rad(ctx, 108, 50, 3, 30, [[0, '#ffeee0'], [0.75, '#f8d8c2'], [1, '#ecbea4']]), 1.4);
  // the fringe and waves falling over the forehead and cheeks
  blob(ctx, [82, 50, 84, 28, 100, 20, 120, 24, 128, 40, 122, 38, 114, 32, 106, 40, 98, 34, 90, 44]);
  inked(ctx, rad(ctx, 106, 28, 2, 30, [[0, '#7a5040'], [1, '#3e241a']]), 1.3);
  for (const [x, y] of [[90, 30], [104, 24], [118, 28]]) curve(ctx, [x - 4, y + 2, x, y - 3, x + 5, y + 1], 'rgba(255,220,190,0.35)', 1.2);
  // waves by the cheeks
  curve(ctx, [84, 52, 80, 64, 84, 76], '#3e241a', 4);
  curve(ctx, [125, 50, 130, 62, 126, 74], '#3e241a', 4);
  // a pink hair clip
  ctx.beginPath();
  ctx.ellipse(118, 30, 6, 2.6, -0.5, 0, Math.PI * 2);
  inked(ctx, '#f48aa8', 1);
  // kind eyes looking right, with lashes
  for (const ex of [97, 114]) {
    ctx.beginPath();
    ctx.ellipse(ex, 52, 3.6, 4.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, ex + 1, 52.5, 2.6, 3.2, '#3a2418');
    ell(ctx, ex + 1.8, 51.2, 1, 1, '#ffffff');
    curve(ctx, [ex - 4, 49.5, ex, 46.5, ex + 4.4, 49.5], INK, 1.4);
    curve(ctx, [ex + 3.6, 48.6, ex + 5.4, 47.4, ex + 6, 46.6], INK, 0.9);
    curve(ctx, [ex - 3.6, 44, ex, 42.4, ex + 4, 43.6], '#3e241a', 1.3);
  }
  // nose, a gentle smile, rosy cheeks
  curve(ctx, [107, 56, 109, 62, 106, 64], 'rgba(160,90,60,0.7)', 1);
  curve(ctx, [99, 69, 106, 74, 113, 69], '#b84a4a', 1.5);
  ell(ctx, 93, 62, 4.5, 3, 'rgba(250,140,140,0.35)');
  ell(ctx, 118, 62, 4, 3, 'rgba(250,140,140,0.35)');
  ctx.restore();
}

// ---- the black-naped oriole (黑枕黄鹂) -------------------------------------------------------------

export const ORIOLE_TEX = { w: 200, h: 150 };

/** A black-naped oriole, facing right: golden body, black mask to the nape, black wings edged in yellow. */
export function paintOriole(ctx: Ctx, pose: 'perch' | 'up' | 'down' | 'sing'): void {
  ctx.save();
  ctx.scale(2, 2);
  ctx.translate(4, 8);
  const gold = (x: number, y: number, r: number) => rad(ctx, x - r * 0.3, y - r * 0.4, 1, r * 1.3, [[0, '#fff08a'], [0.55, '#ffd21e'], [1, '#d89a08']]);
  // tail
  ctx.beginPath();
  ctx.moveTo(26, 38);
  ctx.lineTo(4, 50);
  ctx.lineTo(8, 54);
  ctx.lineTo(30, 44);
  ctx.closePath();
  inked(ctx, '#1e1a18', 1.1);
  ctx.beginPath();
  ctx.moveTo(4, 50);
  ctx.lineTo(8, 54);
  ctx.lineTo(10, 51);
  ctx.closePath();
  ctx.fillStyle = '#ffd21e';
  ctx.fill();
  // the far wing when flying
  if (pose === 'up' || pose === 'down') {
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.quadraticCurveTo(30, pose === 'up' ? 2 : 52, 14, pose === 'up' ? -2 : 58);
    ctx.quadraticCurveTo(32, pose === 'up' ? 16 : 44, 52, 32);
    ctx.closePath();
    inked(ctx, '#2a2420', 1.1);
  }
  // body
  ctx.beginPath();
  ctx.ellipse(44, 36, 22, 13.5, -0.18, 0, Math.PI * 2);
  inked(ctx, gold(44, 36, 22), 1.3);
  // breast feathers
  curve(ctx, [50, 44, 56, 46, 60, 42], 'rgba(200,140,0,0.5)', 0.8);
  curve(ctx, [44, 46, 50, 49, 55, 47], 'rgba(200,140,0,0.5)', 0.8);
  // the near wing: black with yellow edges
  ctx.save();
  if (pose === 'up' || pose === 'down') {
    ctx.beginPath();
    ctx.moveTo(38, 32);
    ctx.quadraticCurveTo(30, pose === 'up' ? -4 : 62, 8, pose === 'up' ? -8 : 66);
    ctx.quadraticCurveTo(34, pose === 'up' ? 12 : 50, 56, 34);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.quadraticCurveTo(44, 24, 56, 32);
    ctx.quadraticCurveTo(46, 44, 24, 46);
    ctx.quadraticCurveTo(24, 38, 30, 30);
    ctx.closePath();
  }
  inked(ctx, lin(ctx, 20, 20, 56, 46, [[0, '#2a2420'], [1, '#141010']]), 1.2);
  ctx.clip();
  ctx.strokeStyle = '#ffd21e';
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(26 + k * 6, 46);
    ctx.lineTo(34 + k * 6, 30);
    ctx.stroke();
  }
  ctx.restore();
  // head
  ctx.beginPath();
  ctx.arc(64, 24, 11.5, 0, Math.PI * 2);
  inked(ctx, gold(64, 24, 12), 1.3);
  // the black mask from the beak through the eye, round to the nape
  ctx.beginPath();
  ctx.moveTo(74, 22);
  ctx.quadraticCurveTo(66, 18, 58, 20);
  ctx.quadraticCurveTo(52, 22, 52, 28);
  ctx.quadraticCurveTo(56, 26, 60, 26);
  ctx.quadraticCurveTo(68, 26, 74, 25);
  ctx.closePath();
  ctx.fillStyle = '#141010';
  ctx.fill();
  // eye: deep red with a glint
  ell(ctx, 67, 22.5, 2.4, 2.4, '#8a1a1a');
  ell(ctx, 67.8, 21.8, 0.8, 0.8, '#ffffff');
  // the pink beak, open when singing
  if (pose === 'sing') {
    ctx.beginPath();
    ctx.moveTo(74, 21);
    ctx.lineTo(86, 16);
    ctx.lineTo(75, 24);
    ctx.closePath();
    inked(ctx, '#e8708a', 1);
    ctx.beginPath();
    ctx.moveTo(74, 25);
    ctx.lineTo(85, 29);
    ctx.lineTo(75, 27);
    ctx.closePath();
    inked(ctx, '#d85a78', 1);
  } else {
    ctx.beginPath();
    ctx.moveTo(74, 21);
    ctx.quadraticCurveTo(84, 22, 86, 24.5);
    ctx.quadraticCurveTo(80, 27, 74, 26.5);
    ctx.closePath();
    inked(ctx, lin(ctx, 74, 0, 86, 0, [[0, '#d85a78'], [1, '#f4a0b0']]), 1);
  }
  // feet gripping the branch
  if (pose === 'perch' || pose === 'sing') {
    for (const x of [40, 48]) {
      curve(ctx, [x, 48, x + 1, 52, x - 2, 56], '#6a6a72', 1.6);
      curve(ctx, [x - 2, 56, x + 2, 57, x + 5, 56], '#6a6a72', 1.4);
    }
  }
  ctx.restore();
}

// ---- kites ----------------------------------------------------------------------------------------------

export type KiteKind = 'swallow' | 'butterfly' | 'centipede' | 'cow' | 'rabbit' | 'koi' | 'crab' | 'bell' | 'umbrella' | 'lotus' | 'peach' | 'lantern';
export const KITE_TEX = { w: 320, h: 320 };

/** The bamboo cross-frame showing faintly through the silk. */
function frame(ctx: Ctx): void {
  ctx.strokeStyle = 'rgba(120,80,40,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(80, 20);
  ctx.lineTo(80, 140);
  ctx.moveTo(14, 64);
  ctx.quadraticCurveTo(80, 50, 146, 64);
  ctx.stroke();
}

/** Each kite is painted in a 160×160 design space (rendered at 2×), centred on (80, 80). */
export function paintKite(ctx: Ctx, kind: KiteKind): void {
  ctx.save();
  ctx.scale(2, 2);
  switch (kind) {
    case 'swallow': {
      // 沙燕: a swallow with swept wings, a fat white belly and a forked tail
      ctx.beginPath();
      ctx.moveTo(80, 48);
      ctx.quadraticCurveTo(40, 30, 8, 46);
      ctx.quadraticCurveTo(30, 62, 52, 70);
      ctx.quadraticCurveTo(60, 100, 66, 108);
      ctx.lineTo(56, 150);
      ctx.lineTo(80, 124);
      ctx.lineTo(104, 150);
      ctx.lineTo(94, 108);
      ctx.quadraticCurveTo(100, 100, 108, 70);
      ctx.quadraticCurveTo(130, 62, 152, 46);
      ctx.quadraticCurveTo(120, 30, 80, 48);
      ctx.closePath();
      inked(ctx, '#1e2230', 1.6);
      ell(ctx, 80, 86, 18, 26, lin(ctx, 0, 60, 0, 112, [[0, '#ffffff'], [1, '#e8e4f0']]));
      for (const s of [-1, 1]) {
        // colourful wing patterns
        ell(ctx, 80 + s * 40, 52, 16, 6, '#e84a4a', s * 0.15);
        ell(ctx, 80 + s * 40, 52, 9, 3.4, '#ffd24a', s * 0.15);
        ell(ctx, 80 + s * 58, 50, 7, 3, '#4a8ae8', s * 0.15);
        ell(ctx, 80 + s * 9, 128, 4, 10, '#e84a4a');
      }
      // the head
      ell(ctx, 80, 50, 13, 12, '#1e2230');
      ell(ctx, 74, 48, 3.2, 3.2, '#ffffff');
      ell(ctx, 86, 48, 3.2, 3.2, '#ffffff');
      ell(ctx, 74.5, 48.4, 1.6, 1.6, '#1e2230');
      ell(ctx, 86.5, 48.4, 1.6, 1.6, '#1e2230');
      ell(ctx, 80, 92, 7, 7, '#e84a4a');
      ell(ctx, 80, 92, 3.6, 3.6, '#ffd24a');
      break;
    }
    case 'butterfly': {
      for (const s of [-1, 1]) {
        blob(ctx, [80, 70, 80 + s * 30, 30, 80 + s * 66, 26, 80 + s * 70, 56, 80 + s * 40, 78]);
        inked(ctx, lin(ctx, 80, 30, 80 + s * 70, 70, [[0, '#ffd84a'], [1, '#f07a2a']]), 1.5);
        blob(ctx, [80, 84, 80 + s * 44, 92, 80 + s * 52, 124, 80 + s * 24, 128]);
        inked(ctx, lin(ctx, 80, 84, 80 + s * 50, 126, [[0, '#f8a0c0'], [1, '#c84a8a']]), 1.5);
        ell(ctx, 80 + s * 46, 46, 9, 9, '#ffffff');
        ell(ctx, 80 + s * 46, 46, 5, 5, '#3a6ac8');
        ell(ctx, 80 + s * 34, 108, 6, 6, '#ffffff');
      }
      ell(ctx, 80, 84, 6, 34, '#2a2030');
      curve(ctx, [78, 52, 72, 36, 66, 30], '#2a2030', 1.6);
      curve(ctx, [82, 52, 88, 36, 94, 30], '#2a2030', 1.6);
      break;
    }
    case 'centipede': {
      // the head of a dragon-centipede kite (its body segments trail behind in the scene)
      ell(ctx, 80, 80, 34, 34, rad(ctx, 72, 70, 4, 38, [[0, '#ffe08a'], [1, '#e0602a']]));
      ctx.beginPath();
      ctx.arc(80, 80, 34, 0, Math.PI * 2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      for (const s of [-1, 1]) {
        ell(ctx, 80 + s * 13, 72, 9, 10, '#ffffff');
        ell(ctx, 80 + s * 13, 73, 5, 6, '#1e1a20');
        curve(ctx, [80 + s * 10, 48, 80 + s * 30, 20, 80 + s * 44, 24], '#c03a2a', 2.4);
      }
      curve(ctx, [64, 94, 80, 104, 96, 94], '#8a1a14', 2.4);
      break;
    }
    case 'cow': {
      // 牛奶奶, as a kite: a round cloud-cow face with horns and spectacles
      for (const [x, y, r] of [[48, 92, 24], [112, 92, 24], [80, 106, 26], [80, 76, 38]]) ell(ctx, x, y, r, r * 0.9, '#ffffff');
      ctx.beginPath();
      ctx.ellipse(80, 82, 46, 40, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(58,42,34,0.6)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ell(ctx, 104, 66, 12, 8, 'rgba(160,178,204,0.7)', 0.4);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(80 + s * 22, 48);
        ctx.quadraticCurveTo(80 + s * 34, 22, 80 + s * 28, 16);
        ctx.quadraticCurveTo(80 + s * 22, 30, 80 + s * 14, 46);
        ctx.closePath();
        inked(ctx, '#f3e3b8', 1.2);
        ctx.strokeStyle = '#8a6a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(80 + s * 13, 74, 9, 0, Math.PI * 2);
        ctx.stroke();
        curve(ctx, [80 + s * 9, 75, 80 + s * 13, 71, 80 + s * 17, 75], '#3a3a48', 1.8);
      }
      ell(ctx, 80, 98, 18, 12, '#f7c6cf');
      ell(ctx, 73, 97, 2.6, 3.6, '#c98a96');
      ell(ctx, 87, 97, 2.6, 3.6, '#c98a96');
      break;
    }
    case 'rabbit': {
      // the Jade Rabbit against a full moon
      ell(ctx, 80, 84, 56, 56, rad(ctx, 70, 72, 6, 60, [[0, '#fffbe8'], [0.8, '#fbe8b0'], [1, '#efd090']]));
      ctx.beginPath();
      ctx.arc(80, 84, 56, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(140,110,50,0.6)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ell(ctx, 74, 96, 22, 16, '#ffffff');
      ell(ctx, 94, 82, 12, 11, '#ffffff');
      ell(ctx, 90, 62, 4, 14, '#ffffff', -0.2);
      ell(ctx, 98, 62, 4, 14, '#ffffff', 0.15);
      ell(ctx, 90, 62, 1.6, 10, '#f7c6d6', -0.2);
      ell(ctx, 98, 62, 1.6, 10, '#f7c6d6', 0.15);
      ell(ctx, 99, 80, 1.8, 1.8, '#e8506a');
      ell(ctx, 56, 98, 6, 6, '#ffffff');
      break;
    }
    case 'koi': {
      // a red-and-white koi, curving
      ctx.beginPath();
      ctx.moveTo(30, 80);
      ctx.quadraticCurveTo(60, 40, 112, 60);
      ctx.quadraticCurveTo(140, 74, 150, 50);
      ctx.lineTo(152, 100);
      ctx.quadraticCurveTo(140, 88, 112, 100);
      ctx.quadraticCurveTo(60, 120, 30, 80);
      ctx.closePath();
      inked(ctx, lin(ctx, 30, 60, 30, 110, [[0, '#ffffff'], [1, '#ece6e0']]), 1.6);
      ell(ctx, 66, 70, 18, 12, '#e8442a', -0.2);
      ell(ctx, 104, 86, 14, 10, '#e8442a', 0.1);
      ell(ctx, 42, 78, 4, 4, '#1e1a20');
      ell(ctx, 43, 77, 1.4, 1.4, '#ffffff');
      for (let k = 0; k < 6; k++) curve(ctx, [60 + k * 10, 66, 64 + k * 10, 80, 60 + k * 10, 94], 'rgba(120,80,60,0.25)', 0.9);
      break;
    }
    case 'crab': {
      // the crab — with a very small monk peeping out
      for (const s of [-1, 1]) {
        for (let k = 0; k < 4; k++) curve(ctx, [80 + s * 30, 84 + k * 8, 80 + s * 50, 76 + k * 10, 80 + s * 64, 92 + k * 10], '#c8402a', 4);
        ell(ctx, 80 + s * 46, 46, 14, 10, '#d8502e', s * 0.5);
        ctx.beginPath();
        ctx.ellipse(80 + s * 46, 46, 14, 10, s * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(80, 90, 40, 30, 0, 0, Math.PI * 2);
      inked(ctx, rad(ctx, 72, 80, 4, 44, [[0, '#ffb05a'], [1, '#c8402a']]), 1.6);
      ell(ctx, 80, 66, 9, 9, '#ffd8b8');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(72, 62, 7, 2);
      ctx.fillRect(81, 62, 7, 2);
      ell(ctx, 76, 67, 1.3, 1.3, '#2a1a14');
      ell(ctx, 84, 67, 1.3, 1.3, '#2a1a14');
      break;
    }
    case 'bell': {
      ctx.beginPath();
      ctx.moveTo(56, 40);
      ctx.quadraticCurveTo(44, 44, 42, 80);
      ctx.lineTo(36, 128);
      ctx.lineTo(124, 128);
      ctx.lineTo(118, 80);
      ctx.quadraticCurveTo(116, 44, 104, 40);
      ctx.closePath();
      inked(ctx, lin(ctx, 36, 0, 124, 0, [[0, '#2a3a30'], [0.4, '#7aa088'], [1, '#2a3a30']]), 1.6);
      for (const y of [58, 88, 118]) {
        ctx.fillStyle = 'rgba(20,30,24,0.5)';
        ctx.fillRect(40, y, 80, 3);
      }
      ell(ctx, 80, 104, 9, 9, '#a8c0a0');
      ctx.strokeStyle = '#3e5a4a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(80, 34, 10, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case 'umbrella': {
      // an oil-paper umbrella seen from above
      for (let k = 0; k < 12; k++) {
        const a0 = (k / 12) * Math.PI * 2;
        const a1 = ((k + 1) / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(80, 80);
        ctx.lineTo(80 + Math.cos(a0) * 62, 80 + Math.sin(a0) * 62);
        ctx.lineTo(80 + Math.cos(a1) * 62, 80 + Math.sin(a1) * 62);
        ctx.closePath();
        ctx.fillStyle = k % 2 ? '#d8eee6' : '#c4e2d6';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(80, 80, 62, 0, Math.PI * 2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      curve(ctx, [40, 70, 60, 60, 74, 74], 'rgba(80,130,100,0.8)', 1.6);
      for (let k = 0; k < 6; k++) ell(ctx, 44 + k * 5, 70 - k * 2, 2, 5, 'rgba(110,170,120,0.85)', -0.6);
      ell(ctx, 80, 80, 6, 6, '#7a5a3a');
      break;
    }
    case 'lotus': {
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + (k / 6) * Math.PI;
        ctx.save();
        ctx.translate(80, 100);
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, -36, 13, 34, 0, 0, Math.PI * 2);
        inked(ctx, lin(ctx, 0, -70, 0, 0, [[0, '#e0628e'], [1, '#fbe3ec']]), 1.3);
        ctx.restore();
      }
      ell(ctx, 80, 104, 46, 12, '#4f8f4a');
      ell(ctx, 80, 96, 12, 8, '#f8d050');
      break;
    }
    case 'peach': {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(80 + Math.cos(a) * 32, 80 + Math.sin(a) * 32, 26, 30, a + Math.PI / 2, 0, Math.PI * 2);
        inked(ctx, rad(ctx, 80, 80, 6, 64, [[0, '#ffffff'], [1, '#f6a0b8']]), 1.4);
      }
      ell(ctx, 80, 80, 12, 12, '#e86a8a');
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        curve(ctx, [80, 80, 80 + Math.cos(a) * 10, 80 + Math.sin(a) * 10, 80 + Math.cos(a) * 18, 80 + Math.sin(a) * 18], '#c84a6a', 1);
        ell(ctx, 80 + Math.cos(a) * 18, 80 + Math.sin(a) * 18, 2, 2, '#f8d050');
      }
      break;
    }
    case 'lantern': {
      // one of the stone lanterns of the Three Pools, with its moon-holes lit
      ctx.beginPath();
      ctx.moveTo(60, 40);
      ctx.lineTo(100, 40);
      ctx.lineTo(80, 14);
      ctx.closePath();
      inked(ctx, '#8a8a8a', 1.4);
      ctx.beginPath();
      ctx.ellipse(80, 76, 34, 34, 0, 0, Math.PI * 2);
      inked(ctx, lin(ctx, 46, 0, 114, 0, [[0, '#9a9a9a'], [0.5, '#d0d0d0'], [1, '#8a8a8a']]), 1.6);
      for (let k = 0; k < 3; k++) ell(ctx, 62 + k * 18, 76, 6, 6, '#ffd27a');
      ctx.beginPath();
      ctx.rect(70, 110, 20, 34);
      inked(ctx, '#9a9a9a', 1.4);
      break;
    }
  }
  if (kind !== 'umbrella' && kind !== 'rabbit') frame(ctx);
  ctx.restore();
}

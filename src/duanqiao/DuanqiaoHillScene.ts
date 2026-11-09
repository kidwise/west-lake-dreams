import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { hillPolygon, rng } from '../art/paint';
import { makeSeal } from '../sudi/art';
import { Snowfall } from './art';
import { dqRun, nextDqKey } from './state';

/** The deck seen through the telescope: from the causeway (left) over the arch to the city side (right). */
const N = 90;
const DECK_Y = 470;
const ARCH = { x0: 400, x1: 900, top: 330 };
const HUD = 300;
const PAPER = { x: 190, y: 90, w: 900, h: 470 };

/** Screen point of the deck at u (0..1). */
function deckAt(u: number): { x: number; y: number } {
  const x = u * W;
  if (x < ARCH.x0 || x > ARCH.x1) return { x, y: DECK_Y };
  const k = (x - ARCH.x0) / (ARCH.x1 - ARCH.x0);
  return { x, y: DECK_Y - (DECK_Y - ARCH.top) * Math.sin(Math.PI * k) };
}

/** How fast the snow melts at u: the sunny hump of the arch first, the willow-shaded ends last. */
function meltRate(u: number): number {
  return 1 / 34 + (1 / 8.5) * Math.exp(-(((u - 0.505) / 0.09) ** 2));
}

const midAvg = (s: number[]) => avg(s, 0.45, 0.56);
const endsAvg = (s: number[]) => (avg(s, 0, 0.25) + avg(s, 0.78, 1)) / 2;
function avg(s: number[], a: number, b: number): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    if (u >= a && u <= b) {
      sum += s[i];
      n++;
    }
  }
  return n ? sum / n : 0;
}

/** 宝石山: watch the snow melt off the bridge through a telescope, and catch the moment it looks broken. */
export class DuanqiaoHillScene extends Phaser.Scene {
  private snow: number[] = [];
  private melting = false;
  private view!: Phaser.GameObjects.Graphics;
  private clouds: { img: Phaser.GameObjects.Image; shade: Phaser.GameObjects.Image; x: number; w: number; v: number; drag: boolean }[] = [];
  private shootBtn: Button | null = null;
  private readyText!: Phaser.GameObjects.Text;
  private flakes: Snowfall | null = null;
  private done = false;
  private resets = 0;
  private sunT = 0;

  constructor() {
    super('DuanqiaoHill');
  }

  create(): void {
    music.play('dqHill');
    this.snow = new Array(N).fill(1);
    this.melting = false;
    this.done = false;
    this.resets = 0;
    this.clouds = [];
    this.sunT = 0;
    this.paintBackground();
    this.view = this.add.graphics().setDepth(10);
    this.paintScope();
    this.cameras.main.fadeIn(1000, 255, 255, 255);
    void this.play();
  }

  private paintBackground(): void {
    const r = rng(13);
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0xa9cde6, 0xa9cde6, 0xe6eef2, 0xe6eef2, 1);
    g.fillRect(0, 0, W, H);
    // far shore: hills white with snow
    const pts = hillPolygon(W + 40, 200, 50, 300, 33, 12);
    g.fillStyle(0x93a6a8, 1);
    g.fillPoints(pts, true);
    for (let i = 1; i < pts.length - 1; i++) {
      if (i % 2) continue;
      g.fillStyle(0xffffff, 0.7);
      g.fillEllipse(pts[i].x, pts[i].y + 5, 14, 6);
    }
    // the lake
    g.fillGradientStyle(0xa6b8c2, 0xa6b8c2, 0x8597a2, 0x8597a2, 1);
    g.fillRect(0, 290, W, H - 290);
    this.add.tileSprite(0, 290, W, H - 290, 'ripples').setOrigin(0).setDepth(1).setAlpha(0.3);
    // the arch's reflection and hole
    const b = this.add.graphics().setDepth(2);
    b.fillStyle(0x6f6a62, 1);
    b.beginPath();
    b.moveTo(ARCH.x0 - 30, DECK_Y + 30);
    for (let i = 0; i <= 30; i++) {
      const p = deckAt((ARCH.x0 + ((ARCH.x1 - ARCH.x0) * i) / 30) / W);
      b.lineTo(p.x, p.y + 6);
    }
    b.lineTo(ARCH.x1 + 30, DECK_Y + 30);
    b.closePath();
    b.fillPath();
    const cx = (ARCH.x0 + ARCH.x1) / 2;
    b.fillStyle(0x3d4448, 1);
    b.slice(cx, DECK_Y + 32, 120, Math.PI, Math.PI * 2, false);
    b.fillPath();
    b.fillStyle(0x6f8592, 0.6);
    b.slice(cx, DECK_Y + 32, 120, 0, Math.PI, false);
    b.fillPath();
    // the causeway (白堤) on the left and the city bank on the right
    b.fillStyle(0x7d786e, 1);
    b.fillRect(0, DECK_Y + 4, ARCH.x0 + 10, 26);
    b.fillRect(ARCH.x1 - 10, DECK_Y + 4, W - ARCH.x1 + 10, 26);
    // snowy willows along the causeway
    for (let x = 20; x < ARCH.x0 - 30; x += 70) {
      b.fillStyle(0x4f6a40, 1);
      b.fillRect(x - 3, DECK_Y - 70, 6, 72);
      for (let i = 0; i < 12; i++) {
        b.fillStyle([0x5b7a4a, 0x6f8f5a][i % 2], 1);
        b.fillCircle(x + (r() - 0.5) * 60, DECK_Y - 90 + (r() - 0.5) * 50, 10 + r() * 6);
      }
      b.fillStyle(0xffffff, 0.95);
      for (let i = 0; i < 9; i++) b.fillCircle(x + (r() - 0.5) * 54, DECK_Y - 106 + (r() - 0.5) * 30, 5 + r() * 5);
    }
    // the tablet pavilion on the city side
    b.fillStyle(0x6b7378, 1);
    b.fillRect(1060, DECK_Y - 90, 80, 90);
    b.fillStyle(0x3d4a4f, 1);
    b.fillTriangle(1040, DECK_Y - 86, 1160, DECK_Y - 86, 1100, DECK_Y - 130);
    b.fillStyle(0xffffff, 1);
    b.fillTriangle(1050, DECK_Y - 92, 1150, DECK_Y - 92, 1100, DECK_Y - 126);
  }

  /** Telescope vignette, sun and the draggable clouds. */
  private paintScope(): void {
    if (!this.textures.exists('dqScope')) {
      const tex = this.textures.createCanvas('dqScope', W, H);
      if (tex) {
        const ctx = tex.getContext();
        const gr = ctx.createRadialGradient(W / 2, H / 2 - 20, 330, W / 2, H / 2 - 20, 560);
        gr.addColorStop(0, 'rgba(20,24,28,0)');
        gr.addColorStop(0.35, 'rgba(20,24,28,0.6)');
        gr.addColorStop(1, 'rgba(20,24,28,1)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);
        tex.refresh();
      }
    }
    this.add.image(0, 0, 'dqScope').setOrigin(0).setDepth(50);
    for (const [x, w, v] of [[260, 1.5, -12], [980, 1.2, -18]] as const) {
      const shade = this.add.image(x, DECK_Y - 40, 'hgGlow').setTint(0x203040).setAlpha(0).setScale(w * 2.2, 1.6).setDepth(11);
      const img = this.add.image(x, 165, 'cloud').setScale(w).setDepth(40).setAlpha(0).setInteractive({ draggable: true, useHandCursor: true });
      this.clouds.push({ img, shade, x, w: 150 * w, v, drag: false });
    }
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number) => {
      const c = this.clouds.find((q) => q.img === obj);
      if (!c) return;
      c.drag = true;
      c.x = Phaser.Math.Clamp(x, 60, W - 60);
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      const c = this.clouds.find((q) => q.img === obj);
      if (c) c.drag = false;
    });
  }

  private drawView(): void {
    const g = this.view;
    g.clear();
    // the stone deck and balustrade
    for (let i = 0; i < N - 1; i++) {
      const a = deckAt(i / (N - 1));
      const b = deckAt((i + 1) / (N - 1));
      // dark, wet stone where the snow has gone
      g.lineStyle(26, 0x3f3b35, 1);
      g.lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(7, 0x5a554c, 1);
      g.lineBetween(a.x, a.y - 18, b.x, b.y - 18);
      // the snow on top, as thick as there is left
      const s = (this.snow[i] + this.snow[i + 1]) / 2;
      if (s > 0.02) {
        g.lineStyle(6 + s * 22, 0xffffff, Math.min(1, 0.25 + s * 1.2));
        g.lineBetween(a.x, a.y - 3, b.x, b.y - 3);
        g.lineStyle(3 + s * 7, 0xffffff, Math.min(1, 0.2 + s));
        g.lineBetween(a.x, a.y - 21, b.x, b.y - 21);
      }
    }
    // balustrade posts
    for (let i = 0; i < N; i += 6) {
      const p = deckAt(i / (N - 1));
      g.fillStyle(0x7d786e, 1);
      g.fillRect(p.x - 3, p.y - 26, 6, 14);
      if (this.snow[i] > 0.1) {
        g.fillStyle(0xffffff, this.snow[i]);
        g.fillCircle(p.x, p.y - 27, 4);
      }
    }
  }

  private isBroken(): boolean {
    return midAvg(this.snow) < 0.18 && endsAvg(this.snow) > 0.58;
  }

  private async play(): Promise<void> {
    this.drawView();
    await narrate(this, [{ key: 'dq.h.n1' }], { y: 140, size: 30, color: '#ffffff', depth: 600, hintY: 200 });
    const dlg = new Dialogue(this);
    const title = i18nText(this, W / 2, 48, () => t('dq.h.title'), { fontFamily: FONT_SERIF, fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setDepth(HUD);
    const hint = i18nText(this, W / 2, H - 40, () => t('dq.h.hint'), { fontSize: '18px', color: '#ffffff', wordWrap: { width: W - 360, useAdvancedWrap: true }, align: 'center' }).setOrigin(0.5).setDepth(HUD);
    const cloudHint = i18nText(this, W / 2, 94, () => t('dq.h.cloud'), { fontSize: '17px', color: '#dfe9f0' }).setOrigin(0.5).setDepth(HUD);
    this.readyText = this.add.text(W / 2, 200, t('dq.h.ready'), baseStyle({ fontFamily: FONT_SERIF, fontSize: '40px', color: '#fff3c4', stroke: '#3a3a3a', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD).setAlpha(0);
    for (const c of this.clouds) this.tweens.add({ targets: c.img, alpha: 0.95, duration: 800 });

    await new Promise<void>((resolve) => {
      this.shootBtn = makeButton(this, W - 130, H - 90, () => t('dq.h.btnShoot'), {
        width: 170,
        height: 70,
        fontSize: 28,
        depth: HUD + 2,
        fill: 0xc0392b,
        stroke: 0x7b241c,
        textColor: '#fff8ee',
        onClick: () => {
          if (this.done || !this.melting) return;
          if (this.isBroken()) {
            this.done = true;
            resolve();
          } else {
            sfx.shutter();
            this.toast(t(midAvg(this.snow) >= 0.18 ? 'dq.h.early' : 'dq.h.late'));
          }
        },
      });
      this.input.keyboard?.on('keydown-SPACE', () => {
        if (this.done || !this.melting) return;
        if (this.isBroken()) {
          this.done = true;
          resolve();
        } else this.toast(t(midAvg(this.snow) >= 0.18 ? 'dq.h.early' : 'dq.h.late'));
      });
      this.melting = true;
      sfx.chime();
    });

    this.melting = false;
    this.shootBtn?.destroy();
    [title, hint, cloudHint].forEach((o) => o.destroy());
    this.readyText.setAlpha(0);
    for (const c of this.clouds) c.img.disableInteractive();
    sfx.shutter();
    const flash = this.add.rectangle(0, 0, W, H, 0xffffff, 1).setOrigin(0).setDepth(700);
    this.inkPainting();
    await tweenP(this, { targets: flash, alpha: 0, duration: 900 });
    flash.destroy();
    await wait(this, 200);
    this.snapPainting();
    await wait(this, 1200);
    await dlg.say('koko', 'dq.h.k1');
    await dlg.say('gogo', 'dq.h.g1');
    await dlg.say('me', 'dq.h.m1');
    dlg.hide();
    this.cameras.main.fadeOut(1200, 20, 24, 30);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('DuanqiaoEnd'));
  }

  /** The moment, repainted in ink: where the snow lies, the paper is simply left blank. */
  private inkPainting(): void {
    const layer = this.add.container(0, 0).setDepth(600);
    const { x: left, y: top, w: pw, h: ph } = PAPER;
    const paper = this.add.graphics();
    paper.fillStyle(0xf4ecdc, 1);
    paper.fillRect(left, top, pw, ph);
    paper.lineStyle(2, 0xb8a78c, 1);
    paper.strokeRect(left + 10, top + 10, pw - 20, ph - 20);
    layer.add(paper);
    const ink = this.add.graphics();
    const sx = (x: number) => left + 40 + (x / W) * (pw - 140);
    const sy = (y: number) => top + 70 + (y - 200) * 0.75;
    // far hills: a pale wash with white (blank) tops
    ink.fillStyle(0x6b6a66, 0.22);
    const pts = hillPolygon(pw - 180, 80, 40, 112, 33, 14).map((p) => new Phaser.Math.Vector2(left + 40 + p.x, top + p.y));
    ink.fillPoints(pts, true);
    ink.fillStyle(0x6b6a66, 0.18);
    const pts2 = hillPolygon(pw - 220, 104, 26, 124, 47, 14).map((p) => new Phaser.Math.Vector2(left + 40 + p.x, top + p.y));
    ink.fillPoints(pts2, true);
    // water: a few horizontal strokes
    ink.lineStyle(1.5, 0x5a5a58, 0.35);
    for (let i = 0; i < 9; i++) ink.lineBetween(sx(60 + i * 90), sy(560 + (i % 3) * 30), sx(130 + i * 90), sy(560 + (i % 3) * 30));
    // the bridge: dark ink where the stone shows, blank where snow remains
    for (let i = 0; i < N - 1; i++) {
      const a = deckAt(i / (N - 1));
      const b = deckAt((i + 1) / (N - 1));
      const s = (this.snow[i] + this.snow[i + 1]) / 2;
      ink.lineStyle(2, 0x2a2826, 0.9);
      ink.lineBetween(sx(a.x), sy(a.y + 12), sx(b.x), sy(b.y + 12));
      if (s < 0.4) {
        ink.lineStyle(9, 0x2a2826, 0.85 * (1 - s));
        ink.lineBetween(sx(a.x), sy(a.y), sx(b.x), sy(b.y));
      }
    }
    const cx = (ARCH.x0 + ARCH.x1) / 2;
    ink.lineStyle(2.5, 0x2a2826, 0.9);
    ink.beginPath();
    ink.arc(sx(cx), sy(DECK_Y + 32), 120 * ((pw - 140) / W), Math.PI, Math.PI * 2, false);
    ink.strokePath();
    ink.lineStyle(1.5, 0x2a2826, 0.4);
    ink.beginPath();
    ink.arc(sx(cx), sy(DECK_Y + 32), 120 * ((pw - 140) / W), 0, Math.PI, false);
    ink.strokePath();
    // willows: dotted ink, snow left blank on top
    for (let x = 20; x < ARCH.x0 - 30; x += 70) {
      ink.lineStyle(2, 0x2a2826, 0.8);
      ink.lineBetween(sx(x), sy(DECK_Y), sx(x), sy(DECK_Y - 80));
      for (let k = 0; k < 10; k++) {
        ink.fillStyle(0x2a2826, 0.55);
        ink.fillCircle(sx(x + (Math.random() - 0.5) * 50), sy(DECK_Y - 70 + Math.random() * 30), 2 + Math.random() * 2);
      }
    }
    layer.add(ink);
    layer.add(this.add.text(left + pw - 70, top + 170, '断\n桥\n残\n雪', baseStyle({ fontFamily: FONT_SERIF, fontSize: '42px', color: '#2a2826', align: 'center', lineSpacing: 2 })).setOrigin(0.5));
    layer.add(makeSeal(this, left + pw - 70, top + 340, '残雪', 48).setAngle(4));
  }

  private snapPainting(): void {
    const key = nextDqKey('bridge');
    this.game.renderer.snapshotArea(PAPER.x, PAPER.y, PAPER.w, PAPER.h, (img) => {
      if (img instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          dqRun.photoBridge = key;
        };
        if (img.complete) add();
        else img.onload = add;
      }
    });
  }

  private toast(text: string): void {
    const txt = this.add.text(W / 2, 260, text, baseStyle({ fontSize: '28px', color: '#ffffff', fontStyle: 'bold', stroke: '#2f3b48', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD + 5);
    this.tweens.add({ targets: txt, y: 230, alpha: 0, delay: 900, duration: 600, onComplete: () => txt.destroy() });
  }

  /** Too late: in a dream, it can simply snow again. */
  private async resnow(): Promise<void> {
    this.melting = false;
    this.resets += 1;
    if (this.resets === 1) {
      const dlg = new Dialogue(this);
      await dlg.say('koko', 'dq.h.k0');
      await dlg.say('gogo', 'dq.h.g0');
      dlg.hide();
    } else this.toast(t('dq.h.again'));
    sfx.shimmer();
    this.flakes = this.flakes ?? new Snowfall(this, { count: 120, depth: 45, front: 46 });
    this.flakes.amount = 1;
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 2200,
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          for (let i = 0; i < N; i++) this.snow[i] = Math.max(this.snow[i], k);
          this.drawView();
        },
        onComplete: () => resolve(),
      });
    });
    this.flakes.amount = 0;
    this.sunT = 0;
    this.melting = true;
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    this.flakes?.update(delta, time);
    for (const c of this.clouds) {
      if (!c.drag) c.x += c.v * dt;
      if (c.x < -150) c.x = W + 150;
      c.img.x = c.x;
      c.shade.x = c.x;
      c.shade.setAlpha(this.melting ? 0.25 : 0);
    }
    if (!this.melting || this.done) return;
    // the sun climbs, and the snow melts faster
    this.sunT += dt;
    const sun = 0.6 + Math.min(0.6, this.sunT / 25);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x = deckAt(u).x;
      const shaded = this.clouds.some((c) => Math.abs(c.x - x) < c.w * 0.75);
      this.snow[i] = Math.max(0, this.snow[i] - meltRate(u) * sun * (shaded ? 0.2 : 1) * dt);
    }
    this.drawView();
    const ok = this.isBroken();
    this.readyText.setAlpha(ok ? 0.75 + 0.25 * Math.sin(time * 0.008) : 0);
    if (endsAvg(this.snow) <= 0.58 && midAvg(this.snow) < 0.18) void this.resnow();
  }
}

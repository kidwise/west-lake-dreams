import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { llRun } from './state';

const HUD = 300;
const TWIG = { x0: 200, x1: 1060, y: 320, r: 22 };
const CENTER = { x: 640, y: 320 };

type Step = 'twist' | 'pull' | 'done';

/** Making a willow whistle (柳笛): twist the bark loose, slide the core out, and blow. */
export class LiulangWhistleScene extends Phaser.Scene {
  private twig!: Phaser.GameObjects.Graphics;
  private core!: Phaser.GameObjects.Graphics;
  private meters!: Phaser.GameObjects.Graphics;
  private step: Step = 'twist';
  private loosen = 0;
  private crack = 0;
  private pulled = 0;
  private lastAngle: number | null = null;
  private lastTime = 0;
  private dragging = false;
  private lastPull: { x: number; t: number } | null = null;
  private busy = false;
  private hint: Phaser.GameObjects.Text | null = null;
  private spaceDown = false;
  private rightDown = false;

  constructor() {
    super('LiulangWhistle');
  }

  create(): void {
    music.play('llWhistle');
    Object.assign(this, { step: 'twist', loosen: 0, crack: 0, pulled: 0, lastAngle: null, dragging: false, lastPull: null, busy: true, hint: null, spaceDown: false, rightDown: false });
    llRun.whistleTries = 1;
    this.add.image(0, 0, 'llBench').setOrigin(0);
    this.add.image(140, H + 10, 'llMom').setOrigin(0.5, 1).setScale(0.5).setDepth(30);
    this.core = this.add.graphics().setDepth(9);
    this.twig = this.add.graphics().setDepth(10);
    this.meters = this.add.graphics().setDepth(HUD);
    i18nText(this, 36, 38, () => t('ll.w.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#2f3b3a' }).setDepth(HUD);
    this.drawTwig();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p)) return;
      this.dragging = true;
      this.lastAngle = null;
      this.lastPull = null;
    });
    this.input.on('pointerup', () => {
      this.dragging = false;
      this.lastAngle = null;
      this.lastPull = null;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.drag(p));
    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', () => (this.spaceDown = true));
    kb?.on('keyup-SPACE', () => (this.spaceDown = false));
    kb?.on('keydown-RIGHT', () => (this.rightDown = true));
    kb?.on('keyup-RIGHT', () => (this.rightDown = false));
    this.cameras.main.fadeIn(800, 220, 230, 230);
    void this.play();
  }

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('mom', 'll.w.mom0');
    await dlg.say('mom', 'll.w.mom1');
    dlg.hide();
    this.setHint('ll.w.hintTwist');
    this.busy = false;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => this.step === 'done' && (ev.remove(), res()) });
    });
    this.hint?.destroy();
    this.meters.clear();
    // Mum trims a mouthpiece, and there it is
    await dlg.say('mom', 'll.w.mom3');
    dlg.hide();
    this.twig.clear();
    this.core.clear();
    const wh = this.add.image(W / 2, TWIG.y, 'llWhistle').setScale(0.3).setAlpha(0).setDepth(12);
    sfx.shimmer();
    await tweenP(this, { targets: wh, scale: 1.4, alpha: 1, duration: 700, ease: 'Back.easeOut' });
    this.pop(t('ll.w.done'), W / 2, TWIG.y - 80, '#2e7a3a');
    // each of us blows our own
    sfx.willow(1046, 0.6);
    await wait(this, 800);
    await dlg.say('me', 'll.w.m1');
    sfx.willow(1568, 0.5, 'squeak');
    await wait(this, 400);
    await dlg.say('koko', 'll.w.k1');
    sfx.willow(220, 0.7, 'raspberry');
    await wait(this, 500);
    await dlg.say('gogo', 'll.w.g1');
    await dlg.say('mom', 'll.w.mom4');
    dlg.hide();
    this.cameras.main.fadeOut(800, 220, 230, 230);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LiulangOriole'));
  }

  private setHint(key: 'll.w.hintTwist' | 'll.w.hintPull'): void {
    this.hint?.destroy();
    const touch = this.sys.game.device.input.touch;
    this.hint = i18nText(this, W / 2 + 80, H - 30, () => t(touch ? (`${key}Touch` as 'll.w.hintTwistTouch') : key), {
      fontSize: '20px',
      color: '#2f3b3a',
      backgroundColor: '#fdf8eecc',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 1).setDepth(HUD);
  }

  // ---- input ---------------------------------------------------------------------------------------

  private drag(p: Phaser.Input.Pointer): void {
    if (this.busy || !this.dragging || !p.isDown) return;
    const now = this.time.now;
    if (this.step === 'twist') {
      const a = Math.atan2(p.y - CENTER.y, p.x - CENTER.x);
      if (this.lastAngle !== null) {
        let d = a - this.lastAngle;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        const dt = Math.max(1, now - this.lastTime) / 1000;
        this.twist(Math.abs(d), Math.abs(d) / dt);
      }
      this.lastAngle = a;
      this.lastTime = now;
    } else if (this.step === 'pull') {
      if (this.lastPull) {
        const dx = p.x - this.lastPull.x;
        const v = dx / Math.max(1, now - this.lastPull.t) * 1000;
        if (dx > 0) this.pull(dx, v);
      }
      this.lastPull = { x: p.x, t: now };
    }
  }

  /** Twisting the bark: steady circles loosen it; frantic ones crack it. */
  private twist(da: number, speed: number): void {
    if (speed > 14) {
      this.crack += da * 0.09;
      if (Math.random() < 0.05) sfx.dig();
    } else if (speed > 1.5) {
      this.loosen += da * 0.045;
      if (Math.random() < 0.15) sfx.tick(false);
    }
    if (this.crack >= 1) void this.fail('ll.w.crack');
    else if (this.loosen >= 1) {
      this.loosen = 1;
      this.step = 'pull';
      sfx.chime();
      this.pop(t('ll.w.loose'), W / 2, TWIG.y - 70, '#2e7a3a');
      this.setHint('ll.w.hintPull');
    }
    this.drawTwig();
  }

  /** Sliding the white core out: steady does it. */
  private pull(dx: number, v: number): void {
    if (v > 1100) {
      void this.fail('ll.w.snap');
      return;
    }
    this.pulled = Math.min(1, this.pulled + dx / 520);
    if (Math.random() < 0.2) sfx.brush();
    if (this.pulled >= 1) {
      this.step = 'done';
      sfx.chime();
    }
    this.drawTwig();
  }

  private async fail(key: 'll.w.crack' | 'll.w.snap'): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    sfx.dig();
    this.cameras.main.shake(160, 0.006);
    this.pop(t(key), W / 2, TWIG.y - 70, '#a83a2a');
    llRun.whistleTries += 1;
    await wait(this, 700);
    const dlg = new Dialogue(this);
    await dlg.say('mom', 'll.w.mom2');
    dlg.hide();
    // a fresh twig
    this.loosen = 0;
    this.crack = 0;
    this.pulled = 0;
    this.step = 'twist';
    this.setHint('ll.w.hintTwist');
    this.drawTwig();
    this.busy = false;
  }

  private pop(s: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '30px', color, fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, delay: 500, duration: 800, onComplete: () => txt.destroy() });
  }

  // ---- drawing the twig ----------------------------------------------------------------------------------

  private drawTwig(): void {
    const g = this.twig;
    const c = this.core;
    g.clear();
    c.clear();
    const { x0, x1, y, r } = TWIG;
    if (this.step === 'done') return;
    const slide = this.pulled * 520;
    // the pale wooden core, sliding out of the bark to the right
    c.fillStyle(0xf4ecc8, 1);
    c.fillRect(x0 + 40 + slide, y - r + 6, x1 - x0 - 40, (r - 6) * 2);
    c.fillStyle(0xd8c890, 1);
    c.fillRect(x0 + 40 + slide, y + r - 12, x1 - x0 - 40, 6);
    c.lineStyle(1.5, 0x8a7a50, 1);
    c.strokeRect(x0 + 40 + slide, y - r + 6, x1 - x0 - 40, (r - 6) * 2);
    c.fillStyle(0xe8d8a8, 1);
    c.fillEllipse(x1 + slide, y, 12, (r - 6) * 2);
    // the bark: a green tube, darker where it's been twisted loose
    const darken = this.loosen * 0.25;
    const top = Phaser.Display.Color.GetColor(140 - darken * 120, 190 - darken * 150, 100 - darken * 80);
    const bot = Phaser.Display.Color.GetColor(70 - darken * 40, 110 - darken * 60, 50 - darken * 30);
    g.fillGradientStyle(top, top, bot, bot, 1);
    g.fillRect(x0, y - r, x1 - x0, r * 2);
    g.lineStyle(2, 0x2e4a22, 1);
    g.strokeRect(x0, y - r, x1 - x0, r * 2);
    // highlight and little leaf scars
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(x0 + 6, y - r + 4, x1 - x0 - 12, 4);
    g.fillStyle(0x3a5a2a, 0.8);
    for (let x = x0 + 60; x < x1; x += 110) g.fillEllipse(x, y - r + 8, 6, 3);
    // twist marks spiralling round the bark as it loosens
    const n = Math.floor(this.loosen * 14);
    g.lineStyle(1.5, 0x2e4a22, 0.6);
    for (let k = 0; k < n; k++) {
      const x = x0 + 30 + k * ((x1 - x0 - 60) / 14);
      g.lineBetween(x, y - r, x + 18, y + r);
    }
    // cracks if twisted too hard
    if (this.crack > 0.1) {
      g.lineStyle(2.4, 0x5a2a12, Math.min(1, this.crack));
      const cx = W / 2 - 40;
      g.beginPath();
      g.moveTo(cx, y - r);
      g.lineTo(cx + 20, y - 6);
      g.lineTo(cx + 6, y + 4);
      g.lineTo(cx + 34 * this.crack + 10, y + r);
      g.strokePath();
    }
    // the cut ends
    g.fillStyle(0xe8d8a8, 1);
    g.fillEllipse(x0, y, 12, r * 2);
    g.lineStyle(1.5, 0x2e4a22, 1);
    g.strokeEllipse(x0, y, 12, r * 2);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    if (!this.busy) {
      // keyboard: hold Space to twist steadily, hold → to pull slowly
      if (this.spaceDown && this.step === 'twist') this.twist(dt * 5, 5);
      if (this.rightDown && this.step === 'pull') this.pull(dt * 260, 260);
      this.crack = Math.max(0, this.crack - dt * 0.05);
    }
    // the meters
    const m = this.meters;
    m.clear();
    if (this.step === 'done') return;
    const x = W / 2 - 160;
    const y = 470;
    const bar = (yy: number, v: number, col: number) => {
      m.fillStyle(0x2f3b3a, 0.25);
      m.fillRoundedRect(x, yy, 320, 14, 7);
      m.fillStyle(col, 1);
      m.fillRoundedRect(x, yy, 320 * Math.min(1, v), 14, 7);
    };
    if (this.step === 'twist') {
      // a dotted guide circle with a turning arrow, to show what to do
      const t = this.time.now / 1000;
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2 + t * 1.2;
        const px = CENTER.x + Math.cos(a) * 190;
        const py = CENTER.y + Math.sin(a) * 120;
        m.fillStyle(0x2f5a2a, 0.35);
        m.fillCircle(px + 1, py + 1.5, 5.5);
        m.fillStyle(0xffffff, 0.5 + 0.5 * (k / 24));
        m.fillCircle(px, py, 4.5);
      }
      const ha = t * 1.2 + Math.PI * 2;
      const hx = CENTER.x + Math.cos(ha) * 190;
      const hy = CENTER.y + Math.sin(ha) * 120;
      // an arrowhead pointing along the direction of travel
      const tx = -Math.sin(ha);
      const ty = Math.cos(ha) * 0.63;
      const tl = Math.hypot(tx, ty) || 1;
      const ux = tx / tl;
      const uy = ty / tl;
      m.fillStyle(0xffffff, 1);
      m.lineStyle(2, 0x2f5a2a, 0.8);
      m.fillTriangle(hx + ux * 16, hy + uy * 16, hx - uy * 10, hy + ux * 10, hx + uy * 10, hy - ux * 10);
      m.strokeTriangle(hx + ux * 16, hy + uy * 16, hx - uy * 10, hy + ux * 10, hx + uy * 10, hy - ux * 10);
      bar(y, this.loosen, 0x5aa04a);
      bar(y + 26, this.crack, 0xd8603a);
    } else {
      bar(y, this.pulled, 0xd8c890);
    }
  }
}

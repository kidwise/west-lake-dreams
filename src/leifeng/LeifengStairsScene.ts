import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { makeButton, type Button } from '../ui/Button';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { drawRunner } from './art';
import { Sunset } from './Sunset';
import { lfRun } from './state';

const N = 110;
const SW = 36;
const SH = 18;
const X0 = 300;
const Y0 = 900;
const ESC_UP = 92;
const ESC_SPEED = 4;
const HUD = 300;

const sx = (s: number) => X0 + s * SW + SW / 2;
const sy = (s: number) => Y0 - s * SH;

interface Thing {
  img: Phaser.GameObjects.Image;
  s: number;
  kind: 'crab' | 'muyu';
  done: boolean;
}

/** Up the steps of 夕照山, left foot, right foot — racing GOGO on the escalator, dodging 法海's crabs. */
export class LeifengStairsScene extends Phaser.Scene {
  private sunset!: Sunset;
  private me!: Phaser.GameObjects.Graphics;
  private koko!: Phaser.GameObjects.Graphics;
  private gogo!: Phaser.GameObjects.Graphics;
  private lady!: Phaser.GameObjects.Image;
  private fahai!: Phaser.GameObjects.Image;
  private escSteps!: Phaser.GameObjects.Graphics;
  private s = 0;
  private target = 0;
  private ks = 0;
  private es = 0;
  private lastFoot: -1 | 0 | 1 = 0;
  private stunUntil = 0;
  private airUntil = 0;
  private phase = 0;
  private active = false;
  private startAt = 0;
  private nextThrow = 0;
  private things: Thing[] = [];
  private stepText!: Phaser.GameObjects.Text;
  private bar!: Phaser.GameObjects.Graphics;
  private buttons: Button[] = [];
  private finished = false;

  constructor() {
    super('LeifengStairs');
  }

  create(): void {
    music.play('lfStairs');
    Object.assign(this, { s: 0, target: 0, ks: 0, es: 0, lastFoot: 0, stunUntil: 0, airUntil: 0, phase: 0, active: false, nextThrow: 0, finished: false });
    this.things = [];
    this.buttons = [];
    this.sunset = new Sunset(this, { horizon: 470, sunX: 1080, sunY: 300 });
    this.paintWorld();
    this.cameras.main.setBounds(0, -1500, X0 + N * SW + 900, 2500);
    this.follow(true);
    this.buildHud();
    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => this.foot(-1));
    kb?.on('keydown-A', () => this.foot(-1));
    kb?.on('keydown-RIGHT', () => this.foot(1));
    kb?.on('keydown-D', () => this.foot(1));
    kb?.on('keydown-SPACE', () => this.jump());
    kb?.on('keydown-UP', () => this.jump());
    this.cameras.main.fadeIn(800, 40, 20, 40);
    void this.play();
  }

  // ---- the hillside --------------------------------------------------------------------------------

  private paintWorld(): void {
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const top = sy(N);
    const endX = sx(N) + 600;
    // the wooded hill rising behind the steps
    const hill = this.add.graphics().setDepth(2);
    hill.fillGradientStyle(0x4a3048, 0x4a3048, 0x2a1c2e, 0x2a1c2e, 1);
    hill.fillPoints([V(0, Y0 + 400), V(0, Y0 - 260), V(sx(N), top - 360), V(endX + 400, top - 420), V(endX + 400, Y0 + 400)], true);
    const r = rng(77);
    for (let i = 0; i < 230; i++) {
      const s = -8 + r() * (N + 30);
      const x = sx(s) + (r() - 0.5) * 160;
      const y = sy(Math.min(N, s)) - ESC_UP - 70 - r() * 330;
      this.add.image(x, y, r() < 0.5 ? 'lfCanopy' : 'lfCanopy2').setScale(0.7 + r() * 0.6).setDepth(2.1 + r() * 0.1).setFlipX(r() < 0.4);
    }
    // the escalator, a little further up the slope behind the steps
    const esc = this.add.graphics().setDepth(4);
    const ex0 = sx(-2);
    const ex1 = sx(N + 1);
    const ey = (x: number) => sy((x - X0 - SW / 2) / SW) - ESC_UP;
    esc.fillStyle(0x8fa8b8, 0.35);
    esc.fillPoints([V(ex0, ey(ex0)), V(ex1, ey(ex1)), V(ex1, ey(ex1) + 40), V(ex0, ey(ex0) + 40)], true);
    esc.lineStyle(4, 0x1e1a22, 1);
    esc.lineBetween(ex0, ey(ex0) - 36, ex1, ey(ex1) - 36);
    esc.lineStyle(2, 0xd8c0a0, 0.6);
    esc.lineBetween(ex0, ey(ex0) - 35, ex1, ey(ex1) - 35);
    esc.fillStyle(0xbfd8e4, 0.18);
    esc.fillPoints([V(ex0, ey(ex0) - 36), V(ex1, ey(ex1) - 36), V(ex1, ey(ex1)), V(ex0, ey(ex0))], true);
    for (let x = ex0; x < ex1; x += 220) {
      esc.fillStyle(0x6a5a6a, 1);
      esc.fillRect(x, ey(x) + 40, 8, 200);
    }
    this.escSteps = this.add.graphics().setDepth(4.5);
    // the stone steps
    const st = this.add.graphics().setDepth(10);
    st.fillStyle(0x6a4a4a, 1);
    st.fillPoints([V(X0 - 400, Y0), V(X0, Y0), V(sx(N) + SW / 2, top), V(endX + 400, top), V(endX + 400, Y0 + 400), V(X0 - 400, Y0 + 400)], true);
    for (let i = 0; i < N; i++) {
      const x = X0 + i * SW;
      const y = Y0 - (i + 1) * SH;
      // riser in shadow, tread catching the light
      st.fillStyle(0x8a6458, 1);
      st.fillRect(x, y, SW, SH);
      st.fillStyle(0xd8a888, 1);
      st.fillRect(x, y, SW, 4);
      st.fillStyle(0xffd0a0, 0.6);
      st.fillRect(x + SW - 8, y, 8, 3);
    }
    // the top landing
    st.fillStyle(0xd8a888, 1);
    st.fillRect(X0 + N * SW, top - 4, 900, 6);
    // stone lanterns along the way, glowing
    for (let i = 8; i < N; i += 16) {
      const x = X0 + i * SW + 10;
      const y = Y0 - (i + 1) * SH;
      st.fillStyle(0x5a4040, 1);
      st.fillRect(x - 4, y - 46, 8, 46);
      st.fillStyle(0x7a5a50, 1);
      st.fillRect(x - 12, y - 64, 24, 20);
      st.fillTriangle(x - 16, y - 64, x + 16, y - 64, x, y - 78);
      st.fillStyle(0xffd27a, 1);
      st.fillRect(x - 6, y - 60, 12, 12);
      this.add.image(x, y - 54, 'lfGlow').setScale(1.2).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
    }
    // the great pagoda at the top, its door glowing
    this.add.image(sx(N) + 420, top + 6, 'lfPagoda').setOrigin(0.5, 1).setScale(1.05).setDepth(3);
    this.add.image(sx(N) + 420, top - 400, 'lfGlow').setScale(9).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.5);
    // the runners
    this.gogo = this.add.graphics().setDepth(6);
    drawPerson(this.gogo, LOOKS.gogo, { facing: 1 });
    this.gogo.setScale(0.8);
    this.lady = this.add.image(0, 0, 'lfLady').setOrigin(0.5, 1).setScale(0.42).setDepth(5.5);
    this.koko = this.add.graphics().setDepth(19);
    this.me = this.add.graphics().setDepth(20);
    this.fahai = this.add.image(sx(N) + 120, top + 2, 'lfFahai').setOrigin(0.5, 1).setScale(0.6).setDepth(15);
  }

  private buildHud(): void {
    i18nText(this, 36, 38, () => t('lf.s.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#fff4e0', stroke: '#3a2030', strokeThickness: 5 }).setScrollFactor(0).setDepth(HUD);
    this.stepText = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#fff4e0', stroke: '#3a2030', strokeThickness: 4 })).setScrollFactor(0).setDepth(HUD);
    this.bar = this.add.graphics().setScrollFactor(0).setDepth(HUD);
  }

  private follow(snap = false): void {
    const cam = this.cameras.main;
    const tx = sx(this.s) - 430;
    const ty = sy(this.s) - 470;
    if (snap) cam.setScroll(tx, ty);
    else {
      cam.scrollX += (tx - cam.scrollX) * 0.12;
      cam.scrollY += (ty - cam.scrollY) * 0.12;
    }
  }

  // ---- story -------------------------------------------------------------------------------------

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('koko', 'lf.s.k1');
    await dlg.say('gogo', 'lf.s.g1');
    dlg.hide();
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 120, () => t(touch ? 'lf.s.hintTouch' : 'lf.s.hintKeys'), {
      fontSize: '20px',
      color: '#fff4e0',
      stroke: '#3a2030',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(HUD);
    this.tweens.add({ targets: hint, alpha: 0, delay: 7000, duration: 1000 });
    const mk = (x: number, key: 'lf.s.btnL' | 'lf.s.btnR' | 'lf.s.btnJump', fn: () => void) =>
      makeButton(this, x, H - 56, () => t(key), { width: 170, height: 70, fontSize: 24, fixed: true, depth: HUD, fill: 0xfff4e0, onDown: fn });
    this.buttons = [mk(130, 'lf.s.btnL', () => this.foot(-1)), mk(W / 2, 'lf.s.btnJump', () => this.jump()), mk(W - 130, 'lf.s.btnR', () => this.foot(1))];
    for (const b of this.buttons) b.container.setAlpha(touch ? 1 : 0.75);
    // ready, go
    const go = this.add.text(W / 2, 260, '', baseStyle({ fontSize: '64px', color: '#ffe08a', fontStyle: 'bold', stroke: '#3a2030', strokeThickness: 8 })).setOrigin(0.5).setScrollFactor(0).setDepth(HUD);
    for (const n of ['3', '2', '1']) {
      go.setText(n);
      sfx.tick(n === '1');
      await wait(this, 550);
    }
    go.setText(t('lf.s.go'));
    sfx.bell();
    this.tweens.add({ targets: go, alpha: 0, delay: 400, duration: 400 });
    this.active = true;
    this.startAt = this.time.now;
    this.nextThrow = this.time.now + 2200;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => this.finished && (ev.remove(), res()) });
    });
    this.active = false;
    hint.destroy();
    go.destroy();
    for (const b of this.buttons) b.destroy();
    this.buttons = [];
    lfRun.stairsTime = Math.round((this.time.now - this.startAt) / 1000);
    lfRun.beatGogo = this.es < N;
    sfx.chime();
    // 法海 bolts in through the door
    sfx.tock();
    this.fahai.setFlipX(false);
    void tweenP(this, { targets: this.fahai, x: sx(N) + 420, alpha: 0, scale: 0.4, duration: 900, ease: 'Sine.easeIn' });
    await wait(this, 1200);
    if (lfRun.beatGogo) {
      await dlg.say('gogo', 'lf.s.gWin');
      await dlg.say('koko', 'lf.s.kWin');
    } else {
      await dlg.say('gogo', 'lf.s.gLose');
      await dlg.say('koko', 'lf.s.kLose');
    }
    await dlg.say('white', 'lf.s.w1');
    dlg.hide();
    this.cameras.main.fadeOut(800, 30, 16, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LeifengRuins'));
  }

  // ---- input ---------------------------------------------------------------------------------------

  private foot(f: -1 | 1): void {
    if (!this.active || this.time.now < this.stunUntil) return;
    if (f === this.lastFoot) {
      // the same foot twice: a stumble
      this.stunUntil = this.time.now + 450;
      lfRun.stumbles += 1;
      sfx.dig();
      this.pop(t('lf.s.stumble'), '#ffd0c0');
      this.lastFoot = 0;
      return;
    }
    this.lastFoot = f;
    this.target = Math.min(N, Math.floor(this.target) + 1);
    sfx.tick(f > 0);
  }

  private jump(): void {
    if (!this.active || this.time.now < this.airUntil) return;
    this.airUntil = this.time.now + 560;
    sfx.boing();
  }

  private pop(s: string, color: string): void {
    const txt = this.add.text(this.me.x, this.me.y - 160, s, baseStyle({ fontSize: '24px', color, fontStyle: 'bold', stroke: '#3a2030', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD - 5);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  private throwThing(): void {
    const kind: Thing['kind'] = Math.random() < 0.55 ? 'crab' : 'muyu';
    const s = Math.min(N - 1, this.s + 13);
    const img = this.add.image(sx(s), sy(s), kind === 'crab' ? 'lfCrab' : 'lfMuyu').setOrigin(0.5, 1).setScale(kind === 'crab' ? 0.55 : 0.75).setDepth(18);
    this.things.push({ img, s, kind, done: false });
    if (kind === 'muyu') sfx.tock();
    // 法海 shouting from above (if he's on screen)
    if (Math.abs(this.fahai.x - this.cameras.main.scrollX - W / 2) < W) this.tweens.add({ targets: this.fahai, y: this.fahai.y - 14, yoyo: true, duration: 120 });
  }

  // ---- frame -------------------------------------------------------------------------------------------

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.sunset.update(time);
    const stunned = time < this.stunUntil;
    if (this.active) {
      this.es = Math.min(N, (time - this.startAt) / 1000 * ESC_SPEED);
      if (time > this.nextThrow && this.s < N - 4) {
        this.throwThing();
        this.nextThrow = time + 1500 + Math.random() * 1500;
      }
    }
    const before = this.s;
    if (!stunned) this.s = Math.min(this.target, this.s + dt * 13);
    if (this.s < this.target - 0.001 || this.s !== before) this.phase += dt * 16;
    this.ks += (Math.max(0, this.s - 1.6) - this.ks) * Math.min(1, dt * 6);
    const air = time < this.airUntil;
    const hop = air ? Math.sin(((this.airUntil - time) / 560) * Math.PI) * 46 : 0;
    drawRunner(this.me, LOOKS.me, this.phase, { backpack: true, air });
    this.me.setPosition(sx(this.s), sy(this.s) - hop);
    if (stunned) this.me.setAngle(Math.sin(time * 0.05) * 8);
    else this.me.setAngle(0);
    drawRunner(this.koko, LOOKS.koko, this.phase + 1.4);
    this.koko.setPosition(sx(this.ks) - 6, sy(this.ks));
    // GOGO and the lady glide up the escalator
    this.gogo.setPosition(sx(this.es), sy(this.es) - ESC_UP + 2);
    this.lady.setPosition(sx(this.es) - 70, sy(this.es - 2) - ESC_UP + 4);
    // escalator steps sliding upward
    const g = this.escSteps;
    g.clear();
    g.lineStyle(2, 0x3a3440, 0.8);
    const off = ((time / 1000) * ESC_SPEED) % 1;
    const cam = this.cameras.main;
    const s0 = Math.max(-2, Math.floor((cam.scrollX - X0) / SW) - 2);
    for (let k = s0; k < s0 + 44 && k < N + 1; k++) {
      const s = k + off;
      g.lineBetween(sx(s) - SW / 2, sy(s) - ESC_UP, sx(s) - SW / 2, sy(s) - ESC_UP + 8);
    }
    // things rolling down
    for (const th of this.things) {
      if (th.done) continue;
      th.s -= dt * (th.kind === 'muyu' ? 8 : 6);
      th.img.setPosition(sx(th.s), sy(th.s) + (th.kind === 'crab' ? Math.abs(Math.sin(time * 0.03)) * -3 : -6));
      if (th.kind === 'muyu') th.img.rotation -= dt * 10;
      else th.img.setAngle(Math.sin(time * 0.04) * 8);
      if (!air && !stunned && this.active && Math.abs(th.s - this.s) < 0.6) {
        // hit! slide back down a few steps
        th.done = true;
        lfRun.hits += 1;
        this.s = Math.max(0, this.s - 4);
        this.target = this.s;
        this.stunUntil = time + 700;
        this.lastFoot = 0;
        sfx.dig();
        this.cameras.main.shake(180, 0.006);
        this.pop(t(th.kind === 'crab' ? 'lf.s.hitCrab' : 'lf.s.hitMuyu'), '#ffd0c0');
        this.tweens.add({ targets: th.img, y: th.img.y - 120, x: th.img.x - 160, angle: 540, alpha: 0, duration: 700, onComplete: () => th.img.destroy() });
      } else if (th.s < this.s - 6 || th.s < -2) {
        th.done = true;
        th.img.destroy();
      }
    }
    this.things = this.things.filter((th) => !th.done);
    if (this.active && this.s >= N) this.finished = true;
    this.follow();
    // HUD: steps, and the race
    this.stepText.setText(t('lf.s.steps', { n: Math.floor(this.s), total: N }));
    const b = this.bar;
    b.clear();
    const x0 = W - 380;
    const x1 = W - 80;
    b.fillStyle(0x3a2030, 0.5);
    b.fillRoundedRect(x0 - 10, 92, x1 - x0 + 20, 14, 7);
    b.fillStyle(0x5dade2, 1);
    b.fillCircle(x0 + (x1 - x0) * (this.es / N), 99, 9);
    b.fillStyle(0xc0392b, 1);
    b.fillCircle(x0 + (x1 - x0) * (this.s / N), 99, 9);
    b.fillStyle(0xffe08a, 1);
    b.fillTriangle(x1 + 6, 86, x1 + 6, 112, x1 + 22, 99);
  }
}

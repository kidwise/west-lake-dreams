import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { makeButton, type Button } from '../ui/Button';
import { rng } from '../art/paint';
import { Sunset } from './Sunset';
import { lfRun, nextLfKey } from './state';

const HUD = 300;
const FRAME = { x: 150, y: 64, w: 980, h: 470 };
const SHOTS = 3;
const SUN_X = 960;
const SUN_FROM = 190;
const SUN_TO = 480;
const SUN_TIME = 34;

type Light = 'perfect' | 'early' | 'late';
interface Peek {
  img: Phaser.GameObjects.Image;
  out: boolean;
}

/** The top of the pagoda at sunset: catch the sun touching the western hills — with 法海 photobombing. */
export class LeifengTopScene extends Phaser.Scene {
  private sunset!: Sunset;
  private sunY = SUN_FROM;
  private shooting = false;
  private shots = SHOTS;
  private best = -1;
  private sunStart = 0;
  private peeks: Peek[] = [];
  private nextPeek = 0;
  private hud: Phaser.GameObjects.GameObject[] = [];
  private shotBtn: Button | null = null;
  private shotText: Phaser.GameObjects.Text | null = null;
  private boats: Phaser.GameObjects.Graphics[] = [];
  private birds: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('LeifengTop');
  }

  create(): void {
    music.play('lfSunset');
    this.sunY = SUN_FROM;
    this.shooting = false;
    this.shots = SHOTS;
    this.best = -1;
    this.peeks = [];
    this.hud = [];
    this.shotBtn = null;
    this.shotText = null;
    this.boats = [];
    this.birds = [];
    this.sunset = new Sunset(this, { horizon: 400, sunX: SUN_X, sunY: SUN_FROM, baochu: true });
    this.paintLake();
    this.paintBalcony();
    this.cameras.main.fadeIn(1200, 255, 220, 160);
    void this.play();
  }

  // ---- the view ---------------------------------------------------------------------------------------

  private paintLake(): void {
    const g = this.add.graphics().setDepth(1);
    // 苏堤: a long, low line of willows and peach trees, broken by six humped bridges
    const y0 = 438;
    const r = rng(19);
    g.fillStyle(0x4a2a48, 1);
    g.fillRect(520, y0, W - 520, 4);
    for (let x = 524; x < W; x += 6) {
      const k = (x - 520) / (W - 520);
      if ([0.08, 0.24, 0.4, 0.56, 0.72, 0.88].some((b) => Math.abs(k - b) < 0.012)) continue;
      const hgt = 4 + r() * 7 + Math.sin(x * 0.05) * 2;
      g.fillStyle(r() < 0.5 ? 0x4a2a48 : 0x3e2240, 1);
      g.fillEllipse(x, y0 - hgt / 2, 8 + r() * 6, hgt + 3);
    }
    for (const b of [0.08, 0.24, 0.4, 0.56, 0.72, 0.88]) {
      const x = 520 + b * (W - 520);
      g.lineStyle(2, 0x4a2a48, 1);
      g.beginPath();
      g.arc(x, y0 + 5, 9, Math.PI * 1.05, Math.PI * 1.95, false);
      g.strokePath();
    }
    // a few egrets flying home
    for (let i = 0; i < 4; i++) {
      const bird = this.add.graphics().setDepth(2);
      bird.lineStyle(2, 0x3a2040, 0.85);
      bird.beginPath();
      bird.moveTo(-9, 0);
      bird.lineTo(-3, -4);
      bird.lineTo(0, 0);
      bird.lineTo(3, -4);
      bird.lineTo(9, 0);
      bird.strokePath();
      bird.setPosition(300 + i * 70 + r() * 40, 150 + r() * 80);
      this.birds.push(bird);
    }
    // the little island of 三潭印月 and its three stone lanterns
    g.fillStyle(0x3e2440, 1);
    g.fillEllipse(430, 470, 90, 14);
    for (const [x, y] of [[390, 492], [430, 500], [470, 490]]) {
      g.fillRect(x - 1.5, y - 10, 3, 10);
      g.fillCircle(x, y - 12, 3);
    }
    // little boats drifting home
    for (let i = 0; i < 3; i++) {
      const b = this.add.graphics().setDepth(2);
      b.fillStyle(0x2a1830, 1);
      b.fillPoints([new Phaser.Math.Vector2(-26, 0), new Phaser.Math.Vector2(26, 0), new Phaser.Math.Vector2(18, 7), new Phaser.Math.Vector2(-18, 7)], true);
      b.fillRect(-10, -9, 18, 9);
      b.lineStyle(1.5, 0x2a1830, 1);
      b.lineBetween(-20, -2, -30, 12);
      b.setPosition(200 + i * 360, 520 + i * 40).setScale(0.8 + i * 0.25);
      this.boats.push(b);
    }
  }

  private paintBalcony(): void {
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const g = this.add.graphics().setDepth(20);
    // the eaves overhead, edged with gold, curling up at the corners
    g.fillStyle(0x2a1a1c, 1);
    g.fillPoints([V(0, 0), V(W, 0), V(W, 38), V(W - 60, 30), V(W / 2, 46), V(60, 30), V(0, 38)], true);
    g.lineStyle(4, 0xe0b060, 1);
    g.beginPath();
    g.moveTo(0, 38);
    g.lineTo(60, 30);
    g.lineTo(W / 2, 46);
    g.lineTo(W - 60, 30);
    g.lineTo(W, 38);
    g.strokePath();
    for (let x = 30; x < W; x += 34) {
      g.fillStyle(0xc89a50, 1);
      g.fillCircle(x, 40 + Math.abs(x - W / 2) * -0.012, 3);
    }
    // columns at either side
    for (const x of [0, W - 34]) {
      g.fillGradientStyle(0x6a2418, 0xb8502e, 0x6a2418, 0xb8502e, 1);
      g.fillRect(x, 30, 34, H);
      g.fillStyle(0xe0b060, 1);
      g.fillRect(x, 30, 34, 6);
    }
    // the railing along the bottom
    const top = 560;
    g.fillGradientStyle(0x8a6030, 0xffd890, 0x6a4620, 0xc89a50, 1);
    g.fillRect(0, top, W, 10);
    g.fillRect(0, top + 120, W, 12);
    for (let x = 14; x < W; x += 26) {
      g.fillStyle(x > W * 0.6 ? 0xe8b868 : 0xb08040, 1);
      g.fillRect(x, top + 10, 8, 110);
    }
    g.fillStyle(0x3a2420, 1);
    g.fillRect(0, top + 132, W, H - top - 132);
    // warm light on the railing
    const glow = this.add.graphics().setDepth(21).setBlendMode(Phaser.BlendModes.ADD);
    glow.fillGradientStyle(0xffa050, 0xffa050, 0xffa050, 0xffa050, 0, 0.25, 0, 0.25);
    glow.fillRect(W * 0.4, top - 4, W * 0.6, 140);
  }

  // ---- story ----------------------------------------------------------------------------------------

  private async play(): Promise<void> {
    const lady = this.add.image(1120, 600, 'lfLady').setOrigin(0.5, 1).setScale(0.62).setDepth(22).setFlipX(true);
    this.tweens.add({ targets: lady, y: 594, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut' });
    await narrate(this, [{ key: 'lf.t.n1' }], { y: 120, size: 28, depth: 600, hintY: 180 });
    const dlg = new Dialogue(this);
    await dlg.say('koko', 'lf.t.k1');
    await dlg.say('white', 'lf.t.w1');
    await dlg.say('koko', 'lf.t.k2');
    await dlg.say('white', 'lf.t.w2');
    await dlg.say('me', 'lf.t.m1');
    dlg.hide();
    this.tweens.add({ targets: lady, alpha: 0, duration: 400 });
    await this.photoGame();
    this.tweens.add({ targets: lady, alpha: 1, duration: 400 });
    if (lfRun.photoGrade !== 'perfect') {
      await dlg.say('white', 'lf.t.wComfort');
      dlg.hide();
    }
    await this.crabEnding(dlg, lady);
    this.cameras.main.fadeOut(1400, 60, 30, 60);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LeifengEnd'));
  }

  private async photoGame(): Promise<void> {
    const touch = this.sys.game.device.input.touch;
    const vf = this.add.graphics().setDepth(HUD - 10);
    vf.lineStyle(4, 0xffffff, 0.9);
    const { x, y, w, h } = FRAME;
    const c = 34;
    for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
      vf.lineBetween(px, py, px + dx * c, py);
      vf.lineBetween(px, py, px, py + dy * c);
    }
    vf.lineStyle(1, 0xffffff, 0.25);
    vf.lineBetween(x + w / 3, y, x + w / 3, y + h);
    vf.lineBetween(x + (2 * w) / 3, y, x + (2 * w) / 3, y + h);
    vf.lineBetween(x, y + h / 3, x + w, y + h / 3);
    vf.lineBetween(x, y + (2 * h) / 3, x + w, y + (2 * h) / 3);
    const hint = i18nText(this, W / 2, 612, () => t(touch ? 'lf.t.hintTouch' : 'lf.t.hint'), {
      fontSize: '19px',
      color: '#fff4e0',
      stroke: '#3a2030',
      strokeThickness: 5,
      align: 'center',
      wordWrap: { width: 820, useAdvancedWrap: true },
    }).setOrigin(0.5).setDepth(HUD);
    this.shotText = i18nText(this, 150, 660, () => t('lf.t.shots', { n: this.shots }), { fontSize: '20px', color: '#fff4e0', stroke: '#3a2030', strokeThickness: 4 }).setOrigin(0.5).setDepth(HUD);
    this.shotBtn = makeButton(this, W - 150, 660, () => t('lf.t.btnShoot'), { width: 200, height: 64, fontSize: 24, depth: HUD, fill: 0xfff4e0, onClick: () => void this.shoot() });
    this.hud = [vf, hint, this.shotText];
    const kb = this.input.keyboard;
    const onSpace = () => void this.shoot();
    kb?.on('keydown-SPACE', onSpace);
    this.shooting = true;
    this.sunStart = this.time.now;
    this.nextPeek = this.time.now + 2500;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.shooting && (ev.remove(), res()) });
    });
    kb?.off('keydown-SPACE', onSpace);
    for (const p of this.peeks) this.hidePeek(p);
    for (const o of this.hud) o.destroy();
    this.hud = [];
    this.shotBtn.destroy();
    this.shotBtn = null;
    this.shotText = null;
    await wait(this, 400);
  }

  private light(): Light {
    const ridge = this.sunset.ridgeAt(SUN_X);
    if (this.sunY < ridge - 40) return 'early';
    if (this.sunY > ridge + 4) return 'late';
    return 'perfect';
  }

  private fahaiInFrame(): boolean {
    return this.peeks.some((p) => !p.out && p.img.active && Phaser.Geom.Rectangle.Overlaps(new Phaser.Geom.Rectangle(FRAME.x, FRAME.y, FRAME.w, FRAME.h), p.img.getBounds()));
  }

  private async shoot(): Promise<void> {
    if (!this.shooting || this.shots <= 0) return;
    this.shots -= 1;
    this.shotText?.setText(t('lf.t.shots', { n: this.shots }));
    const light = this.light();
    const fahai = this.fahaiInFrame();
    const score = (light === 'perfect' ? 2 : 1) - (fahai ? 0.6 : 0);
    sfx.shutter();
    if (score > this.best) {
      this.best = score;
      lfRun.photoGrade = fahai ? 'fahai' : light;
      await new Promise<void>((res) => this.snapshot(res));
    }
    const flash = this.add.rectangle(0, 0, W, H, 0xffffff, 0.85).setOrigin(0).setDepth(500);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
    const key: StrKey = fahai ? 'lf.t.fahai' : light === 'perfect' ? 'lf.t.perfect' : light === 'early' ? 'lf.t.early' : 'lf.t.late';
    const good = !fahai && light === 'perfect';
    const txt = this.add.text(W / 2, 250, t(key), baseStyle({ fontFamily: FONT_SERIF, fontSize: good ? '46px' : '30px', color: good ? '#ffe08a' : '#ffffff', fontStyle: 'bold', stroke: '#3a2030', strokeThickness: 7 })).setOrigin(0.5).setDepth(400);
    this.tweens.add({ targets: txt, y: 220, alpha: 0, delay: 1000, duration: 600, onComplete: () => txt.destroy() });
    if (good) {
      sfx.chime();
      this.shooting = false;
    } else if (this.shots <= 0) {
      await wait(this, 1200);
      this.shooting = false;
    }
  }

  private snapshot(done: () => void): void {
    const key = nextLfKey('sunset');
    const old = lfRun.photo;
    for (const o of this.hud) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    this.shotBtn?.container.setVisible(false);
    this.scene.setVisible(false, 'UI');
    this.game.renderer.snapshotArea(FRAME.x, FRAME.y, FRAME.w, FRAME.h, (img) => {
      this.scene.setVisible(true, 'UI');
      for (const o of this.hud) if (o.active) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(true);
      this.shotBtn?.container.setVisible(true);
      if (img instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          if (old && old !== key && this.textures.exists(old)) this.textures.remove(old);
          lfRun.photo = key;
        };
        if (img.complete) add();
        else img.onload = add;
      }
      done();
    });
  }

  // ---- 法海 photobombing -----------------------------------------------------------------------------

  private peek(): void {
    const spots = [
      { x: FRAME.x + 120 + Math.random() * (FRAME.w - 240), y: FRAME.y + FRAME.h + 70, tx: 0, ty: -150, a: 0 },
      { x: FRAME.x - 90, y: FRAME.y + 120 + Math.random() * 220, tx: 170, ty: 0, a: 90 },
      { x: FRAME.x + FRAME.w + 90, y: FRAME.y + 120 + Math.random() * 220, tx: -170, ty: 0, a: -90 },
      { x: FRAME.x + 140 + Math.random() * (FRAME.w - 280), y: -60, tx: 0, ty: 150, a: 180 },
    ];
    const s = spots[Math.floor(Math.random() * spots.length)];
    const img = this.add.image(s.x, s.y, 'lfFahaiPeek').setScale(0.85).setAngle(s.a).setDepth(15);
    const p: Peek = { img, out: false };
    img.setInteractive({ useHandCursor: true });
    img.on('pointerdown', () => this.shoo(p));
    this.peeks.push(p);
    sfx.tock();
    this.tweens.add({ targets: img, x: s.x + s.tx, y: s.y + s.ty, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: img, scaleX: 0.95, yoyo: true, repeat: 5, duration: 160, delay: 260 });
    this.time.delayedCall(2200, () => {
      if (p.out) return;
      p.out = true;
      this.tweens.add({ targets: img, x: s.x, y: s.y, duration: 240, onComplete: () => img.destroy() });
    });
  }

  private shoo(p: Peek): void {
    if (p.out || !this.shooting) return;
    p.out = true;
    lfRun.shoos += 1;
    sfx.blip();
    sfx.boing();
    const txt = this.add.text(p.img.x, p.img.y - 70, t('lf.t.ouch'), baseStyle({ fontSize: '26px', color: '#ffe08a', fontStyle: 'bold', stroke: '#3a2030', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
    p.img.disableInteractive();
    this.tweens.add({ targets: p.img, angle: p.img.angle + 720, scale: 0.1, alpha: 0, x: p.img.x + (p.img.x < W / 2 ? -200 : 200), y: p.img.y - 120, duration: 600, onComplete: () => p.img.destroy() });
  }

  private hidePeek(p: Peek): void {
    if (p.out) return;
    p.out = true;
    this.tweens.add({ targets: p.img, alpha: 0, duration: 200, onComplete: () => p.img.destroy() });
  }

  // ---- 法海 hides in a crab shell; the evening bell; goodbye ---------------------------------------

  private async crabEnding(dlg: Dialogue, lady: Phaser.GameObjects.Image): Promise<void> {
    const fh = this.add.image(260, 610, 'lfFahai').setOrigin(0.5, 1).setScale(0.78).setDepth(22).setAlpha(0);
    sfx.tock();
    await tweenP(this, { targets: fh, alpha: 1, y: 600, duration: 300 });
    await dlg.say('fahai', 'lf.t.f1');
    await dlg.say('white', 'lf.t.w3');
    await dlg.say('fahai', 'lf.t.f2');
    await dlg.say('koko', 'lf.t.k3');
    await dlg.say('fahai', 'lf.t.f3');
    dlg.hide();
    // poof! a very small monk in a crab shell
    sfx.poof();
    const poof = this.add.image(fh.x, fh.y - 90, 'lfPoof').setScale(0.4).setDepth(24);
    this.tweens.add({ targets: poof, scale: 1.8, alpha: 0, duration: 700, onComplete: () => poof.destroy() });
    fh.destroy();
    const crab = this.add.image(260, 566, 'lfCrabMonk').setScale(0.9).setDepth(23);
    await wait(this, 500);
    sfx.scuttle();
    this.tweens.add({ targets: crab, angle: 8, yoyo: true, repeat: -1, duration: 90 });
    await tweenP(this, { targets: crab, x: -80, duration: 1600, ease: 'Sine.easeIn' });
    crab.destroy();
    await dlg.say(null, 'lf.t.n2');
    await dlg.say('gogo', 'lf.t.g1');
    dlg.hide();
    // the evening bell from across the road
    for (let i = 0; i < 3; i++) {
      sfx.stone(98);
      await wait(this, 1500);
    }
    await dlg.say('white', 'lf.t.w4');
    await dlg.say('white', 'lf.t.w5');
    dlg.hide();
    // she floats away over the lake, towards the Broken Bridge
    sfx.shimmer();
    const trail = this.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        const sp = this.add.image(lady.x, lady.y - 80, 'lfSpark').setDepth(21).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: sp, alpha: 0, scale: 0.2, duration: 900, onComplete: () => sp.destroy() });
      },
    });
    this.tweens.killTweensOf(lady);
    await tweenP(this, { targets: lady, x: 300, y: 380, scale: 0.12, alpha: 0.2, duration: 3200, ease: 'Sine.easeInOut' });
    trail.remove();
    lady.destroy();
    await wait(this, 600);
  }

  update(time: number, delta: number): void {
    if (this.shooting) {
      const k = Math.min(1, (time - this.sunStart) / 1000 / SUN_TIME);
      this.sunY = SUN_FROM + (SUN_TO - SUN_FROM) * k;
      if (k >= 1) this.shooting = false;
      if (time > this.nextPeek) {
        this.peek();
        this.nextPeek = time + 2600 + Math.random() * 1800;
      }
    } else if (this.sunY < SUN_TO) {
      this.sunY = Math.min(SUN_TO, this.sunY + delta * 0.01);
    }
    this.sunset.setSun(this.sunY);
    this.sunset.update(time);
    for (const [i, b] of this.boats.entries()) b.x += (delta / 1000) * (6 + i * 3) * (i % 2 ? -1 : 1);
    for (const [i, b] of this.birds.entries()) {
      b.x += (delta / 1000) * (18 + i * 4);
      b.y += Math.sin(time * 0.002 + i) * 0.1;
      b.scaleY = 0.7 + Math.abs(Math.sin(time * 0.008 + i)) * 0.6;
      if (b.x > W + 30) b.x = -30;
    }
    this.peeks = this.peeks.filter((p) => p.img.active);
  }
}

import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { Willow, Wind } from './Willows';
import type { KiteKind } from './characters';
import { llRun } from './state';

const HUD = 300;
const FEET = 664;
/** Kites that only appear once you've dreamt the chapter they come from. */
const FRIEND_KITES: Record<string, KiteKind> = {
  shuangfeng: 'cow',
  pinghu: 'rabbit',
  huagang: 'koi',
  leifeng: 'crab',
  nanping: 'bell',
  duanqiao: 'umbrella',
  quyuan: 'lotus',
  sudi: 'peach',
  santan: 'lantern',
};
const BAND = { lo: 0.45, hi: 0.8 };

interface Flyer {
  img: Phaser.GameObjects.Image;
  kind: KiteKind;
  hand: () => { x: number; y: number };
  tail: number;
}

/** 大草坪: rescue GOGO's kite from the willow, choose a kite, run, and fly it up into the clouds. */
export class LiulangKiteScene extends Phaser.Scene {
  private wind = new Wind();
  private willow!: Willow;
  private lines!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private flyers: Flyer[] = [];
  private me!: Phaser.GameObjects.Graphics;
  private mom!: Phaser.GameObjects.Image;
  private mine: Flyer | null = null;
  private stuck: Phaser.GameObjects.Image | null = null;
  private rescuing = false;
  private holding = false;
  private phase: 'story' | 'run' | 'fly' | 'done' = 'story';
  private alt = 0;
  private tension = 0.3;
  private reel = 0.2;
  private strain = 0;
  private gustUntil = 0;
  private nextGust = 0;
  private toasts = new Set<string>();
  private streaks!: Phaser.GameObjects.Graphics;

  constructor() {
    super('LiulangKite');
  }

  create(): void {
    music.play('llKite');
    this.wind = new Wind();
    Object.assign(this, { flyers: [], mine: null, stuck: null, rescuing: false, holding: false, phase: 'story', alt: 0, tension: 0.3, reel: 0.2, strain: 0, gustUntil: 0, nextGust: 0 });
    this.toasts = new Set();
    this.add.image(0, 0, 'llLawn').setOrigin(0);
    this.willow = new Willow(this, 130, 600, 0.95, 5, 77, this.wind);
    this.willow.green = 1;
    this.streaks = this.add.graphics().setDepth(8);
    this.lines = this.add.graphics().setDepth(18);
    this.mom = this.add.image(380, FEET + 6, 'llMom').setOrigin(0.5, 1).setScale(0.36).setDepth(20);
    const kid = (who: 'me' | 'koko' | 'gogo', x: number) => {
      const g = this.add.graphics().setDepth(20);
      drawPerson(g, LOOKS[who], { facing: 1, armUp: true, backpack: who === 'me' });
      g.setPosition(x, FEET).setScale(0.95);
      return g;
    };
    this.me = kid('me', 600);
    const koko = kid('koko', 720);
    const gogo = kid('gogo', 820);
    this.hud = this.add.graphics().setDepth(HUD);
    // KOKO's centipede is already up; Mum's swallow goes up next
    this.flyers.push({ img: this.add.image(900, 160, 'llKite-centipede').setScale(0.22).setDepth(15), kind: 'centipede', hand: () => ({ x: koko.x + 23, y: koko.y - 120 }), tail: 0 });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => !overGlobalUI(p) && (this.holding = true));
    this.input.on('pointerup', () => (this.holding = false));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.rescuing || !p.isDown) return;
      this.willow.brush(p.x, p.y, p.velocity.x * 0.05 || (Math.random() - 0.5) * 30);
      if (Math.random() < 0.2) sfx.rustle();
      this.checkRescue(p.x, p.y);
    });
    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', () => {
      this.holding = true;
      if (this.rescuing && this.stuck) {
        for (let k = 0; k < 6; k++) this.willow.brush(this.stuck.x + (k - 3) * 16, this.stuck.y, k % 2 ? 40 : -40);
        sfx.rustle();
        this.checkRescue(this.stuck.x, this.stuck.y);
      }
    });
    kb?.on('keyup-SPACE', () => (this.holding = false));
    this.cameras.main.fadeIn(900, 240, 248, 236);
    void this.play(gogo);
  }

  private async play(gogo: Phaser.GameObjects.Graphics): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('mom', 'll.k.mom0');
    await dlg.say('gogo', 'll.k.g1');
    dlg.hide();
    // GOGO's butterfly goes up… and straight into the willow
    const bf = this.add.image(gogo.x - 20, gogo.y - 120, 'llKite-butterfly').setScale(0.2).setDepth(15);
    const gf: Flyer = { img: bf, kind: 'butterfly', hand: () => ({ x: gogo.x + 23, y: gogo.y - 120 }), tail: 0 };
    this.flyers.push(gf);
    await tweenP(this, { targets: bf, x: 520, y: 220, duration: 1200, ease: 'Sine.easeOut' });
    sfx.wind();
    await tweenP(this, { targets: bf, x: 170, y: 360, angle: -40, duration: 1000, ease: 'Sine.easeIn' });
    sfx.rustle();
    this.flyers = this.flyers.filter((f) => f !== gf);
    this.stuck = bf;
    this.tweens.add({ targets: bf, angle: -30, yoyo: true, repeat: -1, duration: 400 });
    await dlg.say('gogo', 'll.k.g2');
    await dlg.say('koko', 'll.k.k1');
    await dlg.say('mom', 'll.k.mom1');
    dlg.hide();
    // rescue: brush the strands aside
    const touch = this.sys.game.device.input.touch;
    const hint = this.hint(touch ? 'll.k.hintRescueTouch' : 'll.k.hintRescue');
    this.rescuing = true;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.rescuing && (ev.remove(), res()) });
    });
    hint.destroy();
    await dlg.say('gogo', 'll.k.g3');
    dlg.hide();
    // choose a kite
    const kind = await this.choose();
    llRun.kite = kind;
    // Mum sends her swallow up — she's done this before
    this.mom.setTexture('llMomKite');
    const sw = this.add.image(this.mom.x + 20, this.mom.y - 120, 'llKite-swallow').setScale(0.24).setDepth(15);
    this.flyers.push({ img: sw, kind: 'swallow', hand: () => ({ x: this.mom.x + 30, y: this.mom.y - 196 }), tail: 0 });
    this.tweens.add({ targets: sw, x: 640, y: 90, duration: 2200, ease: 'Sine.easeOut' });
    await dlg.say('mom', 'll.k.mom2');
    dlg.hide();
    // run with it!
    this.mine = { img: this.add.image(this.me.x, this.me.y - 120, `llKite-${kind}`).setScale(0.26).setDepth(16), kind, hand: () => ({ x: this.me.x + 23, y: this.me.y - 120 }), tail: 0 };
    this.flyers.push(this.mine);
    const runHint = this.hint(touch ? 'll.k.hintRunTouch' : 'll.k.hintRun');
    this.phase = 'run';
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => this.phase !== 'run' && (ev.remove(), res()) });
    });
    runHint.destroy();
    sfx.whee();
    this.toast('ll.k.up');
    const flyHint = this.hint(touch ? 'll.k.hintFlyTouch' : 'll.k.hintFly');
    this.nextGust = this.time.now + 5000;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => this.phase === 'done' && (ev.remove(), res()) });
    });
    flyHint.destroy();
    llRun.height = 100;
    // into the clouds… and the dream goes white
    sfx.chime();
    this.toast('ll.k.clouds');
    await tweenP(this, { targets: this.mine.img, y: -40, scale: 0.1, duration: 1800, ease: 'Sine.easeIn' });
    await dlg.say('me', 'll.k.m1');
    await dlg.say('mom', 'll.k.mom3');
    dlg.hide();
    this.cameras.main.fadeOut(2200, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LiulangEnd'));
  }

  private hint(key: StrKey): Phaser.GameObjects.Text {
    return i18nText(this, W / 2, H - 22, () => t(key), { fontSize: '19px', color: '#2f3b3a', backgroundColor: '#fdf8eecc', padding: { x: 12, y: 6 }, align: 'center', wordWrap: { width: W - 160, useAdvancedWrap: true } }).setOrigin(0.5, 1).setDepth(HUD);
  }

  private toast(key: StrKey): void {
    if (this.toasts.has(key)) return;
    this.toasts.add(key);
    const txt = this.add.text(W / 2, 200, t(key), baseStyle({ fontFamily: FONT_SERIF, fontSize: '34px', color: '#ffffff', fontStyle: 'bold', stroke: '#3a6a8a', strokeThickness: 7 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: 170, alpha: 0, delay: 1200, duration: 700, onComplete: () => txt.destroy() });
  }

  private checkRescue(x: number, y: number): void {
    if (!this.stuck || this.willow.parted < 0.45) return;
    if (Math.hypot(x - this.stuck.x, y - this.stuck.y) > 160) return;
    this.rescuing = false;
    llRun.rescued = true;
    const kite = this.stuck;
    this.stuck = null;
    this.tweens.killTweensOf(kite);
    sfx.chime();
    // out it comes — and up burst the orioles that were hiding in there
    this.tweens.add({ targets: kite, x: 820, y: 560, angle: 0, scale: 0.16, duration: 900, ease: 'Sine.easeInOut', onComplete: () => kite.destroy() });
    for (let i = 0; i < 5; i++) {
      const b = this.add.image(kite.x, kite.y, 'llOriole-up').setScale(0.3).setDepth(30);
      const flap = this.time.addEvent({ delay: 90, loop: true, callback: () => b.setTexture(b.texture.key === 'llOriole-up' ? 'llOriole-down' : 'llOriole-up') });
      this.tweens.add({ targets: b, x: 300 + i * 200, y: -40, duration: 1800 + i * 200, ease: 'Sine.easeIn', onComplete: () => { flap.remove(); b.destroy(); } });
    }
    sfx.oriole([{ f: 1760, long: false }, { f: 2093, long: true }], -0.6);
  }

  /** Pick a kite: three ordinary ones, plus one for each place you've already dreamt of. */
  private choose(): Promise<KiteKind> {
    const visited = new Set(getProgress().visited);
    const options: { kind: KiteKind; from?: string }[] = [{ kind: 'swallow' }, { kind: 'centipede' }, { kind: 'butterfly' }];
    for (const [id, kind] of Object.entries(FRIEND_KITES)) if (visited.has(id)) options.push({ kind, from: id });
    const layer = this.add.container(0, 0).setDepth(HUD + 10);
    const bg = this.add.graphics();
    bg.fillStyle(0x203040, 0.55);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0xfdf8ee, 0.96);
    bg.fillRoundedRect(110, 60, W - 220, H - 120, 26);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 110, () => t('ll.k.choose'), { fontFamily: FONT_SERIF, fontSize: '30px' }).setOrigin(0.5));
    const cols = Math.min(6, options.length);
    const rows = Math.ceil(options.length / cols);
    return new Promise((resolve) => {
      options.forEach((o, i) => {
        const cx = W / 2 + ((i % cols) - (cols - 1) / 2) * 160;
        const cy = 250 + Math.floor(i / cols) * (rows > 1 ? 190 : 0) + (rows === 1 ? 60 : 0);
        const img = this.add.image(cx, cy, `llKite-${o.kind}`).setScale(0.36).setInteractive({ useHandCursor: true });
        layer.add(img);
        layer.add(i18nText(this, cx, cy + 74, () => t(`ll.kite.${o.kind}` as StrKey), { fontSize: '16px' }).setOrigin(0.5));
        if (o.from) {
          const v = TEN_VIEWS.find((x) => x.id === o.from);
          layer.add(i18nText(this, cx, cy + 96, () => (v ? t(v.name) : ''), { fontSize: '13px', color: '#c0392b' }).setOrigin(0.5));
        }
        layer.add(this.add.text(cx - 58, cy - 64, `${i + 1}`, baseStyle({ fontSize: '14px', color: '#8a8478' })));
        const pick = () => {
          sfx.chime();
          layer.destroy(true);
          resolve(o.kind);
        };
        img.on('pointerover', () => img.setScale(0.4));
        img.on('pointerout', () => img.setScale(0.36));
        img.on('pointerup', pick);
        if (i < 9) this.input.keyboard?.once(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][i]}`, () => layer.active && pick());
      });
      if (options.length <= 3) layer.add(i18nText(this, W / 2, 520, () => t('ll.k.moreKites'), { fontSize: '16px', color: '#8a8478', align: 'center', wordWrap: { width: W - 320, useAdvancedWrap: true } }).setOrigin(0.5));
    });
  }

  // ---- frame ------------------------------------------------------------------------------------------

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.willow.update(time, dt);
    this.wind.prune(time);
    const mine = this.mine;
    if (this.phase === 'run' && mine) {
      // running pulls the kite up behind; stopping lets it sink
      if (this.holding) {
        this.me.x = Math.min(1080, this.me.x + dt * 220);
        this.me.y = FEET - Math.abs(Math.sin(time * 0.02)) * 6;
        this.alt = Math.min(0.3, this.alt + dt * 0.12);
      } else {
        this.alt = Math.max(0, this.alt - dt * 0.15);
        this.me.y = FEET;
      }
      if (this.alt >= 0.28) {
        this.phase = 'fly';
        this.me.y = FEET;
      }
    } else if (this.phase === 'fly' && mine) {
      // the wind: a gentle swell, with gusts
      if (time > this.nextGust) {
        this.gustUntil = time + 1600;
        this.nextGust = time + 5000 + Math.random() * 3500;
        sfx.wind();
      }
      const gust = time < this.gustUntil ? 0.45 : 0;
      const windNow = 0.45 + Math.sin(time * 0.0007) * 0.15 + gust;
      // holding reels in (tightens); letting go lets line out (slackens)
      this.reel = Phaser.Math.Clamp(this.reel + (this.holding ? 0.9 : -0.7) * dt, 0, 0.75);
      const target = Phaser.Math.Clamp(windNow * 0.55 + this.reel, 0, 1.2);
      this.tension += (target - this.tension) * Math.min(1, dt * 3);
      if (this.tension >= BAND.lo && this.tension <= BAND.hi) {
        this.alt = Math.min(1, this.alt + dt * 0.045);
        this.strain = Math.max(0, this.strain - dt);
      } else if (this.tension < 0.3) {
        this.alt = Math.max(0.2, this.alt - dt * 0.05);
      } else if (this.tension > 0.92) {
        this.strain += dt;
        if (this.strain > 1.1) {
          this.strain = 0;
          llRun.strains += 1;
          this.alt = Math.max(0.2, this.alt - 0.12);
          sfx.dig();
          this.toastRaw(t('ll.k.strain'));
        }
      }
      llRun.height = Math.round(this.alt * 100);
      if (this.alt > 0.35) this.toast('ll.k.willow');
      if (this.alt > 0.65) this.toast('ll.k.pagoda');
      if (this.alt >= 1) this.phase = 'done';
    }
    if (mine && this.phase !== 'done') {
      const h = mine.hand();
      const sway = Math.sin(time * 0.002) * 30 + (time < this.gustUntil ? Math.sin(time * 0.02) * 10 : 0);
      const x = this.phase === 'run' ? h.x - 120 - this.alt * 300 : 760 + this.alt * 220 + sway;
      const y = this.phase === 'run' ? h.y - this.alt * 500 : 560 - this.alt * 470 + Math.cos(time * 0.003) * 8;
      mine.img.x += (x - mine.img.x) * Math.min(1, dt * 4);
      mine.img.y += (y - mine.img.y) * Math.min(1, dt * 4);
      mine.img.setAngle(Math.sin(time * 0.004) * 8 + (this.tension < 0.3 ? Math.sin(time * 0.02) * 20 : 0) + (this.strain > 0.3 ? Math.sin(time * 0.06) * 14 : 0));
    }
    // the other kites drift and bob
    for (const f of this.flyers) {
      if (f === mine) continue;
      f.img.x += Math.sin(time * 0.0015 + f.tail) * 0.25;
      f.img.y += Math.cos(time * 0.002 + f.tail) * 0.15;
      f.img.setAngle(Math.sin(time * 0.003 + f.tail) * 6);
    }
    // the lines, sagging when slack; tails rippling
    const g = this.lines;
    g.clear();
    for (const f of this.flyers) {
      const h = f.hand();
      const k = f === mine ? this.tension : 0.6;
      const sag = (1.1 - Math.min(1, k)) * 140;
      g.lineStyle(1.3, 0xffffff, 0.85);
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 20; i++) {
        const u = i / 20;
        pts.push(new Phaser.Math.Vector2(h.x + (f.img.x - h.x) * u, h.y + (f.img.y - h.y) * u + Math.sin(u * Math.PI) * sag));
      }
      g.strokePoints(pts, false, false);
      // a ribbon tail, or a chain of centipede segments
      const tx = f.img.x;
      const ty = f.img.y + f.img.displayHeight * 0.4;
      if (f.kind === 'centipede') {
        for (let s = 1; s < 10; s++) {
          const sx = tx - s * 16;
          const sy = ty - 10 + Math.sin(time * 0.006 - s * 0.7) * 8 + s * 4;
          g.fillStyle(s % 2 ? 0xe0602a : 0xffd27a, 1);
          g.fillCircle(sx, sy, 9 - s * 0.5);
          g.lineStyle(1, 0x3a2a22, 0.7);
          g.strokeCircle(sx, sy, 9 - s * 0.5);
        }
      } else {
        for (const [off, col] of [[-8, 0xe84a4a], [8, 0x4a8ae8]] as const) {
          const rp: Phaser.Math.Vector2[] = [];
          for (let s = 0; s <= 10; s++) rp.push(new Phaser.Math.Vector2(tx + off + Math.sin(time * 0.008 - s * 0.6) * (3 + s), ty + s * 9));
          g.lineStyle(3, col, 0.9);
          g.strokePoints(rp, false, false);
        }
      }
    }
    // wind streaks during gusts
    const st = this.streaks;
    st.clear();
    if (time < this.gustUntil) {
      for (let i = 0; i < 12; i++) {
        const y = 80 + ((i * 53) % 380);
        const x = ((time * 0.9 + i * 211) % (W + 300)) - 150;
        st.lineStyle(2, 0xffffff, 0.5);
        st.lineBetween(x, y, x + 90, y + 4);
      }
    }
    // HUD while flying: height and line tension
    const hg = this.hud;
    hg.clear();
    if (this.phase === 'fly') {
      const bx = W - 60;
      hg.fillStyle(0x203040, 0.35);
      hg.fillRoundedRect(bx - 8, 120, 16, 360, 8);
      hg.fillStyle(0xffffff, 1);
      hg.fillCircle(bx, 120, 14);
      hg.fillStyle(0xe84a4a, 1);
      hg.fillCircle(bx, 480 - this.alt * 360, 9);
      const tx0 = W / 2 - 160;
      const ty = 596;
      hg.fillStyle(0x203040, 0.4);
      hg.fillRoundedRect(tx0 - 6, ty - 10, 332, 20, 10);
      hg.fillStyle(0x8ae07a, 0.55);
      hg.fillRect(tx0 + 320 * BAND.lo, ty - 6, 320 * (BAND.hi - BAND.lo), 12);
      hg.fillStyle(this.tension > 0.92 ? 0xe84a4a : this.tension < 0.3 ? 0x9aa8b8 : 0xffffff, 1);
      hg.fillCircle(tx0 + 320 * Math.min(1, this.tension), ty, 9);
    }
  }

  private toastRaw(s: string): void {
    const txt = this.add.text(W / 2, 240, s, baseStyle({ fontSize: '26px', color: '#ffe0d0', fontStyle: 'bold', stroke: '#8a2a1a', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: 210, alpha: 0, delay: 700, duration: 600, onComplete: () => txt.destroy() });
  }
}

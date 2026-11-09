import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { rng } from '../art/paint';
import { Shimmer } from './Shimmer';
import { phRun } from './state';

const HUD = 300;
const CENTER = { x: W / 2, y: 360 };
const LANES = [230, 370, 510];
const LEAF_X = 930;

interface Wave {
  g: Phaser.GameObjects.Graphics;
  x: number;
  lane: number;
}

/** Leaning on a pavilion railing: smooth the water until the piece of moon is whole. */
export class PinghuCalmScene extends Phaser.Scene {
  private level = 0;
  private rough = 0.85;
  private calmFor = 0;
  private active = false;
  private done = false;
  private shard!: Shimmer;
  private lamps: Shimmer[] = [];
  private trail!: Phaser.GameObjects.Graphics;
  private trailPts: { x: number; y: number; t: number }[] = [];
  private meter!: Phaser.GameObjects.Graphics;
  private last: { x: number; y: number; t: number } | null = null;
  private lastWarn = 0;
  private startTime = 0;
  private fish: { img: Phaser.GameObjects.Image; jumpAt: number } | null = null;
  private waves: Wave[] = [];
  private leaf: Phaser.GameObjects.Image | null = null;
  private ripplesTile!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('PinghuCalm');
  }

  create(): void {
    music.play('phCalm');
    this.level = Math.min(2, phRun.level);
    this.rough = 0.85;
    this.calmFor = 0;
    this.active = false;
    this.done = false;
    this.trailPts = [];
    this.fish = null;
    this.waves = [];
    this.leaf = null;
    this.last = null;
    this.lamps = [];

    const r = rng(5 + this.level);
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x10204a, 0x10204a, 0x050a1c, 0x050a1c, 1);
    g.fillRect(0, 0, W, H);
    this.ripplesTile = this.add.tileSprite(0, 0, W, H, 'ripples').setOrigin(0).setDepth(1).setAlpha(0.2);
    // stars reflected in the water
    for (let i = 0; i < 60; i++) this.add.image(r() * W, r() * H, 'phStar').setDepth(2).setAlpha(0.2 + r() * 0.4);
    // reflections of the pavilion's lanterns
    for (const [x, y] of [[260, 200], [1020, 230], [180, 520]]) {
      this.add.image(x, y, 'phHalo').setScale(0.6).setTint(0xffb36b).setAlpha(0.5).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
    }
    this.add.image(CENTER.x, CENTER.y, 'phHalo').setScale(1.8).setAlpha(0.45).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
    this.shard = new Shimmer(this, CENTER.x, CENTER.y, `phShard${this.level}`, { depth: 5, strips: 34 });
    this.shard.scaleX = 1.1;
    this.shard.scaleY = 1.1;
    this.trail = this.add.graphics().setDepth(6).setBlendMode(Phaser.BlendModes.ADD);

    // the pavilion's railing along the bottom, and the eaves overhead
    const rail = this.add.graphics().setDepth(50);
    rail.fillStyle(0x2a2f40, 1);
    rail.fillRect(0, H - 64, W, 64);
    rail.fillStyle(0xc6cad2, 1);
    rail.fillRect(0, H - 70, W, 12);
    for (let x = 30; x < W; x += 120) {
      rail.fillStyle(0x9a9ea8, 1);
      rail.fillRect(x - 10, H - 84, 20, 84);
      rail.fillStyle(0xe2e4ea, 1);
      rail.fillRect(x - 12, H - 88, 24, 8);
    }
    rail.fillStyle(0x10141f, 0.9);
    rail.fillTriangle(0, 0, 360, 0, 0, 90);
    rail.fillTriangle(W, 0, W - 360, 0, W, 90);

    this.meter = this.add.graphics().setDepth(HUD);
    i18nText(this, W / 2, 40, () => t('ph.c.title'), { fontFamily: FONT_SERIF, fontSize: '30px', color: '#fff3c4' }).setOrigin(0.5).setDepth(HUD);
    i18nText(this, W / 2, 80, () => t('ph.c.hint'), { fontSize: '17px', color: '#dfe6f2' }).setOrigin(0.5).setDepth(HUD);
    i18nText(this, W - 300, H - 30, () => t('ph.c.calm'), { fontSize: '18px', color: '#dfe6f2' }).setOrigin(1, 0.5).setDepth(HUD + 1);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p)) return;
      this.last = { x: p.x, y: p.y, t: this.time.now };
      // shoo the fish away
      if (this.fish && Math.hypot(p.x - this.fish.img.x, p.y - this.fish.img.y) < 70) {
        const f = this.fish;
        this.fish = null;
        sfx.blip();
        this.toast('ph.c.fishGone');
        this.tweens.add({ targets: f.img, x: f.img.x + (Math.random() < 0.5 ? -600 : 600), alpha: 0, duration: 700, onComplete: () => f.img.destroy() });
      }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.stroke(p));
    this.input.on('pointerup', () => (this.last = null));

    if (this.level === 2) {
      this.leaf = this.add.image(LEAF_X, LANES[1], 'hgPad').setScale(1.5).setDepth(20).setTint(0x7fa88a).setInteractive({ draggable: true, useHandCursor: true });
      this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, _x: number, y: number) => {
        obj.y = Phaser.Math.Clamp(y, LANES[0] - 40, LANES[2] + 40);
      });
    }

    this.cameras.main.fadeIn(800, 6, 10, 24);
    void this.script();
  }

  private toast(key: StrKey, color = '#fff3c4'): void {
    const txt = this.add.text(W / 2, 150, t(key), baseStyle({ fontSize: '24px', color, fontStyle: 'bold', stroke: '#0b1430', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD + 5);
    this.tweens.add({ targets: txt, alpha: 0, y: 130, delay: 1200, duration: 500, onComplete: () => txt.destroy() });
  }

  private ring(x: number, y: number, s = 1): void {
    const ring = this.add.image(x, y, 'hgRing').setScale(0.2 * s).setDepth(7).setAlpha(0.8);
    this.tweens.add({ targets: ring, scale: 2.2 * s, alpha: 0, duration: 1400, onComplete: () => ring.destroy() });
  }

  /** Slow strokes smooth the water; fast ones stir it up. */
  private stroke(p: Phaser.Input.Pointer): void {
    if (!this.active || !p.isDown || !this.last || overGlobalUI(p)) return;
    if (this.leaf && this.input.getDragState(p) > 0) return;
    const now = this.time.now;
    const dist = Math.hypot(p.x - this.last.x, p.y - this.last.y);
    const dt = Math.max(1, now - this.last.t);
    const speed = (dist / dt) * 1000;
    this.last = { x: p.x, y: p.y, t: now };
    if (speed > 1300) {
      this.rough = Math.min(1, this.rough + dist * 0.0005);
      if (now - this.lastWarn > 1500) {
        this.lastWarn = now;
        this.toast('ph.c.tooFast', '#ffb3b3');
        this.ring(p.x, p.y, 0.8);
      }
    } else if (speed > 20) {
      this.rough = Math.max(0, this.rough - dist * 0.00042);
      this.trailPts.push({ x: p.x, y: p.y, t: now });
    }
  }

  private async script(): Promise<void> {
    await wait(this, 700);
    const dlg = new Dialogue(this);
    if (this.level === 0) {
      await dlg.say('gogo', 'ph.c.g1');
      dlg.hide();
      // GOGO's net goes in with a splash
      sfx.bigSplash();
      for (let i = 0; i < 3; i++) this.ring(CENTER.x + (i - 1) * 60, CENTER.y, 1.2);
      this.rough = 1;
      this.cameras.main.shake(300, 0.006);
      await wait(this, 700);
      await dlg.say('koko', 'ph.c.k1');
      await dlg.say('rabbit', 'ph.c.r1');
      dlg.hide();
    }
    this.active = true;
    this.startTime = this.time.now;
    // the troubles, one kind per piece
    if (this.level === 0) this.time.addEvent({ delay: 5200, loop: true, callback: () => this.gust() });
    if (this.level === 1) {
      this.toast('ph.c.fish');
      this.time.addEvent({ delay: 4800, loop: true, startAt: 3000, callback: () => this.spawnFish() });
    }
    if (this.level === 2) {
      this.toast('ph.c.boat');
      this.time.addEvent({ delay: 4200, loop: true, startAt: 2000, callback: () => this.spawnWave() });
    }
    await new Promise<void>((resolve) => {
      const ev = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (this.done) {
            ev.remove();
            resolve();
          }
        },
      });
    });
    // whole and bright: it rises out of the water and drifts to the middle of the lake
    phRun.calmTime += Math.round((this.time.now - this.startTime) / 1000);
    this.active = false;
    sfx.chime();
    this.toast('ph.c.got');
    this.shard.rough = 0;
    const glow = this.add.image(CENTER.x, CENTER.y, 'phHalo').setScale(1).setDepth(8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.tweens.add({ targets: glow, alpha: 1, scale: 2.4, duration: 900 });
    await wait(this, 1400);
    this.tweens.add({ targets: this.shard, y: -200, scaleX: 0.3, scaleY: 0.3, duration: 1400, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: glow, y: -200, alpha: 0, duration: 1400, ease: 'Sine.easeIn' });
    await wait(this, 1200);
    phRun.level += 1;
    if (phRun.level < 3) {
      await dlg.say('rabbit', phRun.level === 1 ? 'ph.c.r2' : 'ph.c.r3');
      dlg.hide();
    }
    this.cameras.main.fadeOut(800, 6, 10, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(phRun.level < 3 ? 'PinghuBridge' : 'PinghuMoon'));
  }

  private gust(): void {
    if (!this.active) return;
    this.toast('ph.c.wind', '#dfe6f2');
    sfx.wind();
    this.rough = Math.min(1, this.rough + 0.2);
    const g = this.add.graphics().setDepth(9);
    for (let i = 0; i < 8; i++) {
      g.lineStyle(2, 0xdfe6f2, 0.5);
      const y = 140 + Math.random() * 440;
      g.lineBetween(-200 + Math.random() * 100, y, 0, y - 6);
    }
    this.tweens.add({ targets: g, x: W + 300, alpha: 0, duration: 1600, onComplete: () => g.destroy() });
  }

  private spawnFish(): void {
    if (!this.active || this.fish) return;
    const x = CENTER.x + (Math.random() - 0.5) * 500;
    const y = CENTER.y + (Math.random() - 0.5) * 300;
    const img = this.add.image(x, y, 'phFish').setDepth(4).setAlpha(0).setScale(1.2).setAngle(Math.random() * 360);
    this.tweens.add({ targets: img, alpha: 1, duration: 500 });
    this.fish = { img, jumpAt: this.time.now + 2400 };
  }

  private spawnWave(): void {
    if (!this.active) return;
    const lane = Math.floor(Math.random() * 3);
    const g = this.add.graphics().setDepth(9);
    this.waves.push({ g, x: W + 40, lane });
  }

  update(time: number, delta: number): void {
    const sec = Math.min(delta, 50) / 1000;
    this.ripplesTile.tilePositionX = time * 0.02 * this.rough;
    this.ripplesTile.setAlpha(0.05 + 0.25 * this.rough);
    if (this.active) this.rough = Math.max(0, this.rough - sec * 0.01);
    this.shard.rough = this.rough;
    this.shard.alpha = 0.55 + 0.45 * (1 - this.rough);
    this.shard.update(time);
    for (const l of this.lamps) l.update(time);

    // the fish jumps if not shooed away in time
    if (this.fish && time > this.fish.jumpAt) {
      const f = this.fish;
      this.fish = null;
      sfx.bigSplash();
      this.toast('ph.c.splash', '#bff4ff');
      this.ring(f.img.x, f.img.y, 1.4);
      this.ring(f.img.x, f.img.y, 0.8);
      this.rough = Math.min(1, this.rough + 0.45);
      f.img.destroy();
    }
    // the boat's wake rolls in from the right
    for (const w of this.waves) {
      w.x -= 170 * sec;
      const y = LANES[w.lane];
      w.g.clear();
      for (let k = 0; k < 3; k++) {
        w.g.lineStyle(3 - k * 0.7, 0xdfe6f2, 0.6 - k * 0.15);
        w.g.beginPath();
        w.g.arc(w.x + k * 26 + 80, y, 80, Math.PI * 0.75, Math.PI * 1.25, false);
        w.g.strokePath();
      }
      if (this.leaf && w.x < LEAF_X && w.x > LEAF_X - 30 && Math.abs(this.leaf.y - y) < 75) {
        w.x = -9999;
        this.toast('ph.c.blocked', '#bff4ff');
        sfx.splash();
      }
      if (w.x < CENTER.x + 120 && w.x > -999) {
        this.rough = Math.min(1, this.rough + 0.35);
        this.ring(CENTER.x + 60, y, 1);
        w.x = -9999;
      }
    }
    this.waves = this.waves.filter((w) => {
      if (w.x < -999) {
        w.g.destroy();
        return false;
      }
      return true;
    });

    // the soothing trail of the finger
    const g = this.trail;
    g.clear();
    this.trailPts = this.trailPts.filter((p) => time - p.t < 700);
    for (const p of this.trailPts) {
      const k = 1 - (time - p.t) / 700;
      g.fillStyle(0xbfe0ff, 0.12 * k);
      g.fillCircle(p.x, p.y, 26 * (1.4 - k));
    }

    // calm meter
    const m = this.meter;
    m.clear();
    m.fillStyle(0x0b1430, 0.7);
    m.fillRoundedRect(W - 286, H - 44, 250, 28, 12);
    m.fillStyle(this.rough < 0.1 ? 0xfff3c4 : 0x7fb0e0, 1);
    m.fillRoundedRect(W - 282, H - 40, 242 * (1 - this.rough), 20, 10);

    if (this.active && !this.done) {
      if (this.rough < 0.1) this.calmFor += sec;
      else this.calmFor = 0;
      if (this.calmFor > 1.5) this.done = true;
    }
  }
}

import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, getLang } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { rng } from '../art/paint';
import { NightLake, HORIZON, RAIL_Y } from './NightLake';
import { Shimmer } from './Shimmer';
import { phRun, nextPhKey } from './state';

const HUD = 300;
const POOL = { x: W / 2, y: 470 };
const SKY_MOON = { x: W / 2, y: 150 };
const BPM = 92;
const BEAT = 60000 / BPM;
const TRAVEL = 1500;
/** D 宫 pentatonic: 宫 商 角 徵 羽, one per railing post. */
const NOTES = [587.3, 659.3, 740.0, 880.0, 987.8];
const KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;

interface Note {
  lane: number;
  time: number;
  orb: Phaser.GameObjects.Image | null;
  judged: boolean;
}

/** A short, singable chart: a pentatonic melody that wanders and comes home. */
function chart(start: number): Note[] {
  const r = rng(92);
  const notes: Note[] = [];
  let lane = 2;
  const beats = 52;
  for (let b = 2; b < beats; b++) {
    const phraseEnd = b % 8 === 7;
    if (phraseEnd) continue; // breathe at the end of each phrase
    if (r() < 0.82 || b % 4 === 0) {
      lane = Phaser.Math.Clamp(lane + [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)], 0, 4);
      if (b % 8 === 6) lane = b % 16 === 14 ? 0 : 2; // phrases settle on 宫 or 角
      notes.push({ lane, time: start + b * BEAT, orb: null, judged: false });
    }
    if (r() < 0.22 && b % 8 < 5) {
      lane = Phaser.Math.Clamp(lane + (r() < 0.5 ? -1 : 1), 0, 4);
      notes.push({ lane, time: start + (b + 0.5) * BEAT, orb: null, judged: false });
    }
  }
  return notes;
}

/** The terrace of 御书楼: call the moon out of the lake on the stone railing. */
export class PinghuMoonScene extends Phaser.Scene {
  private lake!: NightLake;
  private reflection!: Shimmer;
  private moon!: Phaser.GameObjects.Image;
  private halo!: Phaser.GameObjects.Image;
  private posts: { x: number; y: number; flash: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text }[] = [];
  private notes: Note[] = [];
  private songStart = 0;
  private songEnd = 0;
  private playing = false;
  private nextBeat = 0;
  private progress = 0;

  constructor() {
    super('PinghuMoon');
  }

  create(): void {
    music.play('phCalm');
    this.posts = [];
    this.notes = [];
    this.playing = false;
    this.progress = 0;
    this.lake = new NightLake(this, { posts: 6 });
    // the whole moon, still under the water
    this.reflection = new Shimmer(this, POOL.x, POOL.y, 'phMoon', { depth: -50, strips: 30 });
    this.reflection.scaleX = 0.7;
    this.reflection.scaleY = 0.45;
    this.reflection.alpha = 0;
    this.reflection.rough = 0.6;
    this.moon = this.add.image(POOL.x, HORIZON + 60, 'phMoon').setDepth(-95).setScale(0.55).setAlpha(0);
    this.halo = this.add.image(this.moon.x, this.moon.y, 'phHalo').setDepth(-96).setScale(2).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    // the five posts in the middle of the railing are the instrument
    for (let i = 0; i < 5; i++) {
      const p = this.lake.posts[i + 1];
      const flash = this.add.image(p.x, p.y + 10, 'phHalo').setScale(0.5).setDepth(45).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      const label = this.add.text(p.x, RAIL_Y + 50, String(i + 1), baseStyle({ fontSize: '22px', color: '#fff3c4', fontStyle: 'bold' })).setOrigin(0.5).setDepth(46).setAlpha(0);
      this.posts.push({ x: p.x, y: p.y, flash, label });
    }
    const rabbit = this.add.image(this.lake.posts[3].x, RAIL_Y - 66, 'phRabbit').setDepth(44).setScale(0.8).setData('base', RAIL_Y - 66);
    this.rabbit = rabbit;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.playing || overGlobalUI(p)) return;
      let best = -1;
      let bd = 110;
      this.posts.forEach((q, i) => {
        const d = Math.abs(p.x - q.x);
        if (d < bd && p.y > RAIL_Y - 160) {
          bd = d;
          best = i;
        }
      });
      if (best >= 0) this.hit(best);
    });
    KEYS.forEach((k, i) => this.input.keyboard?.on(`keydown-${k}`, () => this.playing && this.hit(i)));
    this.cameras.main.fadeIn(900, 6, 10, 24);
    void this.play();
  }

  private rabbit!: Phaser.GameObjects.Image;

  private async play(): Promise<void> {
    // the three pieces drift together in the middle of the lake
    const pieces = [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2;
      return this.add.image(POOL.x + Math.cos(a) * 300, POOL.y + Math.sin(a) * 80, `phShard${i}`).setScale(0.7, 0.45).setDepth(-49).setAlpha(0.8).setFlipY(true);
    });
    await wait(this, 600);
    sfx.shimmer();
    await tweenP(this, { targets: pieces, x: POOL.x, y: POOL.y, duration: 1800, ease: 'Sine.easeInOut' });
    pieces.forEach((p) => p.destroy());
    this.reflection.alpha = 0.75;
    sfx.chime();
    await narrate(this, [{ key: 'ph.q.n1' }], { y: 140, size: 28, depth: 600, hintY: 200 });
    const dlg = new Dialogue(this);
    await dlg.say('rabbit', 'ph.q.r1');
    await dlg.say('rabbit', 'ph.q.r2');
    dlg.hide();

    // the song
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 48, () => t(touch ? 'ph.q.hintTouch' : 'ph.q.hintKeys'), { fontSize: '20px', color: '#fff3c4' }).setOrigin(0.5).setDepth(HUD);
    for (const p of this.posts) p.label.setAlpha(touch ? 0 : 0.9);
    music.stop();
    const ready = this.add.text(W / 2, 220, t('ph.q.ready'), baseStyle({ fontFamily: FONT_SERIF, fontSize: '40px', color: '#fff3c4' })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: ready, alpha: 0, delay: 1800, duration: 500 });
    this.songStart = this.time.now + 2400;
    this.notes = chart(this.songStart);
    this.songEnd = this.notes[this.notes.length - 1].time + 1200;
    this.nextBeat = this.songStart;
    this.playing = true;
    await new Promise<void>((resolve) => {
      const ev = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (this.time.now > this.songEnd) {
            ev.remove();
            resolve();
          }
        },
      });
    });
    this.playing = false;
    hint.destroy();
    for (const p of this.posts) p.label.setAlpha(0);

    // whatever the score, the moon comes all the way out
    music.play('phMoon');
    sfx.shimmer();
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: this.progress,
        to: 1,
        duration: 2200,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => this.setProgress(tw.getValue() ?? 1),
        onComplete: () => resolve(),
      });
    });
    await dlg.say('koko', 'ph.q.k1');
    dlg.hide();
    await this.couplet();
    this.snapshot();
    await wait(this, 600);
    await dlg.say('rabbit', 'ph.q.r3');
    // the rabbit hops up a path of moonlight and goes home
    const path = this.add.graphics().setDepth(-48).setBlendMode(Phaser.BlendModes.ADD);
    path.fillStyle(0xfff3c4, 0.18);
    path.fillTriangle(SKY_MOON.x - 30, SKY_MOON.y + 60, SKY_MOON.x + 30, SKY_MOON.y + 60, this.rabbit.x, this.rabbit.y);
    path.setAlpha(0);
    this.tweens.add({ targets: path, alpha: 1, duration: 600 });
    await dlg.say('rabbit', 'ph.q.r4');
    await dlg.say('gogo', 'ph.q.g1');
    dlg.hide();
    sfx.whee();
    await tweenP(this, { targets: this.rabbit, x: SKY_MOON.x, y: SKY_MOON.y + 40, scale: 0.2, alpha: 0, duration: 1800, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: path, alpha: 0, duration: 600 });
    await wait(this, 600);
    this.cameras.main.fadeOut(1200, 10, 16, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('PinghuEnd'));
  }

  /** The famous couplet, written down the two sides like a real one. */
  private async couplet(): Promise<void> {
    const zh = getLang() === 'zh';
    const style = baseStyle({ fontFamily: FONT_SERIF, fontSize: zh ? '40px' : '24px', color: '#fff3c4', align: 'center', lineSpacing: zh ? 6 : 8 });
    const a = this.add.text(zh ? W - 90 : W / 2, zh ? 250 : 90, zh ? Array.from(t('ph.q.couplet1')).join('\n') : t('ph.q.couplet1'), style).setOrigin(0.5).setDepth(HUD).setAlpha(0);
    const b = this.add.text(zh ? 90 : W / 2, zh ? 250 : 126, zh ? Array.from(t('ph.q.couplet2')).join('\n') : t('ph.q.couplet2'), style).setOrigin(0.5).setDepth(HUD).setAlpha(0);
    sfx.bell();
    await tweenP(this, { targets: a, alpha: 1, duration: 1200 });
    sfx.bell();
    await tweenP(this, { targets: b, alpha: 1, duration: 1200 });
    await wait(this, 1600);
  }

  private snapshot(): void {
    const key = nextPhKey('mirror');
    // keep the music / language buttons out of the photo
    this.scene.setVisible(false, 'UI');
    this.game.renderer.snapshotArea(0, 0, W, H, (img) => {
      this.scene.setVisible(true, 'UI');
      if (img instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          phRun.photoMirror = key;
        };
        if (img.complete) add();
        else img.onload = add;
      }
    });
  }

  private hit(lane: number): void {
    const now = this.time.now;
    let best: Note | null = null;
    let bd = 230;
    for (const n of this.notes) {
      if (n.judged || n.lane !== lane) continue;
      const d = Math.abs(n.time - now);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    const post = this.posts[lane];
    this.tweens.add({ targets: post.flash, alpha: { from: best ? 0.9 : 0.3, to: 0 }, scale: { from: 0.5, to: 0.9 }, duration: 400 });
    if (!best) return;
    best.judged = true;
    best.orb?.destroy();
    best.orb = null;
    sfx.stone(NOTES[lane]);
    const perfect = bd < 110;
    if (perfect) phRun.perfect += 1;
    else phRun.good += 1;
    this.pop(t(perfect ? 'ph.q.perfect' : 'ph.q.good'), post.x, post.y - 60, perfect ? '#fff3c4' : '#bfe0ff');
    this.setProgress(Math.min(1, (phRun.perfect + phRun.good * 0.7) / Math.max(1, this.notes.length)));
  }

  private pop(text: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, text, baseStyle({ fontSize: '22px', color, fontStyle: 'bold', stroke: '#0b1430', strokeThickness: 4 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
  }

  /** 0 = the moon still in the water, 1 = high in the sky with a perfect reflection. */
  private setProgress(k: number): void {
    this.progress = k;
    this.moon.setAlpha(Math.min(1, k * 1.6));
    this.moon.y = HORIZON + 40 - (HORIZON + 40 - SKY_MOON.y) * k;
    this.moon.setScale(0.5 + 0.12 * k);
    this.halo.setPosition(this.moon.x, this.moon.y).setAlpha(k * 0.9).setScale(1.6 + k * 1.2);
    // the reflection mirrors the moon above the horizon, and the water grows still
    this.reflection.y = POOL.y + (2 * HORIZON - SKY_MOON.y + 20 - POOL.y) * k;
    this.reflection.rough = 0.6 * (1 - k);
    this.reflection.alpha = 0.75 + 0.25 * k;
    this.reflection.scaleX = this.moon.scaleX * 1.1;
    this.reflection.scaleY = this.moon.scaleY * 0.8;
    this.lake.calm = k;
    this.lake.setBrightness(k);
  }

  update(time: number): void {
    this.lake.update(time);
    this.reflection.update(time);
    this.rabbit.y = (this.rabbit.getData('base') as number) + (this.playing ? -Math.abs(Math.sin(((time - this.songStart) / BEAT) * Math.PI)) * 10 : 0);
    if (!this.playing) return;
    // keep time: a tick on every beat, a low note at each bar
    while (time >= this.nextBeat && this.nextBeat < this.songEnd - 600) {
      const beat = Math.round((this.nextBeat - this.songStart) / BEAT);
      sfx.tick(beat % 4 === 0);
      if (beat % 4 === 0) sfx.bassPluck([146.8, 110, 123.5, 98][Math.floor(beat / 4) % 4]);
      this.nextBeat += BEAT;
    }
    // moonlight travels from the moon in the water to each post
    for (const n of this.notes) {
      if (n.judged) continue;
      const k = 1 - (n.time - time) / TRAVEL;
      if (k < 0) continue;
      if (!n.orb) n.orb = this.add.image(POOL.x, POOL.y, 'phHalo').setDepth(42).setScale(0.25).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff3c4);
      const post = this.posts[n.lane];
      const e = Math.min(1.1, k);
      n.orb.setPosition(POOL.x + (post.x - POOL.x) * e, POOL.y + (post.y + 10 - POOL.y) * e).setScale(0.15 + 0.25 * e).setAlpha(Math.min(1, k * 3));
      if (time - n.time > 230) {
        n.judged = true;
        n.orb.destroy();
        n.orb = null;
        phRun.miss += 1;
      }
    }
  }
}

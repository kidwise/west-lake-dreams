import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t } from '../core/i18n';
import { sfx, type WhistleNote } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { Willow, Wind } from './Willows';
import { llRun, nextLlKey } from './state';

const HUD = 300;
const TREES = [150, 390, 640, 890, 1130];
const GROUND = 478;
const LONG_MS = 280;
const ROUND_LEN = [3, 3, 4, 4, 5];

/** 闻莺: listen for the oriole, find it in the willows, and whistle its song back. */
export class LiulangOrioleScene extends Phaser.Scene {
  private wind = new Wind();
  private willows: Willow[] = [];
  private spring!: Phaser.GameObjects.Image;
  private target = -1;
  private searching = false;
  private wrongShown = new Set<number>();
  private listening = false;
  private pressAt = 0;
  private stopTone: (() => void) | null = null;
  private heard: boolean[] = [];
  private song: WhistleNote[] = [];
  private resolveSong: ((ok: boolean) => void) | null = null;
  private bird: Phaser.GameObjects.Image | null = null;
  private pattern: Phaser.GameObjects.Graphics | null = null;
  private glintAt = 0;
  private prev: { x: number; y: number } | null = null;
  private countText!: Phaser.GameObjects.Text;
  private perched: Phaser.GameObjects.Image[] = [];
  private flock: { img: Phaser.GameObjects.Image; vx: number; vy: number; flap: number }[] = [];

  constructor() {
    super('LiulangOriole');
  }

  create(): void {
    music.play('llEarly');
    this.wind = new Wind();
    this.wind.base = 0.7;
    Object.assign(this, { target: -1, searching: false, listening: false, stopTone: null, bird: null, pattern: null, prev: null });
    this.wrongShown = new Set();
    this.perched = [];
    this.flock = [];
    this.add.image(0, 0, 'llParkBare').setOrigin(0);
    this.spring = this.add.image(0, 0, 'llParkSpring').setOrigin(0).setAlpha(0).setDepth(0.5);
    this.willows = TREES.map((x, i) => new Willow(this, x, GROUND, [0.7, 0.64, 0.74, 0.66, 0.72][i], 5 + i * 0.01, 30 + i, this.wind));
    // Mum and the three of us, watching from the lawn
    this.add.image(1180, H + 8, 'llMom').setOrigin(0.5, 1).setScale(0.3).setDepth(40);
    ([['me', 1090], ['koko', 1010], ['gogo', 940]] as const).forEach(([who, x]) => {
      const g = this.add.graphics().setDepth(40);
      drawPerson(g, LOOKS[who], { facing: -1, backpack: who === 'me' });
      g.setPosition(x, H - 4).setScale(0.75);
    });
    i18nText(this, 36, 38, () => t('ll.o.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#2f3b3a', stroke: '#ffffff', strokeThickness: 4 }).setDepth(HUD);
    this.countText = this.add.text(36, 74, '', baseStyle({ fontSize: '20px', color: '#2f3b3a', stroke: '#ffffff', strokeThickness: 4 })).setDepth(HUD);
    this.updateCount();
    // brushing strands aside with the pointer
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || overGlobalUI(p)) return;
      const dx = this.prev ? p.x - this.prev.x : 0;
      this.prev = { x: p.x, y: p.y };
      if (!this.searching) return;
      this.willows.forEach((w, i) => {
        if (w.covers(p.x, p.y)) {
          w.brush(p.x, p.y, dx);
          if (Math.abs(dx) > 4 && Math.random() < 0.3) sfx.rustle();
          this.checkParted(i);
        }
      });
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p)) return;
      this.prev = { x: p.x, y: p.y };
      this.noteDown();
    });
    this.input.on('pointerup', () => {
      this.prev = null;
      this.noteUp();
    });
    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', (e: KeyboardEvent) => !e.repeat && this.noteDown());
    kb?.on('keyup-SPACE', () => this.noteUp());
    // number keys part a tree, for those without a pointer
    (['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const).forEach((k, i) =>
      kb?.on(`keydown-${k}`, () => {
        if (!this.searching) return;
        const w = this.willows[i];
        const h = w.heart();
        for (let n = 0; n < 6; n++) w.brush(h.x + (n - 3) * 20, h.y, n % 2 ? 40 : -40);
        sfx.rustle();
        this.checkParted(i);
      }),
    );
    this.cameras.main.fadeIn(800, 220, 230, 230);
    void this.play();
  }

  private updateCount(): void {
    this.countText.setText(t('ll.o.count', { n: llRun.orioles, total: TREES.length }));
  }

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('mom', 'll.o.mom0');
    await dlg.say('mom', 'll.o.mom1');
    dlg.hide();
    const touch = this.sys.game.device.input.touch;
    music.stop();
    const order = Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]);
    for (let round = 0; round < order.length; round++) {
      await this.findBird(order[round], touch);
      await this.duet(ROUND_LEN[round], touch);
      await this.greenUp(order[round]);
    }
    await this.springComes(dlg);
  }

  // ---- finding the bird --------------------------------------------------------------------------

  private async findBird(tree: number, touch: boolean): Promise<void> {
    this.target = tree;
    this.wrongShown = new Set();
    const hint = i18nText(this, W / 2, H - 26, () => t(touch ? 'll.o.hintFindTouch' : 'll.o.hintFind'), { fontSize: '20px', color: '#2f3b3a', backgroundColor: '#fdf8eecc', padding: { x: 12, y: 6 } }).setOrigin(0.5, 1).setDepth(HUD);
    this.searching = true;
    this.glintAt = this.time.now + 1500;
    // the bird sings from its hiding place every few seconds, until found
    const sing = () => sfx.oriole(this.songFor(3), this.panFor(tree));
    sing();
    const ev = this.time.addEvent({ delay: 3800, loop: true, callback: sing });
    await new Promise<void>((res) => {
      const chk = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.searching && (chk.remove(), res()) });
    });
    ev.remove();
    hint.destroy();
  }

  private panFor(tree: number): number {
    return (TREES[tree] - W / 2) / (W / 2);
  }

  private checkParted(i: number): void {
    const w = this.willows[i];
    if (w.parted < 0.55) return;
    if (i === this.target) {
      this.searching = false;
      this.reveal(i);
    } else if (!this.wrongShown.has(i)) {
      this.wrongShown.add(i);
      llRun.wrongTrees += 1;
      const h = w.heart();
      this.pop(t('ll.o.empty'), h.x, h.y - 40, '#6a6a6a');
    }
  }

  private reveal(i: number): void {
    const h = this.willows[i].heart();
    sfx.chime();
    this.bird = this.add.image(h.x, h.y, 'llOriole-perch').setScale(0.42).setDepth(30).setFlipX(h.x > W / 2);
    this.tweens.add({ targets: this.bird, scale: 0.5, yoyo: true, duration: 200 });
    llRun.orioles += 1;
    this.updateCount();
    this.pop(t('ll.o.found'), h.x, h.y - 60, '#c08a10');
  }

  // ---- singing back and forth ---------------------------------------------------------------------

  /** A random oriole phrase: a mix of short and long liquid notes. */
  private songFor(n: number): WhistleNote[] {
    const pitches = [1175, 1319, 1568, 1760, 2093];
    return Array.from({ length: n }, () => ({ f: pitches[Math.floor(Math.random() * pitches.length)], long: Math.random() < 0.45 }));
  }

  private async duet(n: number, touch: boolean): Promise<void> {
    const song = this.songFor(n);
    // make sure there's at least one long and one short
    song[0].long = false;
    song[n - 1].long = true;
    this.song = song;
    const hint = i18nText(this, W / 2, H - 26, () => t(touch ? 'll.o.hintSingTouch' : 'll.o.hintSing'), { fontSize: '20px', color: '#2f3b3a', backgroundColor: '#fdf8eecc', padding: { x: 12, y: 6 } }).setOrigin(0.5, 1).setDepth(HUD);
    let first = true;
    for (;;) {
      await this.birdSings(song);
      this.showPattern(song, []);
      const ok = await this.listen(song);
      if (ok) break;
      first = false;
      // the bird cocks its head and sings it again
      sfx.blip();
      const b = this.bird!;
      this.tweens.add({ targets: b, angle: 18, yoyo: true, duration: 260 });
      this.pop('?', b.x, b.y - 50, '#c08a10');
      await wait(this, 900);
    }
    if (first) llRun.songsFirst += 1;
    hint.destroy();
    this.pattern?.destroy();
    this.pattern = null;
  }

  private async birdSings(song: WhistleNote[]): Promise<void> {
    const b = this.bird!;
    const dur = sfx.oriole(song, (b.x - W / 2) / (W / 2));
    b.setTexture('llOriole-sing');
    this.tweens.add({ targets: b, scaleY: b.scaleY * 1.06, yoyo: true, repeat: Math.max(1, Math.round(dur / 200)), duration: 100 });
    await wait(this, dur * 1000 + 250);
    b.setTexture('llOriole-perch');
  }

  /** Dots and dashes above the bird: the rhythm to copy, filling in as you go. */
  private showPattern(song: WhistleNote[], got: boolean[]): void {
    const b = this.bird!;
    this.pattern?.destroy();
    const g = (this.pattern = this.add.graphics().setDepth(HUD - 2));
    const w = song.reduce((s, n) => s + (n.long ? 44 : 18) + 12, -12);
    let x = Phaser.Math.Clamp(b.x, 120, W - 120) - w / 2;
    const y = b.y - 70;
    g.fillStyle(0xfdf8ee, 0.85);
    g.fillRoundedRect(x - 14, y - 16, w + 28, 32, 16);
    song.forEach((n, i) => {
      const done = i < got.length;
      const ok = done && got[i] === n.long;
      g.fillStyle(done ? (ok ? 0x5aa04a : 0xd8603a) : 0xc89a20, 1);
      if (n.long) g.fillRoundedRect(x, y - 6, 44, 12, 6);
      else g.fillCircle(x + 9, y, 7);
      x += (n.long ? 44 : 18) + 12;
    });
  }

  private listen(song: WhistleNote[]): Promise<boolean> {
    this.heard = [];
    this.listening = true;
    return new Promise((resolve) => {
      this.resolveSong = (ok) => {
        this.listening = false;
        resolve(ok);
      };
      // give up waiting after a while and let the bird sing again
      this.time.delayedCall(4000 + song.length * 900, () => this.listening && this.heard.length === 0 && this.resolveSong?.(false));
    });
  }

  private noteDown(): void {
    if (!this.listening || this.stopTone) return;
    this.pressAt = this.time.now;
    this.stopTone = sfx.whistleHold(1319);
  }

  private noteUp(): void {
    if (!this.stopTone) return;
    this.stopTone();
    this.stopTone = null;
    if (!this.listening) return;
    const long = this.time.now - this.pressAt >= LONG_MS;
    this.heard.push(long);
    const song = this.currentSong();
    this.showPattern(song, this.heard);
    const i = this.heard.length - 1;
    if (song[i].long !== long) {
      this.time.delayedCall(250, () => this.resolveSong?.(false));
    } else if (this.heard.length === song.length) {
      this.time.delayedCall(300, () => this.resolveSong?.(true));
    }
  }

  private currentSong(): WhistleNote[] {
    return this.song;
  }

  // ---- the willow turns green ---------------------------------------------------------------------

  private async greenUp(tree: number): Promise<void> {
    const b = this.bird!;
    this.bird = null;
    sfx.oriole([{ f: 1568, long: false }, { f: 2093, long: true }, { f: 1760, long: false }, { f: 2349, long: true }], (b.x - W / 2) / (W / 2));
    sfx.shimmer();
    this.pop(t('ll.o.sang'), b.x, b.y - 60, '#2e7a3a');
    // it hops up to the top of the tree and stays, singing now and then
    const w = this.willows[tree];
    b.setTexture('llOriole-up');
    const flap = this.time.addEvent({ delay: 90, loop: true, callback: () => b.setTexture(b.texture.key === 'llOriole-up' ? 'llOriole-down' : 'llOriole-up') });
    await tweenP(this, { targets: b, x: w.x + 30, y: w.ground - 420 * w.scale, duration: 700, ease: 'Sine.easeOut' });
    flap.remove();
    b.setTexture('llOriole-perch');
    this.perched.push(b);
    this.tweens.addCounter({ from: w.green, to: 1, duration: 2200, onUpdate: (tw) => (w.green = tw.getValue() ?? 1) });
    await wait(this, 1200);
  }

  /** 柳浪: a spring wind rolls over all the willows at once, and everything turns green. */
  private async springComes(dlg: Dialogue): Promise<void> {
    await wait(this, 600);
    music.play('llSpring');
    sfx.wind();
    this.wind.gust(this.time.now, -200, W + 200, 2800, 1.5);
    this.time.delayedCall(1400, () => this.wind.gust(this.time.now, -200, W + 200, 2600, 1.1));
    this.tweens.add({ targets: this.spring, alpha: 1, duration: 2600 });
    // petals on the wind
    for (let i = 0; i < 60; i++) {
      this.time.delayedCall(i * 50, () => {
        const p = this.add.image(-20, 100 + Math.random() * 400, 'llPetal').setDepth(35).setScale(0.6 + Math.random() * 0.6);
        this.tweens.add({ targets: p, x: W + 40, y: p.y + (Math.random() - 0.3) * 200, angle: 720, duration: 2600 + Math.random() * 1500, ease: 'Sine.easeInOut', onComplete: () => p.destroy() });
      });
    }
    // a flock of orioles flies in over the lake
    for (let i = 0; i < 8; i++) {
      const img = this.add.image(-60 - i * 50, 120 + Math.random() * 160, 'llOriole-up').setScale(0.3).setDepth(34);
      this.flock.push({ img, vx: 160 + Math.random() * 60, vy: (Math.random() - 0.5) * 30, flap: Math.random() * 6 });
    }
    await wait(this, 2400);
    this.snapshot();
    await wait(this, 600);
    this.wind.base = 1;
    await narrate(this, [{ key: 'll.o.n1' }], { color: '#2f3b3a', y: 110, size: 26, depth: 600, hintY: 160 });
    await dlg.say('mom', 'll.o.mom2');
    await dlg.say('koko', 'll.o.k1');
    await dlg.say('gogo', 'll.o.g1');
    dlg.hide();
    this.cameras.main.fadeOut(900, 240, 248, 236);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LiulangKite'));
  }

  /** A picture of the moment spring arrives, for the scroll. */
  private snapshot(): void {
    const key = nextLlKey('spring');
    this.scene.setVisible(false, 'UI');
    const hud = this.children.list.filter((o) => (o as unknown as { depth: number }).depth >= HUD) as unknown as Phaser.GameObjects.Components.Visible[];
    hud.forEach((o) => o.setVisible(false));
    this.game.renderer.snapshotArea(0, 0, W, H - 60, (img) => {
      this.scene.setVisible(true, 'UI');
      hud.forEach((o) => o.setVisible(true));
      if (img instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          llRun.photo = key;
        };
        if (img.complete) add();
        else img.onload = add;
      }
    });
  }

  private pop(s: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '24px', color, fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: y - 36, alpha: 0, delay: 400, duration: 800, onComplete: () => txt.destroy() });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    for (const w of this.willows) w.update(time, dt);
    this.wind.prune(time);
    // a glint of gold in the right tree now and then, for those who can't hear it
    if (this.searching && time > this.glintAt) {
      this.glintAt = time + 2600;
      const h = this.willows[this.target].heart();
      const gl = this.add.image(h.x + (Math.random() - 0.5) * 50, h.y + (Math.random() - 0.5) * 40, 'lfSpark').setTint(0xffd21e).setScale(0.8).setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: gl, alpha: 0, scale: 1.4, duration: 700, onComplete: () => gl.destroy() });
    }
    // the perched birds bob
    this.perched.forEach((b, i) => (b.y += Math.sin(time * 0.004 + i) * 0.08));
    for (const f of this.flock) {
      f.img.x += f.vx * dt;
      f.img.y += f.vy * dt + Math.sin(time * 0.005 + f.flap) * 0.6;
      if (Math.floor(time / 90 + f.flap) % 2) f.img.setTexture('llOriole-up');
      else f.img.setTexture('llOriole-down');
    }
  }
}

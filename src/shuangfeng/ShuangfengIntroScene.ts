import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import { makeButton, type Button } from '../ui/Button';
import { overGlobalUI } from '../ui/overlay';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { drawTwinPeaks, drawStelePavilion } from './art';
import { resetShuangfeng } from './state';

type Kid = 'me' | 'gogo' | 'koko';
const GROUND = 500;
const BOX = { x: 700, y: 250 };
const SCALE = 1.15;
const HUD = 300;

/** A glass milk bottle (local origin at its base), with the milk at `level` 0..1. */
export function drawMilkBottle(g: Phaser.GameObjects.Graphics, level: number, w = 24, h = 58): void {
  g.clear();
  g.fillStyle(0xdcebf0, 0.55);
  g.fillRoundedRect(-w / 2, -h, w, h, 6);
  g.fillRect(-w * 0.3, -h - 10, w * 0.6, 14);
  const milk = Math.max(0, Math.min(1, level)) * (h - 6);
  if (milk > 0) {
    g.fillStyle(0xfbfaf4, 1);
    g.fillRoundedRect(-w / 2 + 3, -3 - milk, w - 6, milk, 4);
  }
  g.fillStyle(0x4f86c6, 1);
  g.fillRect(-w * 0.32, -h - 14, w * 0.64, 6);
  g.fillStyle(0x5a9a6a, 1);
  g.fillTriangle(-w / 2 + 3, -h * 0.35, -w * 0.15, -h * 0.62, w * 0.12, -h * 0.35);
  g.fillStyle(0x3f7f56, 1);
  g.fillTriangle(-w * 0.1, -h * 0.35, w * 0.18, -h * 0.68, w / 2 - 3, -h * 0.35);
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(-w / 2 + 3, -h + 8, 3, h - 18);
}

/** The morning milk, a tongue-twister, a drinking race — and a dream of two bare peaks. */
export class ShuangfengIntroScene extends Phaser.Scene {
  private kids: Partial<Record<Kid, Phaser.GameObjects.Graphics>> = {};
  private stache: Partial<Record<Kid, Phaser.GameObjects.Graphics>> = {};
  private bottles: Partial<Record<Kid, Phaser.GameObjects.Container>> = {};
  private milk: Record<Kid, number> = { me: 1, gogo: 1, koko: 1 };
  private racing = false;
  private holding = false;
  private holdFor = 0;
  private coughUntil = 0;
  private lastGulp = 0;
  private winner: Kid | null = null;
  private drinkBtn: Button | null = null;
  private cow: Phaser.GameObjects.Image | null = null;
  private breath: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super('ShuangfengIntro');
  }

  create(): void {
    music.play('morning');
    resetShuangfeng(this.textures);
    this.kids = {};
    this.stache = {};
    this.bottles = {};
    this.milk = { me: 1, gogo: 1, koko: 1 };
    this.racing = false;
    this.holding = false;
    this.holdFor = 0;
    this.coughUntil = 0;
    this.winner = null;
    this.drinkBtn = null;
    this.cow = null;
    this.breath = null;
    this.paintDoorway();
    this.cameras.main.fadeIn(1400, 255, 248, 232);
    void this.play();
  }

  // ---- the morning ------------------------------------------------------------------------

  private paintDoorway(): void {
    const g = this.add.graphics();
    // whitewashed wall of an old lane house, grey tiles on top
    g.fillStyle(0xf2ede2, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xe4ddcf, 1);
    for (let y = 0; y < GROUND; y += 46) g.fillRect(0, y, W, 2);
    g.fillStyle(0x4a5358, 1);
    g.fillRect(0, 0, W, 54);
    g.fillStyle(0x5d676c, 1);
    for (let x = 0; x < W; x += 28) g.fillEllipse(x + 14, 54, 30, 16);
    // morning light slanting across the wall
    const light = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    light.fillStyle(0xffe2a8, 0.12);
    light.fillPoints([new Phaser.Math.Vector2(300, 54), new Phaser.Math.Vector2(620, 54), new Phaser.Math.Vector2(1180, GROUND), new Phaser.Math.Vector2(700, GROUND)], true);
    // the wooden front door (two leaves) with brass rings, and a stone step
    g.fillStyle(0x3a2a20, 1);
    g.fillRect(840, 150, 260, GROUND - 150);
    g.fillStyle(0x6b3f26, 1);
    g.fillRect(852, 162, 114, GROUND - 162);
    g.fillRect(974, 162, 114, GROUND - 162);
    g.lineStyle(2, 0x4a2a1a, 1);
    for (const x of [852, 974]) for (let y = 176; y < GROUND - 40; y += 56) g.strokeRect(x + 12, y, 90, 44);
    g.fillStyle(0xd9b45a, 1);
    g.fillCircle(956, 330, 9);
    g.fillCircle(984, 330, 9);
    g.fillStyle(0xb9b0a0, 1);
    g.fillRect(820, GROUND - 6, 300, 20);
    // the street
    g.fillStyle(0xa8a294, 1);
    g.fillRect(0, GROUND, W, H - GROUND);
    g.fillStyle(0x938d80, 1);
    for (let y = GROUND + 14; y < H; y += 36) for (let x = (y % 72) / 2; x < W; x += 60) g.fillRect(x, y, 56, 2);
    // the milk box by the door
    this.drawMilkBox(false);
  }

  private box: Phaser.GameObjects.Graphics | null = null;
  private drawMilkBox(open: boolean): void {
    if (!this.box) this.box = this.add.graphics().setDepth(10);
    const g = this.box;
    g.clear();
    const { x, y } = BOX;
    g.fillStyle(0x000000, 0.12);
    g.fillRect(x - 46, y - 56, 100, 124);
    g.fillStyle(0x7a5a3a, 1);
    g.fillRect(x - 50, y - 62, 100, 124);
    g.fillStyle(0x8f6c48, 1);
    g.fillRect(x - 44, y - 56, 88, 112);
    if (open) {
      g.fillStyle(0x3a2a20, 1);
      g.fillRect(x - 38, y - 40, 76, 90);
      g.fillStyle(0x8f6c48, 1);
      g.fillRect(x - 44, y - 104, 88, 46);
    } else {
      g.lineStyle(2, 0x5a3a20, 1);
      g.strokeRect(x - 38, y - 40, 76, 90);
      g.fillStyle(0xd9d2c0, 1);
      g.fillRect(x - 24, y - 50, 48, 6);
      g.fillStyle(0x5a3a20, 1);
      g.fillRect(x - 6, y + 8, 12, 6);
    }
    g.fillStyle(0xc0392b, 1);
    g.fillRect(x - 50, y - 70, 100, 10);
    if (!open) {
      const label = this.add.text(x, y - 66, '牛奶', baseStyle({ fontSize: '12px', color: '#ffffff', fontStyle: 'bold' })).setOrigin(0.5).setDepth(11);
      label.setName('boxLabel');
    }
  }

  private addKid(who: Kid, x: number, facing: 1 | -1, armUp = false): Phaser.GameObjects.Graphics {
    const g = this.kids[who] ?? this.add.graphics().setDepth(50);
    drawPerson(g, LOOKS[who], { facing, armUp, backpack: who === 'me' });
    g.setPosition(x, GROUND).setScale(SCALE);
    this.kids[who] = g;
    return g;
  }

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    const g = who && who in this.kids ? this.kids[who as Kid] : undefined;
    if (g) this.tweens.add({ targets: g, y: GROUND - 8, yoyo: true, duration: 140, repeat: 1 });
    if (who === 'cow' && this.cow) this.tweens.add({ targets: this.cow, angle: -4, yoyo: true, duration: 200, repeat: 1 });
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    await narrate(this, [{ key: 'sf.n1' }, { key: 'sf.n2' }], { color: '#4a4038', y: 130, size: 28, depth: 600, hintY: 196 });
    this.addKid('me', 560, 1);
    await this.openBox();

    // KOKO and GOGO come by to walk to school, bottles in hand
    const koko = this.addKid('koko', -80, 1, true);
    const gogo = this.addKid('gogo', -200, 1, true);
    this.holdBottle('koko');
    this.holdBottle('gogo');
    sfx.whee();
    await Promise.all([
      tweenP(this, { targets: koko, x: 300, duration: 1400, ease: 'Sine.easeOut' }),
      tweenP(this, { targets: gogo, x: 420, duration: 1500, ease: 'Sine.easeOut' }),
    ]);
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'koko', 'sf.i.k1');
    await this.speak(dlg, 'gogo', 'sf.i.g1');
    await this.speak(dlg, 'koko', 'sf.i.k2');
    await this.speak(dlg, 'koko', 'sf.i.k3');
    await this.speak(dlg, 'me', 'sf.i.m1');
    dlg.hide();

    await this.drinkRace();
    this.mustaches();
    await wait(this, 500);
    await this.speak(dlg, this.winner === 'me' ? 'me' : 'gogo', this.winner === 'me' ? 'sf.i.winMe' : 'sf.i.winG');
    await this.speak(dlg, 'gogo', 'sf.i.g2');
    await this.speak(dlg, 'koko', 'sf.i.k4');
    dlg.hide();
    await narrate(this, [{ key: 'sf.n3' }], { color: '#4a4038', y: 130, size: 28, depth: 600, hintY: 196 });

    // drifting off… into the dream
    this.cameras.main.fadeOut(1600, 255, 255, 255);
    await new Promise<void>((res) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => res()));
    await this.dream();
  }

  private async openBox(): Promise<void> {
    const hint = i18nText(this, W / 2, 130, () => t('sf.i.hintBox'), { fontSize: '24px', color: '#4a4038' }).setOrigin(0.5).setDepth(HUD);
    const ring = this.add.graphics().setDepth(12);
    ring.lineStyle(4, 0xe0a050, 1);
    ring.strokeCircle(BOX.x, BOX.y, 80);
    this.tweens.add({ targets: ring, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
    await new Promise<void>((resolve) => {
      const zone = this.add.zone(BOX.x, BOX.y, 140, 160).setInteractive({ useHandCursor: true });
      const go = () => {
        zone.destroy();
        this.input.keyboard?.off('keydown-SPACE', go);
        resolve();
      };
      zone.once('pointerdown', (p: Phaser.Input.Pointer) => !overGlobalUI(p) && go());
      this.input.keyboard?.once('keydown-SPACE', go);
    });
    hint.destroy();
    ring.destroy();
    this.children.getByName('boxLabel')?.destroy();
    sfx.stamp();
    this.drawMilkBox(true);
    // the bottle comes out, into my hand
    const b = this.add.image(BOX.x, BOX.y + 10, 'sfBottle').setDepth(40).setScale(0.5);
    await tweenP(this, { targets: b, y: BOX.y - 90, duration: 400, ease: 'Back.easeOut' });
    sfx.bell();
    this.addKid('me', 560, -1, true);
    await tweenP(this, { targets: b, x: 560 - 24 * SCALE, y: GROUND - 126 * SCALE - 20, scale: 0.36, duration: 500 });
    b.destroy();
    this.holdBottle('me');
  }

  private holdBottle(who: Kid): void {
    const c = this.bottles[who] ?? this.add.container(0, 0).setDepth(55);
    c.removeAll(true);
    const g = this.add.graphics();
    drawMilkBottle(g, this.milk[who]);
    c.add(g);
    c.setData('g', g);
    this.bottles[who] = c;
  }

  private async drinkRace(): Promise<void> {
    // everyone turns to face the street, bottle up
    this.addKid('koko', 300, 1, true);
    this.addKid('gogo', 420, 1, true);
    this.addKid('me', 560, 1, true);
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 110, () => t('sf.i.hintDrink'), { fontSize: '24px', color: '#4a4038', align: 'center' }).setOrigin(0.5).setDepth(HUD);
    const ready = this.add.text(430, 210, '3', baseStyle({ fontSize: '64px', color: '#c0392b', fontStyle: 'bold' })).setOrigin(0.5).setDepth(HUD);
    for (const n of ['3', '2', '1']) {
      ready.setText(n);
      sfx.tick(n === '1');
      await wait(this, 600);
    }
    ready.setText(t('sf.i.go'));
    sfx.bell();
    this.tweens.add({ targets: ready, alpha: 0, delay: 500, duration: 400 });

    const kb = this.input.keyboard;
    const onDown = () => (this.holding = true);
    const onUp = () => (this.holding = false);
    kb?.on('keydown-SPACE', onDown);
    kb?.on('keyup-SPACE', onUp);
    this.drinkBtn = makeButton(this, 170, 190, () => t('sf.i.btnDrink'), {
      width: 200,
      fill: 0xfdf8ee,
      depth: HUD,
      onDown,
      onUp,
    });
    if (!touch) this.drinkBtn.container.setAlpha(0.85);
    this.racing = true;
    this.breath = this.add.graphics().setDepth(HUD);
    await new Promise<void>((resolve) => {
      const check = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          if (!this.racing) {
            check.remove();
            resolve();
          }
        },
      });
    });
    kb?.off('keydown-SPACE', onDown);
    kb?.off('keyup-SPACE', onUp);
    this.drinkBtn.destroy();
    this.drinkBtn = null;
    this.breath?.destroy();
    this.breath = null;
    hint.destroy();
    ready.destroy();
  }

  private mustaches(): void {
    for (const who of ['me', 'gogo', 'koko'] as Kid[]) {
      const kid = this.kids[who]!;
      const g = this.stache[who] ?? this.add.graphics().setDepth(60);
      g.clear();
      const x = kid.x + 5 * SCALE;
      const y = kid.y - 110 * SCALE;
      g.fillStyle(0xd8d4cc, 1);
      g.fillEllipse(x - 5, y + 1, 15, 8);
      g.fillEllipse(x + 5, y + 1, 15, 8);
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(x - 5, y, 14, 7);
      g.fillEllipse(x + 5, y, 14, 7);
      this.stache[who] = g;
      // bottles down, empty
      this.addKid(who, kid.x, 1, false);
      this.bottles[who]?.destroy();
      delete this.bottles[who];
    }
  }

  // ---- the dream: 洪春桥, 御碑亭, two bare peaks ---------------------------------------------

  private async dream(): Promise<void> {
    music.play('sfMist');
    this.tweens.killAll();
    this.children.removeAll(true);
    this.kids = {};
    this.stache = {};
    this.box = null;
    const g = this.add.graphics();
    g.fillGradientStyle(0xcfe4f0, 0xcfe4f0, 0xf6efe0, 0xf6efe0, 1);
    g.fillRect(0, 0, W, H);
    drawTwinPeaks(g, 420);
    // fields and the road to Lingyin in front
    g.fillStyle(0x9ab07a, 1);
    g.fillRect(0, 400, W, 70);
    // the pines of 九里松 line the road from here to Lingyin
    for (let x = 300; x < W; x += 58) this.add.image(x, 408, 'sfPine').setScale(0.38 + (x % 3) * 0.05).setOrigin(0.5, 1).setAlpha(0.9);
    g.fillStyle(0xd9ccb4, 1);
    g.fillRect(0, 462, W, H - 462);
    g.fillStyle(0xc9bca4, 1);
    for (let x = 0; x < W; x += 70) g.fillRect(x, 540, 50, 3);
    drawStelePavilion(this, g, 180, 505);
    // a fresh dialogue box, above the new scenery
    const d = new Dialogue(this);
    const kidsX: [Kid, number][] = [['koko', 620], ['gogo', 740], ['me', 860]];
    for (const [who, x] of kidsX) {
      const k = this.add.graphics().setDepth(50);
      drawPerson(k, LOOKS[who], { facing: -1, backpack: who === 'me' });
      k.setPosition(x, GROUND).setScale(1.05);
      this.kids[who] = k;
      // the milk moustaches came along into the dream
      const s = this.add.graphics().setDepth(51);
      s.fillStyle(0xffffff, 1);
      s.fillEllipse(x - 5 * 1.05 - 4, GROUND - 110 * 1.05, 10, 5);
      s.fillEllipse(x - 5 * 1.05 + 4, GROUND - 110 * 1.05, 10, 5);
      this.stache[who] = s;
    }
    this.cameras.main.fadeIn(1600, 255, 255, 255);
    await narrate(this, [{ key: 'sf.n4' }], { color: '#3a4a48', y: 120, size: 28, depth: 600, hintY: 180 });
    await this.speak(d, 'me', 'sf.i.m2');
    await this.speak(d, 'gogo', 'sf.i.g3');
    await this.speak(d, 'koko', 'sf.i.k5');
    d.hide();

    // a cloud comes walking over the fields…
    this.cow = this.add.image(W + 200, 330, 'sfCow').setDepth(40).setScale(0.9).setFlipX(false);
    this.tweens.add({ targets: this.cow, y: 320, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
    const puffs = this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        if (!this.cow) return;
        const p = this.add.image(this.cow.x + 100, this.cow.y + 60, 'sfPuff').setScale(0.3).setAlpha(0.7).setDepth(39);
        this.tweens.add({ targets: p, x: p.x + 40, alpha: 0, scale: 0.6, duration: 1200, onComplete: () => p.destroy() });
      },
    });
    sfx.cowbell();
    await tweenP(this, { targets: this.cow, x: 1110, duration: 2600, ease: 'Sine.easeOut' });
    puffs.remove();
    sfx.moo();
    await this.speak(d, 'cow', 'sf.i.c1');
    await this.speak(d, 'koko', 'sf.i.k6');
    await this.speak(d, 'gogo', 'sf.i.g4');
    await this.speak(d, 'cow', 'sf.i.c2');
    await this.speak(d, 'cow', 'sf.i.c3');
    await this.speak(d, 'cow', 'sf.i.c4');
    await this.speak(d, 'cow', 'sf.i.c5');
    await this.speak(d, 'me', 'sf.i.m3');
    await this.speak(d, 'cow', 'sf.i.c6');
    d.hide();
    sfx.whee();
    this.cameras.main.fadeOut(1000, 240, 244, 240);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('ShuangfengClimb'));
  }

  update(time: number, delta: number): void {
    // bottles follow the raised hands
    for (const who of Object.keys(this.bottles) as Kid[]) {
      const c = this.bottles[who]!;
      const kid = this.kids[who]!;
      const tipped = this.racing && (who !== 'me' || this.drinking());
      c.setPosition(kid.x + 24 * SCALE, kid.y - 126 * SCALE + 30);
      c.setRotation(tipped ? -1.1 : -0.15);
    }
    if (!this.racing) return;
    const dt = delta / 1000;
    const now = time;
    // GOGO glugs steadily; KOKO is slower (she keeps giggling)
    this.milk.gogo -= dt * 0.19;
    this.milk.koko -= dt * 0.13 * (0.7 + 0.3 * Math.sin(now * 0.004));
    if (this.drinking()) {
      this.holdFor += dt;
      this.milk.me -= dt * 0.3;
      if (now - this.lastGulp > 260) {
        this.lastGulp = now;
        sfx.gulp(330 + (1 - this.milk.me) * 200);
      }
      if (this.holdFor > 1.7) {
        // too much at once: a coughing fit
        this.coughUntil = now + 1100;
        this.holdFor = 0;
        sfx.cough();
        this.popText(t('sf.i.cough'), this.kids.me!.x, this.kids.me!.y - 170);
      }
    } else {
      this.holdFor = Math.max(0, this.holdFor - dt * 3);
    }
    for (const who of ['me', 'gogo', 'koko'] as Kid[]) {
      this.milk[who] = Math.max(0, this.milk[who]);
      const g = this.bottles[who]?.getData('g') as Phaser.GameObjects.Graphics | undefined;
      if (g) drawMilkBottle(g, this.milk[who]);
      if (this.milk[who] <= 0 && !this.winner) this.winner = who;
    }
    // a little breath gauge over my head: let go before it turns red
    if (this.breath) {
      const me = this.kids.me!;
      const k = Math.min(1, this.holdFor / 1.7);
      const g = this.breath;
      g.clear();
      g.fillStyle(0x2f3b3a, 0.25);
      g.fillRoundedRect(me.x - 40, me.y - 222, 80, 10, 5);
      g.fillStyle(time < this.coughUntil ? 0xc0392b : k > 0.7 ? 0xe67e22 : 0x5dade2, 1);
      g.fillRoundedRect(me.x - 40, me.y - 222, 80 * (time < this.coughUntil ? 1 : k), 10, 5);
    }
    if (this.winner && (this.milk.me <= 0 || this.milk.gogo <= 0)) {
      // finish everyone off for the story
      this.racing = false;
      sfx.chime();
    }
  }

  private drinking(): boolean {
    return this.holding && this.time.now > this.coughUntil;
  }

  private popText(s: string, x: number, y: number): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '26px', color: '#c0392b', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }
}

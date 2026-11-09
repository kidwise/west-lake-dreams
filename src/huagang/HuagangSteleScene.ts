import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait } from '../ui/narrate';
import { baseStyle } from '../ui/text';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import type { StrKey } from '../core/i18n';
import { paintBackdrop, type Backdrop } from '../art/backdrop';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { KoiBody, inkFishTexture, koiSideTexture } from './koi';
import { drawPeony, PEONY, yuWithoutDots } from './art';

const GROUND = 600;
const WORLD_W = 1900;
const STELE_X = 470;
const POND_X = 1120; // where the pond begins
const WATER_Y = 572;
/** Centre of each character on the tablet (vertical, top to bottom). */
const CHAR_Y = [244, 316, 388, 460];

/** 御碑亭: the legend of the three dots, and 魚 swimming off the tablet. */
export class HuagangSteleScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private kids: Record<'me' | 'gogo' | 'koko', Phaser.GameObjects.Graphics> = {} as never;
  private yu!: Phaser.GameObjects.Image;
  private dots!: Phaser.GameObjects.Graphics;
  private pondFish: { body: KoiBody; x: number; dir: number; y: number; w: number }[] = [];
  private ripples!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('HuagangStele');
  }

  create(): void {
    music.play('huagangStele');
    this.pondFish = [];
    this.backdrop = paintBackdrop(this, { horizon: 330, skyTop: 0x9fd0ef, skyBottom: 0xf6efe0, worldWidth: WORLD_W });
    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.paintPark();
    this.paintPavilion();
    this.paintPond();

    (['koko', 'gogo', 'me'] as const).forEach((who, i) => {
      const g = this.add.graphics().setDepth(40 + i);
      drawPerson(g, LOOKS[who], { facing: who === 'koko' ? 1 : -1, backpack: who === 'me' });
      g.setPosition([250, 700, 800][i], GROUND + 4);
      this.kids[who] = g;
    });

    this.cameras.main.fadeIn(1000, 255, 248, 236);
    void this.play();
  }

  private paintPark(): void {
    const r = rng(23);
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x86b064, 1);
    g.fillRect(0, 420, WORLD_W, H - 420);
    g.fillStyle(0x9cc274, 1);
    g.fillRect(0, 420, WORLD_W, 26);
    // cedars (雪松) on the big lawn behind
    for (let x = 40; x < WORLD_W; x += 180 + r() * 90) {
      g.fillStyle(0x3d6b4a, 1);
      for (let k = 0; k < 6; k++) g.fillTriangle(x - 80 + k * 11, 440 - k * 44, x + 80 - k * 11, 440 - k * 44, x, 360 - k * 44);
      g.fillStyle(0x5a4632, 1);
      g.fillRect(x - 6, 430, 12, 20);
    }
    // the paved ground in front of the pavilion
    g.fillStyle(0xd9ccb4, 1);
    g.fillRect(0, GROUND - 14, POND_X + 20, H - GROUND + 14);
    g.lineStyle(1.5, 0xb8a88c, 1);
    for (let x = 0; x < POND_X; x += 60) g.lineBetween(x, GROUND - 14, x - 30, H);
    // peonies by the path
    const p = this.add.graphics().setDepth(60);
    for (let x = 20; x < POND_X - 40; x += 150) {
      for (let i = 0; i < 8; i++) {
        p.fillStyle([0x3f7a3a, 0x4f8f4a][i % 2], 1);
        p.fillEllipse(x + (r() - 0.5) * 120, H - 20 + (r() - 0.5) * 30, 46, 26);
      }
      drawPeony(p, x + (r() - 0.5) * 50, H - 40, 20 + r() * 8, PEONY[Math.floor(r() * PEONY.length)], x);
    }
  }

  private paintPavilion(): void {
    const g = this.add.graphics().setDepth(10);
    const cx = STELE_X;
    // stone platform
    g.fillStyle(0xb8b0a0, 1);
    g.fillRect(cx - 230, GROUND - 40, 460, 40);
    g.fillStyle(0xd0c9ba, 1);
    g.fillRect(cx - 240, GROUND - 48, 480, 12);
    // back wall shadow and columns
    g.fillStyle(0x6b5d52, 0.25);
    g.fillRect(cx - 190, 170, 380, GROUND - 218);
    g.fillStyle(0x8a3b2e, 1);
    for (const x of [cx - 200, cx + 180]) g.fillRect(x, 170, 22, GROUND - 218);
    g.fillStyle(0x6b2a20, 1);
    for (const x of [cx - 200, cx + 180]) g.fillRect(x + 16, 170, 6, GROUND - 218);
    // beam
    g.fillStyle(0x7a3328, 1);
    g.fillRect(cx - 214, 160, 428, 22);
    g.fillStyle(0x2f6f6a, 1);
    g.fillRect(cx - 200, 166, 400, 8);

    // roof with upturned corners (飞檐)
    const roof = this.add.graphics().setDepth(12);
    roof.fillStyle(0x3d4a4f, 1);
    roof.fillPoints(
      [
        new Phaser.Math.Vector2(cx - 290, 128),
        new Phaser.Math.Vector2(cx - 250, 148),
        new Phaser.Math.Vector2(cx + 250, 148),
        new Phaser.Math.Vector2(cx + 290, 128),
        new Phaser.Math.Vector2(cx + 220, 118),
        new Phaser.Math.Vector2(cx + 120, 60),
        new Phaser.Math.Vector2(cx - 120, 60),
        new Phaser.Math.Vector2(cx - 220, 118),
      ],
      true,
    );
    roof.fillStyle(0x56656b, 1);
    for (let x = cx - 220; x < cx + 220; x += 16) roof.fillRect(x, 70 + Math.abs(x - cx) * 0.18, 6, 76 - Math.abs(x - cx) * 0.18);
    roof.fillStyle(0x2b3438, 1);
    roof.fillRect(cx - 130, 52, 260, 12);
    roof.fillTriangle(cx - 300, 122, cx - 270, 136, cx - 286, 112);
    roof.fillTriangle(cx + 300, 122, cx + 270, 136, cx + 286, 112);

    // the tablet on its carved base (须弥座)
    const t = this.add.graphics().setDepth(14);
    t.fillStyle(0xa79f90, 1);
    t.fillRect(cx - 100, GROUND - 92, 200, 46);
    t.fillStyle(0xbdb6a7, 1);
    t.fillRect(cx - 110, GROUND - 100, 220, 12);
    t.fillRect(cx - 110, GROUND - 54, 220, 10);
    t.fillStyle(0x4a4038, 0.06);
    t.fillRect(cx - 74, 202, 156, 316);
    t.fillStyle(0xcfc9bc, 1);
    t.fillRoundedRect(cx - 78, 196, 156, 310, 6);
    t.fillStyle(0xe0dbcf, 1);
    t.fillRect(cx - 70, 206, 140, 290);
    t.lineStyle(2, 0xb3ab9c, 1);
    t.strokeRect(cx - 64, 212, 128, 278);
    const style = baseStyle({ fontFamily: FONT_SERIF, fontSize: '62px', color: '#2a2224', fontStyle: 'bold' });
    ['花', '港', '觀'].forEach((ch, i) => this.add.text(cx, CHAR_Y[i], ch, style).setOrigin(0.5).setDepth(15));
    // 魚 with only three dots: the font's four dots are cropped off and three are brushed in
    this.yu = yuWithoutDots(this, cx, CHAR_Y[3], style).setDepth(15);
    this.dots = this.add.graphics().setDepth(15).setPosition(cx, CHAR_Y[3]);
    this.dots.fillStyle(0x2a2224, 1);
    for (const dx of [-17, 0, 17]) {
      this.dots.fillEllipse(dx, 22, 10, 12);
      this.dots.fillTriangle(dx - 4, 18, dx + 4, 16, dx + 4, 27);
    }
  }

  private paintPond(): void {
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x8a826f, 1);
    g.fillRect(POND_X - 30, WATER_Y - 18, 50, H - WATER_Y + 18);
    g.fillStyle(0xbdb6a7, 1);
    g.fillRect(POND_X - 40, WATER_Y - 24, 64, 12);
    const water = this.add.graphics().setDepth(18);
    water.fillGradientStyle(0x5f9fa0, 0x5f9fa0, 0x2a5f63, 0x2a5f63, 1);
    water.fillRect(POND_X, WATER_Y, WORLD_W - POND_X, H - WATER_Y);
    this.ripples = this.add.tileSprite(POND_X, WATER_Y, WORLD_W - POND_X, H - WATER_Y, 'ripples').setOrigin(0).setDepth(19).setAlpha(0.5);
    // koi just under the surface
    for (let i = 0; i < 9; i++) {
      const tex = koiSideTexture(this, (['higoi', 'kohaku', 'higoi', 'ogon', 'showa'] as const)[i % 5], 900 + i);
      const body = new KoiBody(this, tex, { side: true });
      body.setDepth(18.5);
      body.setAlpha(0.75);
      this.pondFish.push({ body, x: POND_X + 60 + Math.random() * (WORLD_W - POND_X - 120), dir: Math.random() < 0.5 ? -1 : 1, y: WATER_Y + 40 + Math.random() * 90, w: Math.random() * 6 });
    }
  }

  private async speak(dlg: Dialogue, who: Speaker, key: StrKey): Promise<void> {
    if (who === 'me' || who === 'gogo' || who === 'koko') {
      this.tweens.add({ targets: this.kids[who], y: GROUND - 4, yoyo: true, duration: 140, repeat: 1 });
    }
    await dlg.say(who, key);
  }

  private async play(): Promise<void> {
    await wait(this, 800);
    const dlg = new Dialogue(this);
    await this.speak(dlg, 'koko', 'hg.s.k1');
    await this.speak(dlg, 'gogo', 'hg.s.g1');
    // the camera leans in on the three dots (no dialogue box while zoomed)
    dlg.hide();
    const cam = this.cameras.main;
    cam.pan(STELE_X, CHAR_Y[3], 900, 'Sine.easeInOut');
    cam.zoomTo(2.2, 900, 'Sine.easeInOut');
    await wait(this, 1000);
    const ring = this.add.graphics().setDepth(16);
    ring.lineStyle(3, 0xd94b3a, 0.9);
    ring.strokeEllipse(STELE_X, CHAR_Y[3] + 22, 64, 26);
    ring.setAlpha(0);
    await tweenP(this, { targets: ring, alpha: 1, duration: 300, yoyo: true, repeat: 2 });
    await wait(this, 500);
    ring.destroy();
    cam.zoomTo(1, 800, 'Sine.easeInOut');
    cam.pan(W / 2, H / 2, 800, 'Sine.easeInOut');
    await wait(this, 850);
    await this.speak(dlg, 'koko', 'hg.s.k2');
    await this.speak(dlg, 'koko', 'hg.s.k3');
    dlg.hide();

    // the character stirs
    cam.pan(STELE_X + 140, H / 2, 600, 'Sine.easeInOut');
    sfx.shimmer();
    const glow = this.add.image(STELE_X, CHAR_Y[3], 'hgGlow').setDepth(14.5).setScale(0.2).setAlpha(0).setTint(0xbff4ff).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.9, scale: 1.2, duration: 900 });
    const wobble = this.tweens.add({ targets: [this.yu, this.dots], angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 160 });
    await wait(this, 900);
    await this.speak(dlg, 'gogo', 'hg.s.g2');
    dlg.hide();
    wobble.remove();
    cam.pan(W / 2 + 140, H / 2, 900, 'Sine.easeInOut');

    // the three dots drip off as three drops of water and run to the pond
    this.dots.setVisible(false);
    for (const [i, dx] of [-17, 0, 17].entries()) {
      const d = this.add.image(STELE_X + dx, CHAR_Y[3] + 22, 'hgDrop').setScale(0.22).setDepth(30);
      this.tweens.add({ targets: d, x: POND_X + 120 + i * 60, duration: 1300, delay: i * 150, ease: 'Sine.easeIn' });
      this.tweens.add({
        targets: d,
        y: { from: CHAR_Y[3] + 25, to: WATER_Y + 4 },
        duration: 1300,
        delay: i * 150,
        ease: (k: number) => k * k * 1.8 - k * 0.8,
        onComplete: () => {
          d.destroy();
          sfx.plop(2);
          this.splash(POND_X + 120 + i * 60, WATER_Y, 0.5);
        },
      });
    }
    await wait(this, 700);

    // ...and the character becomes a fish of ink, and leaps after them
    const ink = new KoiBody(this, inkFishTexture(this), { side: true, length: 150 });
    ink.setDepth(35);
    ink.setAlpha(0);
    this.tweens.add({ targets: this.yu, alpha: 0, scale: 1.4, duration: 600 });
    this.tweens.add({ targets: glow, alpha: 0, duration: 1200 });
    sfx.whee();
    const path = new Phaser.Curves.Spline([
      STELE_X, CHAR_Y[3],
      STELE_X + 140, CHAR_Y[3] - 150,
      STELE_X + 360, CHAR_Y[3] - 220,
      STELE_X + 520, CHAR_Y[3] - 60,
      STELE_X + 420, CHAR_Y[3] - 20,
      STELE_X + 520, CHAR_Y[3] - 170,
      POND_X + 160, 260,
      POND_X + 330, WATER_Y + 60,
    ]);
    await new Promise<void>((resolve) => {
      let wave = 0;
      let lastWisp = 0;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 3200,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          const p = path.getPoint(k);
          const tan = path.getTangent(k);
          wave += 0.3;
          ink.setAlpha(Math.min(1, k * 6));
          ink.pose(p.x, p.y, Math.atan2(tan.y, tan.x), 0, wave, 0.35, 0.95);
          if (this.time.now - lastWisp > 50) {
            lastWisp = this.time.now;
            const w = this.add.image(p.x, p.y, 'hgInk').setDepth(34).setScale(0.3 + Math.random() * 0.3).setAlpha(0.6);
            this.tweens.add({ targets: w, alpha: 0, scale: w.scale * 1.8, duration: 900, onComplete: () => w.destroy() });
          }
          if (k > 0.93 && ink.rope.alpha > 0 && p.y > WATER_Y) {
            ink.setAlpha(0);
            sfx.bigSplash();
            this.splash(p.x, WATER_Y, 1.2);
          }
        },
        onComplete: () => resolve(),
      });
    });
    ink.destroy();
    await wait(this, 600);

    await this.speak(dlg, 'koko', 'hg.s.k4');
    this.cameras.main.pan(STELE_X + 160, H / 2, 700, 'Sine.easeInOut');
    await wait(this, 700);
    await this.speak(dlg, 'me', 'hg.s.m1');
    await this.speak(dlg, 'gogo', 'hg.s.g3');
    await this.speak(dlg, 'koko', 'hg.s.k5');
    await this.speak(dlg, 'gogo', 'hg.s.g4');
    await this.speak(dlg, 'me', 'hg.s.m2');
    dlg.hide();

    // a peony petal drifts down onto the pond — and we follow it in
    this.cameras.main.pan(POND_X + 200, H / 2, 1600, 'Sine.easeInOut');
    const petal = this.add.image(POND_X - 60, 120, 'hgPetal').setScale(1.4).setDepth(70);
    this.tweens.add({ targets: petal, x: POND_X + 260, duration: 3400, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: petal, angle: 200, duration: 3400 });
    const drift = tweenP(this, { targets: petal, y: WATER_Y - 4, duration: 3400, ease: 'Sine.easeIn' });
    const kids = [this.kids.koko, this.kids.gogo, this.kids.me];
    kids.forEach((k, i) => {
      drawPerson(k, LOOKS[(['koko', 'gogo', 'me'] as const)[i]], { facing: 1, backpack: i === 2 });
      this.tweens.add({ targets: k, x: POND_X - 120 + i * 40, duration: 2400, ease: 'Sine.easeInOut' });
    });
    await narrate(this, [{ key: 'hg.s.n1' }], { y: 150, size: 30, color: '#2f3b3a', depth: 600, hintY: 210 });
    await drift;
    this.splash(petal.x, WATER_Y, 0.6);
    sfx.plop(1);
    // jump!
    for (const [i, k] of kids.entries()) {
      this.time.delayedCall(i * 220, () => {
        this.tweens.add({ targets: k, x: POND_X + 140 + i * 90, duration: 700, ease: 'Linear' });
        this.tweens.add({
          targets: k,
          y: { from: GROUND + 4, to: WATER_Y + 90 },
          duration: 700,
          ease: (q: number) => q * q * 2.2 - q * 1.2,
          onComplete: () => {
            sfx.bigSplash();
            this.splash(k.x, WATER_Y, 1);
            k.setVisible(false);
          },
        });
      });
    }
    await wait(this, 1500);
    this.cameras.main.fadeOut(900, 40, 120, 120);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('HuagangUnder'));
  }

  private splash(x: number, y: number, s: number): void {
    for (let i = 0; i < 3; i++) {
      const ring = this.add.image(x, y, 'hgRing').setScale(0.2 * s, 0.07 * s).setDepth(21).setAlpha(0.9);
      this.tweens.add({ targets: ring, scaleX: (1.6 + i * 0.6) * s, scaleY: (0.5 + i * 0.2) * s, alpha: 0, delay: i * 140, duration: 900, onComplete: () => ring.destroy() });
    }
    for (let i = 0; i < 10 * s; i++) {
      const d = this.add.circle(x, y, 2 + Math.random() * 3, 0xe8fbff, 0.9).setDepth(36);
      const vx = (Math.random() - 0.5) * 160 * s;
      this.tweens.add({ targets: d, x: x + vx, duration: 600, ease: 'Linear' });
      this.tweens.add({ targets: d, y: { from: y, to: y + 10 }, duration: 600, ease: (q: number) => -Math.sin(q * Math.PI) * (3 + Math.random() * 5) * s + q, onComplete: () => d.destroy() });
    }
  }

  update(time: number, delta: number): void {
    this.backdrop.update(time, this.cameras.main.scrollX);
    this.ripples.tilePositionX = time * 0.01;
    for (const f of this.pondFish) {
      f.x += f.dir * delta * 0.03;
      if (f.x < POND_X + 40 || f.x > WORLD_W - 40) f.dir *= -1;
      f.w += delta * 0.008;
      f.body.pose(f.x, f.y + Math.sin(f.w * 0.2) * 6, f.dir > 0 ? 0 : Math.PI, 0, f.w, 0.22, 0.55);
    }
  }
}

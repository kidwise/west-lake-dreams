import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { Cyclist, LOOKS } from '../art/Cyclist';
import { hillPolygon, rng } from '../art/paint';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { run } from '../core/state';
import { sfx } from '../core/sfx';

const BASE = 560; // causeway surface
const WATER = 604;
const START = 700;
const SPAN = 560;
const GAP = 440;
const COUNT = 6;

interface Body {
  cy: Cyclist;
  x: number;
  y: number;
  s: number;
  vy: number;
  air: boolean;
  airT: number;
  angle: number;
}

/**
 * The daydream: "脑补着经过苏堤六桥/杨公堤时像过山车一样飞起来冲坡过桥的感受".
 * A short, dreamy physics ride over six arched bridges.
 */
export class BridgeDreamScene extends Phaser.Scene {
  private bodies!: { me: Body; gogo: Body; koko: Body };
  private archH = 120;
  private endX = 0;
  private pedalBtn!: Button;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private nextLabel = 0;
  private finished = false;
  private petals: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('BridgeDream');
  }

  /** Height of the causeway/bridge surface at world x (screen y; smaller = higher). */
  private ground(x: number): number {
    const i = Math.floor((x - START) / (SPAN + GAP));
    if (i < 0 || i >= COUNT) return BASE;
    const u = (x - START - i * (SPAN + GAP)) / SPAN;
    if (u < 0 || u > 1) return BASE;
    return BASE - this.archH * Math.sin(Math.PI * u);
  }

  private slope(x: number): number {
    return (this.ground(x + 1) - this.ground(x - 1)) / 2;
  }

  create(): void {
    this.finished = false;
    music.play('flight');
    this.nextLabel = 0;
    this.petals = [];
    this.archH = run.route === 'yang' ? 165 : 125;
    this.endX = START + COUNT * (SPAN + GAP) + 500;
    const worldW = this.endX + W;
    this.cameras.main.setBounds(0, 0, worldW, H);

    this.paintWorld(worldW);

    const mk = (look: (typeof LOOKS)['me'], x: number, scale: number, depth: number): Body => {
      const cy = new Cyclist(this, look, scale);
      cy.g.setDepth(depth);
      return { cy, x, y: BASE, s: 160, vy: 0, air: false, airT: 0, angle: 0 };
    };
    this.bodies = {
      koko: mk(LOOKS.koko, 120, 0.92, 30),
      gogo: mk(LOOKS.gogo, 260, 0.96, 31),
      me: mk(LOOKS.me, 400, 1, 32),
    };

    // HUD
    i18nText(this, W / 2, 46, () => t(run.route === 'yang' ? 'dream.yang' : 'dream.su'), {
      fontFamily: FONT_SERIF,
      fontSize: '34px',
      color: '#5b3a5e',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(900);
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 98, () => t(touch ? 'dream.hintTouch' : 'dream.hintKeys'), {
      fontSize: '21px',
      color: '#fff8ee',
      backgroundColor: '#5b3a5ecc',
      padding: { x: 16, y: 8 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(900);
    this.tweens.add({ targets: hint, alpha: 0, delay: 6000, duration: 1000 });

    this.pedalBtn = makeButton(this, 140, H - 66, () => t('ride.btnPedal'), {
      width: 200, height: 76, fontSize: 28, fixed: true, depth: 905, fillAlpha: 0.8,
    });
    const kb = this.input.keyboard!;
    this.keyRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // dreamy vignette
    const v = this.add.graphics().setScrollFactor(0).setDepth(800);
    v.fillStyle(0xf6c6e0, 0.12);
    v.fillRect(0, 0, W, H);

    this.cameras.main.fadeIn(1000, 250, 214, 230);
  }

  private paintWorld(worldW: number): void {
    // pastel dream sky
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-100);
    sky.fillGradientStyle(0xd9c8f0, 0xd9c8f0, 0xffe1ea, 0xffe1ea, 1);
    sky.fillRect(0, 0, W, WATER);
    sky.fillStyle(0xfff3d6, 0.7);
    sky.fillCircle(W * 0.2, 150, 60);

    const hills = this.add.graphics().setScrollFactor(0.12, 0).setDepth(-90);
    hills.fillStyle(0xc6b3d9, 0.8);
    hills.fillPoints(hillPolygon(W + worldW * 0.12 + 40, 380, 70, WATER, 12), true);
    const hills2 = this.add.graphics().setScrollFactor(0.25, 0).setDepth(-89);
    hills2.fillStyle(0xb5a6cc, 0.8);
    hills2.fillPoints(hillPolygon(W + worldW * 0.25 + 40, 430, 40, WATER, 13), true);

    const water = this.add.graphics().setScrollFactor(0).setDepth(-80);
    water.fillGradientStyle(0xbcd7e8, 0xbcd7e8, 0x9cbfd8, 0x9cbfd8, 1);
    water.fillRect(0, 460, W, H - 460);
    this.add.tileSprite(0, 460, W, H - 460, 'ripples').setOrigin(0).setScrollFactor(0).setDepth(-79).setName('ripples');

    // trees on the causeway: "一株杨柳一株桃"
    const r = rng(31);
    for (let x = 100; x < worldW; x += 160 + r() * 120) {
      if (Math.abs(this.ground(x) - BASE) > 1 || Math.abs(this.ground(x + 90) - BASE) > 1 || Math.abs(this.ground(x - 90) - BASE) > 1) continue;
      const key = r() < 0.5 ? 'willow' : 'peach';
      this.add.image(x, BASE + 4, key).setOrigin(0.5, 1).setScale(key === 'willow' ? 0.7 : 0.9).setDepth(5);
    }

    // causeway body and bridges
    const g = this.add.graphics().setDepth(10);
    const top: Phaser.Math.Vector2[] = [];
    for (let x = 0; x <= worldW; x += 6) top.push(new Phaser.Math.Vector2(x, this.ground(x)));
    g.fillStyle(0x9bb87a, 1);
    g.fillRect(0, BASE, worldW, WATER - BASE);
    g.fillStyle(0x86a46a, 1);
    g.fillRect(0, WATER - 10, worldW, 10);

    for (let i = 0; i < COUNT; i++) {
      const x0 = START + i * (SPAN + GAP);
      const pts = [new Phaser.Math.Vector2(x0 - 10, WATER)];
      for (let x = x0 - 10; x <= x0 + SPAN + 10; x += 6) pts.push(new Phaser.Math.Vector2(x, this.ground(x)));
      pts.push(new Phaser.Math.Vector2(x0 + SPAN + 10, WATER));
      g.fillStyle(0xe4ddd0, 1);
      g.fillPoints(pts, true);
      // arch opening and its reflection
      const cx = x0 + SPAN / 2;
      const rx = SPAN * 0.26;
      const ry = Math.min(this.archH * 0.75, 110);
      g.fillStyle(0x9cbfd8, 1);
      g.slice(cx, WATER, rx, Math.PI, 0, false);
      g.fillPath();
      g.fillStyle(0xe4ddd0, 0.35);
      g.fillEllipse(cx, WATER + 20, rx * 2, 26);
      g.lineStyle(3, 0xbfb6a6, 1);
      g.beginPath();
      g.arc(cx, WATER, rx + 8, Math.PI, 0, false);
      g.strokePath();
      // keep ry used for the arch rim scale
      g.lineStyle(1, 0xbfb6a6, 0.6);
      g.strokeEllipse(cx, WATER, rx * 2 + 34, Math.min(ry * 2, (rx + 17) * 2));
      // railing posts
      g.lineStyle(3, 0xcfc6b6, 1);
      for (let x = x0; x <= x0 + SPAN; x += 28) {
        const y = this.ground(x);
        g.lineBetween(x, y, x, y - 18);
      }
    }
    // railing line along the whole top
    g.lineStyle(3, 0xcfc6b6, 1);
    g.strokePoints(top.map((p) => new Phaser.Math.Vector2(p.x, p.y - 18)), false, false);

    // drifting peach petals
    for (let i = 0; i < 18; i++) {
      const p = this.add
        .image(r() * W, r() * H, 'sparkle')
        .setScrollFactor(0)
        .setDepth(700)
        .setTint(0xf7a8c4)
        .setScale(0.5 + r() * 0.5)
        .setAlpha(0.7);
      this.petals.push(p);
    }
  }

  private pop(text: string, x: number, y: number, color: string): void {
    const txt = this.add
      .text(x, y, text, baseStyle({ fontSize: '30px', color, fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6 }))
      .setOrigin(0.5)
      .setDepth(850);
    this.tweens.add({ targets: txt, y: y - 70, alpha: 0, duration: 1200, ease: 'Quad.easeOut', onComplete: () => txt.destroy() });
  }

  private step(b: Body, pedal: boolean, dt: number, isMe: boolean): void {
    if (!b.air) {
      const sl = this.slope(b.x);
      b.s += (pedal ? 320 : -30) * dt;
      b.s += (380 * sl) / Math.sqrt(1 + sl * sl) * dt; // gravity along the slope
      b.s = Phaser.Math.Clamp(b.s, 110, 640);
      const nx = b.x + b.s * dt;
      const crest = this.slope(b.x) < 0 && this.slope(nx) >= 0;
      if (crest && b.s > 300) {
        b.air = true;
        b.airT = 0;
        b.vy = -(b.s - 200) * 0.8;
        if (isMe) {
          sfx.whee();
          run.flights += 1;
          this.pop(t('dream.fly'), nx, b.y - 170, CSS.me);
        }
      } else {
        b.y = this.ground(nx);
      }
      b.x = nx;
      b.angle = Math.atan(this.slope(b.x));
    } else {
      b.airT += dt;
      b.vy += 1150 * dt;
      b.x += b.s * dt;
      b.y += b.vy * dt;
      b.angle = Phaser.Math.Linear(b.angle, Math.atan2(b.vy, b.s) * 0.6, 0.1);
      const gy = this.ground(b.x);
      if (b.y >= gy && b.vy > 0) {
        b.y = gy;
        b.air = false;
        if (isMe && b.airT > 0.75) this.pop(t('dream.high'), b.x, b.y - 170, '#7d3c98');
      }
    }
    b.cy.roll(b.s * dt, pedal || b.air);
    b.cy.g.setPosition(b.x, b.y).setRotation(b.angle);
    b.cy.draw();
  }

  update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 40) / 1000;
    const { me, gogo, koko } = this.bodies;
    const pedal = !this.finished && (this.keyRight.isDown || this.keyD.isDown || this.pedalBtn.isDown());
    this.step(me, pedal, dt, true);
    // friends try to keep up with me
    this.step(gogo, gogo.x < me.x - 150, dt, false);
    this.step(koko, koko.x < me.x - 290, dt, false);

    const cam = this.cameras.main;
    cam.scrollX = Phaser.Math.Clamp(me.x - 480, 0, this.endX + W - W);
    (this.children.getByName('ripples') as Phaser.GameObjects.TileSprite).tilePositionX = cam.scrollX * 0.6 + time * 0.01;

    for (const p of this.petals) {
      p.x -= 0.6 + (me.s / 600) * 2;
      p.y += 0.4;
      p.angle += 1;
      if (p.x < -10) p.x = W + 10;
      if (p.y > H) p.y = -10;
    }

    // bridge name cards
    if (this.nextLabel < COUNT && me.x > START + this.nextLabel * (SPAN + GAP) - 260) {
      const idx = this.nextLabel + 1;
      const key = `dream.${run.route}${idx}` as StrKey;
      const label = i18nText(this, W / 2, 160, () => t(key), {
        fontFamily: FONT_SERIF,
        fontSize: '30px',
        color: '#5b3a5e',
        backgroundColor: '#fff6faee',
        padding: { x: 20, y: 8 },
      })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(900)
        .setAlpha(0);
      this.tweens.add({ targets: label, alpha: 1, yoyo: true, hold: 1400, duration: 400, onComplete: () => label.destroy() });
      this.nextLabel += 1;
    }

    if (!this.finished && me.x >= this.endX) {
      this.finished = true;
      this.cameras.main.fadeOut(1200, 250, 214, 230);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.start('Pavilion', { part: 2 }),
      );
    }
  }
}

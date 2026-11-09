import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, CSS, FONT_SERIF, C } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { paintBackdrop, type Backdrop } from '../art/backdrop';
import { Cyclist, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { i18nText, onLang, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { run, nextPhotoKey } from '../core/state';
import { sfx } from '../core/sfx';

const WORLD = 10400;
const PAVILION_X = 9950;
const PATH_TOP = 596;
const LANE = { koko: 640, gogo: 656, me: 674 };
const SCREEN_X = 360; // where "me" sits on screen
const VIEW = new Phaser.Geom.Rectangle(560, 350, 340, 240); // camera viewfinder (screen space)
const MAX_SPEED = 330;
const AIM_SPEED = 220;

interface Target {
  img: Phaser.GameObjects.Image;
  sparkle: Phaser.GameObjects.Image;
  shot: boolean;
}

interface Bubble {
  who: 'gogo' | 'koko';
  box: Phaser.GameObjects.Container;
  until: number;
}

export class RideScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private me!: Cyclist;
  private gogo!: Cyclist;
  private koko!: Cyclist;
  private pos = { me: 0, gogo: 0, koko: 0 };
  private speed = 0;
  private targets: Target[] = [];
  private keys!: Record<'right' | 'd' | 'left' | 'a' | 'space', Phaser.Input.Keyboard.Key>;
  private pedalBtn!: Button;
  private photoBtn!: Button;
  private viewfinder!: Phaser.GameObjects.Graphics;
  private flash!: Phaser.GameObjects.Rectangle;
  private toast!: Phaser.GameObjects.Text;
  private counter!: Phaser.GameObjects.Text;
  private progressDot!: Phaser.GameObjects.Arc;
  private aiming = false;
  private aimedOnce = false;
  private lastSnap = 0;
  private arriving = false;
  private finished = false;
  private bubbles: Bubble[] = [];
  private triggers: { x: number; who: 'gogo' | 'koko'; key: StrKey; done: boolean }[] = [];

  constructor() {
    super('Ride');
  }

  create(): void {
    this.targets = [];
    music.play('lake');
    this.bubbles = [];
    this.speed = 0;
    this.aiming = false;
    this.aimedOnce = false;
    this.arriving = false;
    this.finished = false;
    this.pos = { me: 300, gogo: 470, koko: 140 };

    this.cameras.main.setBounds(0, 0, WORLD, H);
    this.backdrop = paintBackdrop(this, { worldWidth: WORLD, horizon: 300, lakeBottom: PATH_TOP + 4 });
    this.buildLotusFields();
    this.buildBank();

    this.koko = new Cyclist(this, LOOKS.koko, 0.9);
    this.koko.g.setDepth(30);
    this.gogo = new Cyclist(this, LOOKS.gogo, 0.95);
    this.gogo.g.setDepth(31);
    this.me = new Cyclist(this, LOOKS.me, 1);
    this.me.g.setDepth(32);

    this.buildHud();
    this.setupInput();

    this.triggers = [
      { x: 420, who: 'gogo', key: 'ride.f1', done: false },
      { x: 1500, who: 'koko', key: 'ride.f2', done: false },
      { x: 4300, who: 'gogo', key: 'ride.f3', done: false },
      { x: 5900, who: 'koko', key: 'ride.f4', done: false },
      { x: 9050, who: 'gogo', key: 'ride.f5', done: false },
    ];

    this.cameras.main.fadeIn(900, 255, 255, 255);
  }

  // ---------------------------------------------------------------- world

  private buildLotusFields(): void {
    const r = rng(2024);
    const leafKeys = ['leaf1', 'leaf2', 'leaf3'];

    // back field — small, hazy, slow parallax
    const backF = 0.55;
    for (let x = -40; x < W + WORLD * backF; x += 26 + r() * 22) {
      const y = 390 + r() * 70;
      const key = r() < 0.5 ? 'leafFlat' : leafKeys[Math.floor(r() * 3)];
      this.add
        .image(x, y, key)
        .setOrigin(0.5, 1)
        .setScale(0.28 + (y - 390) / 70 * 0.18)
        .setScrollFactor(backF, 1)
        .setDepth(1)
        .setAlpha(0.8);
      if (r() < 0.06) {
        this.add.image(x + 10, y - 4, r() < 0.5 ? 'bud' : 'bloomFull').setOrigin(0.5, 1).setScale(0.3).setScrollFactor(backF, 1).setDepth(1).setAlpha(0.85);
      }
    }

    // middle field
    const midF = 0.8;
    for (let x = -40; x < W + WORLD * midF; x += 40 + r() * 30) {
      const y = 470 + r() * 60;
      this.add
        .image(x, y, leafKeys[Math.floor(r() * 3)])
        .setOrigin(0.5, 1)
        .setScale(0.5 + (y - 470) / 60 * 0.2)
        .setScrollFactor(midF, 1)
        .setDepth(2)
        .setAngle((r() - 0.5) * 12);
      if (r() < 0.1) {
        const f = this.add.image(x + 18, y + 4, r() < 0.5 ? 'bud' : 'bloomFull').setOrigin(0.5, 1).setScale(0.55).setScrollFactor(midF, 1).setDepth(2);
        this.tweens.add({ targets: f, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1800 + r() * 1400 });
      }
    }

    // front field — scroll factor 1, this is where the photo targets grow
    for (let x = -40; x < WORLD + 100; x += 52 + r() * 40) {
      const y = PATH_TOP + 10 + r() * 6;
      this.add
        .image(x, y, leafKeys[Math.floor(r() * 3)])
        .setOrigin(0.5, 1)
        .setScale(0.82 + r() * 0.3)
        .setDepth(5)
        .setAngle((r() - 0.5) * 14);
      if (r() < 0.08) {
        const f = this.add.image(x + 20, y, 'bud').setOrigin(0.5, 1).setScale(0.8 + r() * 0.2).setDepth(5);
        this.tweens.add({ targets: f, angle: { from: -2.5, to: 2.5 }, yoyo: true, repeat: -1, duration: 2000 + r() * 1400 });
      }
    }

    // ten "just opening" blossoms (初绽) to photograph
    let x = 1150;
    for (let i = 0; i < 10; i++) {
      const key = i % 3 === 2 ? 'bloomFull' : 'bloomHalf';
      const img = this.add.image(x, PATH_TOP + 12, key).setOrigin(0.5, 1).setScale(1.05).setDepth(6);
      this.tweens.add({ targets: img, angle: { from: -3.5, to: 3.5 }, yoyo: true, repeat: -1, duration: 1700 + i * 130, ease: 'Sine.easeInOut' });
      const sparkle = this.add.image(x + 26, this.headY(img) - 28, 'sparkle').setDepth(7).setAlpha(0.9);
      this.tweens.add({ targets: sparkle, scale: { from: 0.5, to: 1.15 }, alpha: { from: 0.4, to: 1 }, yoyo: true, repeat: -1, duration: 650 });
      this.targets.push({ img, sparkle, shot: false });
      x += 760 + r() * 120;
    }
  }

  private headY(img: Phaser.GameObjects.Image): number {
    return img.y - (img.height - 76) * img.scaleY;
  }

  private buildBank(): void {
    const r = rng(77);
    // willows along the bank, kept clear of the photo targets
    for (let x = 820; x < PAVILION_X - 300; x += 640 + r() * 400) {
      if (this.targets.some((tg) => Math.abs(tg.img.x - x) < 230)) continue;
      this.add.image(x, PATH_TOP + 8, 'willow').setOrigin(0.5, 1).setScale(0.95 + r() * 0.2).setDepth(8);
    }

    // stone stele with the scenic-spot inscription (always in Chinese, as carved)
    this.add.image(660, PATH_TOP + 6, 'stele').setOrigin(0.5, 1).setDepth(8);
    this.add
      .text(660, PATH_TOP - 112, '曲\n院\n风\n荷', baseStyle({ fontFamily: FONT_SERIF, fontSize: '30px', color: '#8a2a1e', align: 'center', lineSpacing: 2 }))
      .setOrigin(0.5)
      .setDepth(9);
    i18nText(this, 660, PATH_TOP + 16, () => t('ride.signSub'), { fontSize: '15px', color: CSS.muted })
      .setOrigin(0.5, 0)
      .setDepth(11);

    // the pavilion at the end of the ride
    this.add.image(PAVILION_X + 120, PATH_TOP + 18, 'pavilion').setOrigin(0.5, 1).setDepth(8);

    // path and grass verge (screen-fixed tile that scrolls with the camera)
    this.add.tileSprite(0, PATH_TOP, W, 96, 'path').setOrigin(0).setScrollFactor(0).setDepth(10).setName('path');
    const verge = this.add.graphics().setScrollFactor(0).setDepth(10);
    verge.fillStyle(C.grass, 1);
    verge.fillRect(0, PATH_TOP + 92, W, H - PATH_TOP - 92);
  }

  // ---------------------------------------------------------------- HUD + input

  private buildHud(): void {
    const D = 900;
    const pill = this.add.graphics().setScrollFactor(0).setDepth(D);
    const chapter = i18nText(this, 40, 38, () => t('ch1.name'), { fontFamily: FONT_SERIF, fontSize: '24px' })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(D + 1);
    const drawPill = () => {
      pill.clear();
      pill.fillStyle(0xf6f1e7, 0.85);
      pill.fillRoundedRect(22, 16, chapter.width + 36, 44, 20);
    };
    drawPill();
    onLang(this, drawPill);

    this.counter = i18nText(this, W - 282, 38, () => t('ride.photos', { n: run.photoKeys.length, total: this.targets.length }), {
      fontSize: '24px',
      backgroundColor: '#f6f1e7cc',
      padding: { x: 14, y: 8 },
    })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(D + 1);

    // progress strip toward the pavilion
    const strip = this.add.graphics().setScrollFactor(0).setDepth(D);
    strip.lineStyle(4, 0x2f3b3a, 0.35);
    strip.lineBetween(470, 38, 790, 38);
    strip.fillStyle(C.wood, 1);
    strip.fillTriangle(790, 26, 778, 36, 802, 36);
    strip.fillRect(782, 36, 16, 8);
    this.progressDot = this.add.circle(470, 38, 8, 0xc0392b).setScrollFactor(0).setDepth(D + 1);

    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 96, () => t(touch ? 'ride.hintTouch' : 'ride.hintKeys'), {
      fontSize: '21px',
      backgroundColor: '#2f3b3acc',
      color: '#fff8ee',
      padding: { x: 16, y: 8 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(D + 1);
    this.tweens.add({ targets: hint, alpha: 0, delay: 9000, duration: 1200 });

    this.toast = this.add
      .text(W / 2, 150, '', baseStyle({ fontSize: '26px', color: '#fff8ee', backgroundColor: '#c0392bdd', padding: { x: 18, y: 10 } }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(D + 2)
      .setAlpha(0);

    // viewfinder
    const v = VIEW;
    const g = this.add.graphics().setScrollFactor(0).setDepth(D - 10).setVisible(false);
    g.lineStyle(2, 0xffffff, 0.75);
    g.strokeRect(v.x, v.y, v.width, v.height);
    g.lineStyle(5, 0xffffff, 1);
    const c = 30;
    for (const [x, y, dx, dy] of [
      [v.left, v.top, 1, 1],
      [v.right, v.top, -1, 1],
      [v.left, v.bottom, 1, -1],
      [v.right, v.bottom, -1, -1],
    ]) {
      g.lineBetween(x, y, x + dx * c, y);
      g.lineBetween(x, y, x, y + dy * c);
    }
    g.lineStyle(1.5, 0xffffff, 0.7);
    g.lineBetween(v.centerX - 12, v.centerY, v.centerX + 12, v.centerY);
    g.lineBetween(v.centerX, v.centerY - 12, v.centerX, v.centerY + 12);
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(v.left + 22, v.top + 22, 6);
    this.viewfinder = g;

    this.flash = this.add.rectangle(0, 0, W, H, 0xffffff, 1).setOrigin(0).setScrollFactor(0).setDepth(D + 50).setAlpha(0);

    this.pedalBtn = makeButton(this, 140, H - 66, () => t('ride.btnPedal'), {
      width: 200, height: 76, fontSize: 28, fixed: true, depth: D + 5, fillAlpha: 0.8,
    });
    this.photoBtn = makeButton(this, W - 140, H - 66, () => `◉ ${t('ride.btnPhoto')}`, {
      width: 200, height: 76, fontSize: 28, fixed: true, depth: D + 5, fillAlpha: 0.8, fill: 0xfbe3ec,
    });
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      right: kb.addKey(K.RIGHT),
      d: kb.addKey(K.D),
      left: kb.addKey(K.LEFT),
      a: kb.addKey(K.A),
      space: kb.addKey(K.SPACE),
    };
  }

  // ---------------------------------------------------------------- photos

  private setAiming(on: boolean): void {
    if (on === this.aiming) return;
    this.aiming = on;
    this.me.cameraUp = on;
    this.viewfinder.setVisible(on);
    if (on && !this.aimedOnce) {
      this.aimedOnce = true;
      this.showToast(t('ride.oneHand'), '#2471a3dd');
    }
    if (!on) {
      this.me.g.setRotation(0);
      this.snap();
    }
  }

  private snap(): void {
    const now = this.time.now;
    if (now - this.lastSnap < 350 || this.arriving) return;
    this.lastSnap = now;

    const scrollX = this.cameras.main.scrollX;
    const inner = new Phaser.Geom.Rectangle(VIEW.x + 18, VIEW.y + 18, VIEW.width - 36, VIEW.height - 36);
    const inFrame = this.targets.filter((tg) => inner.contains(tg.img.x - scrollX, this.headY(tg.img)));
    const fresh = inFrame.find((tg) => !tg.shot);

    sfx.shutter();
    const doFlash = () => {
      this.flash.setAlpha(0.85);
      this.tweens.add({ targets: this.flash, alpha: 0, duration: 260 });
    };

    if (fresh) {
      fresh.shot = true;
      this.tweens.killTweensOf(fresh.sparkle);
      this.tweens.add({ targets: fresh.sparkle, y: '-=40', alpha: 0, scale: 2, duration: 600 });
      const key = nextPhotoKey();
      this.game.renderer.snapshotArea(VIEW.x, VIEW.y, VIEW.width, VIEW.height, (snap) => {
        doFlash();
        if (snap instanceof HTMLImageElement) {
          const add = () => {
            if (!this.textures.exists(key)) this.textures.addImage(key, snap);
            if (!run.photoKeys.includes(key)) run.photoKeys.push(key);
            this.refreshCounter();
          };
          if (snap.complete) add();
          else snap.onload = add;
        }
      });
      this.showToast(t('ride.snapGood'), '#c0392bdd');
      if (!this.triggers[2].done) this.time.delayedCall(1400, () => this.fireTrigger(this.triggers[2]));
    } else {
      doFlash();
      this.showToast(t(inFrame.length ? 'ride.snapDup' : 'ride.snapMiss'), '#2f3b3acc');
    }
  }

  private refreshCounter(): void {
    this.counter.setText(t('ride.photos', { n: run.photoKeys.length, total: this.targets.length }));
  }

  private showToast(msg: string, bg: string): void {
    this.tweens.killTweensOf(this.toast);
    this.toast.setText(msg).setBackgroundColor(bg).setAlpha(1).setY(150);
    this.tweens.add({ targets: this.toast, alpha: 0, y: 130, delay: 1300, duration: 500 });
  }

  // ---------------------------------------------------------------- friends' lines

  private fireTrigger(tr: { who: 'gogo' | 'koko'; key: StrKey; done: boolean }): void {
    if (tr.done) return;
    tr.done = true;
    this.bubbles.forEach((b) => b.box.destroy());
    this.bubbles = [];
    const box = this.add.container(0, 0).setDepth(60);
    const bg = this.add.graphics();
    const txt = i18nText(this, 0, 0, () => t(tr.key), {
      fontSize: '21px',
      color: tr.who === 'gogo' ? CSS.gogo : CSS.koko,
      wordWrap: { width: 300, useAdvancedWrap: true },
      align: 'center',
    }).setOrigin(0.5, 1);
    const draw = () => {
      const w = txt.width + 30;
      const h = txt.height + 20;
      bg.clear();
      bg.fillStyle(0xffffff, 0.95);
      bg.fillRoundedRect(-w / 2, -h - 4, w, h, 14);
      bg.fillTriangle(-8, -5, 8, -5, 0, 8);
      bg.lineStyle(2, 0x2f3b3a, 0.4);
      bg.strokeRoundedRect(-w / 2, -h - 4, w, h, 14);
      txt.setY(-14);
    };
    draw();
    onLang(this, () => box.active && draw());
    box.add([bg, txt]);
    this.bubbles.push({ who: tr.who, box, until: this.time.now + 3600 });
    sfx.blip();
  }

  // ---------------------------------------------------------------- loop

  update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    const k = this.keys;

    const pedaling = !this.arriving && (k.right.isDown || k.d.isDown || this.pedalBtn.isDown());
    const braking = !this.arriving && (k.left.isDown || k.a.isDown);
    const wantAim = !this.arriving && (k.space.isDown || this.photoBtn.isDown());
    this.setAiming(wantAim);

    const max = this.aiming ? AIM_SPEED : MAX_SPEED;
    if (this.arriving) this.speed = Math.max(0, this.speed - 220 * dt);
    else if (pedaling) this.speed = Math.min(max, this.speed + 260 * dt);
    else this.speed = Math.max(0, this.speed - 60 * dt);
    if (braking) this.speed = Math.max(0, this.speed - 480 * dt);
    if (this.speed > max) this.speed = Math.max(max, this.speed - 300 * dt);

    const dx = this.speed * dt;
    this.pos.me = Math.min(this.pos.me + dx, PAVILION_X + 40);
    this.me.roll(dx, pedaling);

    // friends drift around their slots relative to me
    const s = time * 0.001;
    const gogoTarget = this.arriving ? PAVILION_X + 150 : this.pos.me + 170 + Math.sin(s * 0.7) * 60;
    const kokoTarget = this.arriving ? PAVILION_X - 120 : this.pos.me - 160 + Math.sin(s * 0.5 + 1) * 45;
    for (const [name, target] of [['gogo', gogoTarget], ['koko', kokoTarget]] as const) {
      const cy = this[name];
      const before = this.pos[name];
      const step = Phaser.Math.Clamp((target - before) * 2.2 * dt, -40 * dt, (this.speed + 120) * dt);
      this.pos[name] = before + step;
      const moved = this.pos[name] - before;
      cy.roll(Math.abs(moved), Math.abs(moved) > 0.2);
    }

    // place riders
    this.me.g.setPosition(this.pos.me, LANE.me);
    this.gogo.g.setPosition(this.pos.gogo, LANE.gogo);
    this.koko.g.setPosition(this.pos.koko, LANE.koko);
    if (this.aiming) this.me.g.setRotation(Math.sin(time * 0.012) * 0.035);
    this.me.draw();
    this.gogo.draw();
    this.koko.draw();

    // camera
    const cam = this.cameras.main;
    cam.scrollX = Phaser.Math.Clamp(this.pos.me - SCREEN_X, 0, WORLD - W);
    (this.children.getByName('path') as Phaser.GameObjects.TileSprite).tilePositionX = cam.scrollX;
    this.backdrop.update(time, cam.scrollX);
    this.progressDot.x = 470 + Phaser.Math.Clamp(this.pos.me / PAVILION_X, 0, 1) * 320;

    // story triggers
    for (const tr of this.triggers) if (!tr.done && this.pos.me >= tr.x) this.fireTrigger(tr);
    for (const b of this.bubbles) {
      const p = b.who === 'gogo' ? this.gogo : this.koko;
      b.box.setPosition(p.g.x + 10, p.g.y - 150);
      if (time > b.until) b.box.setAlpha(Math.max(0, b.box.alpha - dt * 3));
    }

    // arrive at the pavilion
    if (!this.arriving && this.pos.me >= PAVILION_X - 180) {
      this.arriving = true;
      this.setAiming(false);
      this.pedalBtn.setEnabled(false);
      this.photoBtn.setEnabled(false);
    }
    if (this.arriving && this.speed <= 1 && !this.finished) {
      this.finished = true;
      this.cameras.main.fadeOut(800, 246, 241, 231);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Pavilion', { part: 1 }));
    }
  }
}

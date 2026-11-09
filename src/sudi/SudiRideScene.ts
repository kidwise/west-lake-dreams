import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { i18nText, onLang, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { Cyclist, LOOKS, type Look } from '../art/Cyclist';
import { rng } from '../art/paint';
import { DawnSky } from './DawnSky';
import { makeSeal } from './art';
import { BASE, WATER, SPAN, BRIDGES, FINISH_X, WORLD_W, ground, slope, bridgeAt, type Bridge } from './causeway';
import { sudiRun, nextSudiKey } from './state';

const REFL = 0.42; // reflections are foreshortened on the water
const SCREEN_X = 420;
const OVERLAY_DEPTH = 500;
const HUD = 900;

interface Body {
  cy: Cyclist;
  refl: Cyclist;
  x: number;
  y: number;
  s: number;
  vy: number;
  air: boolean;
  airT: number;
  angle: number;
  lean: number;
  cap: number;
}

interface Petal {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  spin: number;
  /** Fixed petals hang in an arc over a bridge; loose ones drift down. */
  fixed: boolean;
  catkin: boolean;
}

/** 苏堤春晓: ride the six bridges from 映波 to 跨虹 as night turns to morning. */
export class SudiRideScene extends Phaser.Scene {
  private sky!: DawnSky;
  private me!: Body;
  private koko!: Body;
  private gogo!: Body;
  private tod = 0.06;
  private sunUp = false;
  private sunBoost = 0;
  private slow = 1;
  private paused = false;
  private keys!: Record<'right' | 'd' | 'down' | 's' | 'space', Phaser.Input.Keyboard.Key>;
  private btnPedal!: Button;
  private btnTuck!: Button;
  private btnPhoto!: Button;
  private petals: Petal[] = [];
  private peachXs: number[] = [];
  private willowXs: number[] = [];
  private spawnAt = 0;
  private lampGlows: Phaser.GameObjects.Graphics[] = [];
  private guide!: Phaser.GameObjects.Graphics;
  private windG!: Phaser.GameObjects.Graphics;
  private gustOn = false;
  private gustUntil = 0;
  private nextGust = 0;
  private sealSlots: { x: number; y: number; filled: boolean }[] = [];
  private stamped = [false, false, false, false, false, false];
  private carded = [false, false, false, false, false, false];
  private petalText!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private flash!: Phaser.GameObjects.Rectangle;
  private viewfinder!: Phaser.GameObjects.Graphics;
  private raceG!: Phaser.GameObjects.Graphics;
  private rainbow!: Phaser.GameObjects.Graphics;
  private bubbles: { who: Body; box: Phaser.GameObjects.Container; until: number }[] = [];
  private ev = {
    reflectShot: false,
    windWarned: false,
    hillsActive: false,
    hillsUntil: 0,
    race: 'none' as 'none' | 'countdown' | 'on' | 'done',
    sunrise: false,
    rainbowPassed: false,
    finished: false,
    finishAt: 0,
  };
  private egrets: Phaser.GameObjects.Image[] = [];
  private petalCombo = 0;
  private lastCatch = 0;

  constructor() {
    super('SudiRide');
  }

  create(): void {
    music.play('sudiRide');
    this.tod = 0.06;
    this.sunUp = false;
    this.sunBoost = 0;
    this.slow = 1;
    this.paused = false;
    this.petals = [];
    this.peachXs = [];
    this.willowXs = [];
    this.lampGlows = [];
    this.sealSlots = [];
    this.bubbles = [];
    this.egrets = [];
    this.stamped = [false, false, false, false, false, false];
    this.carded = [false, false, false, false, false, false];
    this.ev = { reflectShot: false, windWarned: false, hillsActive: false, hillsUntil: 0, race: 'none', sunrise: false, rainbowPassed: false, finished: false, finishAt: 0 };
    Object.assign(sudiRun, { seals: 0, petals: 0, perfect: 0, airTime: 0, rank: 0 });

    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.sky = new DawnSky(this, WORLD_W, OVERLAY_DEPTH);
    this.buildCauseway();
    this.buildPetalArcs();
    this.buildRiders();
    this.buildHud();
    this.setupInput();

    this.guide = this.add.graphics().setDepth(OVERLAY_DEPTH + 20);
    this.windG = this.add.graphics().setScrollFactor(0).setDepth(OVERLAY_DEPTH + 15);
    this.rainbow = this.add.graphics().setDepth(OVERLAY_DEPTH + 3).setAlpha(0);
    this.drawRainbow();

    this.cameras.main.fadeIn(1000, 20, 28, 60);
  }

  // ------------------------------------------------------------------ world

  private buildCauseway(): void {
    const body = this.add.graphics().setDepth(10);
    const refl = this.add.graphics().setDepth(38).setAlpha(0.32);
    const mirror = (y: number) => WATER + (WATER - y) * REFL;

    // flat stretches of causeway between the bridges
    const flats: [number, number][] = [];
    let x = -50;
    for (const b of BRIDGES) {
      flats.push([x, b.x0]);
      x = b.x0 + SPAN;
    }
    flats.push([x, WORLD_W + 50]);
    for (const [a, b] of flats) {
      body.fillStyle(0x6f8a58, 1);
      body.fillRect(a, BASE, b - a, WATER - BASE);
      body.fillStyle(0x5b7448, 1);
      body.fillRect(a, WATER - 16, b - a, 16);
      body.fillStyle(0x9a8f7c, 1);
      body.fillRect(a, WATER - 6, b - a, 6);
      body.fillStyle(0xd9ccb4, 1);
      body.fillRect(a, BASE - 2, b - a, 9);
      refl.fillStyle(0x56704a, 1);
      refl.fillRect(a, WATER, b - a, (WATER - BASE) * REFL);
    }

    // the six single-arch stone bridges
    for (const br of BRIDGES) {
      const cx = br.x0 + SPAN / 2;
      const R = SPAN * 0.29;
      const outline: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(br.x0 - 12, WATER)];
      for (let px = br.x0 - 12; px <= br.x0 + SPAN + 12; px += 6) outline.push(new Phaser.Math.Vector2(px, ground(px) + 2));
      outline.push(new Phaser.Math.Vector2(br.x0 + SPAN + 12, WATER));
      outline.push(new Phaser.Math.Vector2(cx + R, WATER));
      for (let a = 0; a <= Math.PI; a += Math.PI / 24) outline.push(new Phaser.Math.Vector2(cx + Math.cos(a) * R, WATER - Math.sin(a) * R * 0.95));
      outline.push(new Phaser.Math.Vector2(cx - R, WATER));
      body.fillStyle(0xd8d0c0, 1);
      body.fillPoints(outline, true);
      // arch ring stones
      body.lineStyle(5, 0xb9ae9a, 1);
      body.beginPath();
      for (let a = 0; a <= Math.PI + 0.01; a += Math.PI / 24) {
        const px = cx + Math.cos(a) * (R + 4);
        const py = WATER - Math.sin(a) * (R + 4) * 0.95;
        if (a === 0) body.moveTo(px, py);
        else body.lineTo(px, py);
      }
      body.strokePath();
      // railings
      body.lineStyle(3, 0xe9e3d6, 1);
      body.strokePoints(
        Array.from({ length: 60 }, (_, i) => {
          const px = br.x0 - 6 + ((SPAN + 12) * i) / 59;
          return new Phaser.Math.Vector2(px, ground(px) - 20);
        }),
        false,
        false,
      );
      for (let px = br.x0; px <= br.x0 + SPAN; px += 30) {
        body.fillStyle(0xe9e3d6, 1);
        body.fillRect(px - 3, ground(px) - 24, 6, 24);
      }
      // reflection (arch + reflection make a squashed circle)
      refl.fillStyle(0xb9b2a4, 1);
      refl.fillPoints(outline.map((p) => new Phaser.Math.Vector2(p.x, mirror(p.y))), true);

      // name stele at the south end of the bridge (inscribed in Chinese)
      this.add.image(br.x0 - 70, BASE + 4, 'stele').setOrigin(0.5, 1).setScale(0.42).setDepth(13);
      this.add
        .text(br.x0 - 70, BASE - 48, Array.from(`${br.seal}桥`).join('\n'), baseStyle({ fontFamily: FONT_SERIF, fontSize: '13px', color: '#7a2a1e', align: 'center', lineSpacing: -2 }))
        .setOrigin(0.5)
        .setDepth(14);
    }

    // 一株杨柳一株桃: willows and peach trees along the flats, and a few lamps
    const r = rng(29);
    let willow = true;
    for (const [a, b] of flats) {
      for (let tx = a + 90; tx < b - 90; tx += 140 + r() * 50) {
        const key = willow ? 'willow' : 'peach';
        this.add.image(tx, BASE + 6, key).setOrigin(0.5, 1).setScale(willow ? 0.74 + r() * 0.1 : 0.95 + r() * 0.12).setDepth(5);
        (willow ? this.willowXs : this.peachXs).push(tx);
        willow = !willow;
      }
      const mid = (a + b) / 2;
      if (b - a > 500 && mid > 0 && mid < WORLD_W) {
        this.add.image(mid, BASE + 4, 'sudiLantern').setOrigin(0.5, 1).setScale(0.8).setDepth(14);
        const glow = this.add.graphics().setDepth(OVERLAY_DEPTH + 10).setBlendMode(Phaser.BlendModes.ADD);
        for (const [rad, al] of [[70, 0.06], [38, 0.13], [18, 0.32]]) {
          glow.fillStyle(0xffb36b, al);
          glow.fillCircle(mid + 13, BASE - 100, rad);
        }
        this.lampGlows.push(glow);
      }
    }
  }

  /** Petals hanging in an arc over each bridge: catch them in flight. */
  private buildPetalArcs(): void {
    for (const br of BRIDGES) {
      const crestX = br.x0 + SPAN / 2;
      const crestY = BASE - br.height;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const px = crestX - 40 + u * 330;
        const py = crestY - 70 - Math.sin(u * Math.PI) * (40 + br.height * 0.35);
        const img = this.add.image(px, py, 'sudiPetal').setDepth(35).setScale(1.3);
        this.tweens.add({ targets: img, y: py - 6, angle: 20, yoyo: true, repeat: -1, duration: 900 + i * 60 });
        this.petals.push({ img, vx: 0, vy: 0, spin: 0, fixed: true, catkin: false });
      }
    }
  }

  private buildRiders(): void {
    const mk = (look: Look, x: number, scale: number, depth: number, cap: number): Body => {
      const cy = new Cyclist(this, look, scale);
      cy.g.setDepth(depth);
      const refl = new Cyclist(this, look, scale);
      refl.g.setDepth(39).setAlpha(0.3);
      return { cy, refl, x, y: BASE, s: 150, vy: 0, air: false, airT: 0, angle: 0, lean: 0, cap };
    };
    this.gogo = mk(LOOKS.gogo, 120, 0.9, 30, 640);
    this.koko = mk(LOOKS.koko, 250, 0.9, 31, 640);
    this.me = mk(LOOKS.me, 380, 0.95, 32, 660);
  }

  // ------------------------------------------------------------------ HUD

  private buildHud(): void {
    const pill = this.add.graphics().setScrollFactor(0).setDepth(HUD);
    const chapter = i18nText(this, 36, 38, () => t('sudi.chapter'), { fontFamily: FONT_SERIF, fontSize: '21px' })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD + 1);
    const drawPill = () => {
      pill.clear();
      pill.fillStyle(0xf6f1e7, 0.85);
      pill.fillRoundedRect(20, 18, chapter.width + 32, 40, 18);
    };
    drawPill();
    onLang(this, drawPill);

    // six seal slots
    const slotG = this.add.graphics().setScrollFactor(0).setDepth(HUD);
    BRIDGES.forEach((b, i) => {
      const x = 440 + i * 56;
      const y = 40;
      slotG.fillStyle(0xf6f1e7, 0.55);
      slotG.fillRoundedRect(x - 22, y - 22, 44, 44, 6);
      slotG.lineStyle(1.5, 0xb8322a, 0.6);
      slotG.strokeRoundedRect(x - 22, y - 22, 44, 44, 6);
      this.add
        .text(x, y, Array.from(b.seal).join('\n'), baseStyle({ fontFamily: FONT_SERIF, fontSize: '13px', color: '#b8322a', align: 'center', lineSpacing: -3 }))
        .setOrigin(0.5)
        .setAlpha(0.45)
        .setScrollFactor(0)
        .setDepth(HUD + 1);
      this.sealSlots.push({ x, y, filled: false });
    });

    // petal counter
    this.add.image(W - 336, 40, 'sudiPetal').setScrollFactor(0).setDepth(HUD + 1).setScale(1.5).setAngle(-20);
    this.petalText = this.add
      .text(W - 320, 40, '0', baseStyle({ fontSize: '24px', color: '#fdf2f6', stroke: '#7a3550', strokeThickness: 4, fontStyle: 'bold' }))
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD + 1);

    this.raceG = this.add.graphics().setScrollFactor(0).setDepth(HUD);

    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 104, () => t(touch ? 'sudi.hintTouch' : 'sudi.hintKeys'), {
      fontSize: '18px',
      color: '#fff8ee',
      backgroundColor: '#1b2238cc',
      padding: { x: 14, y: 6 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD + 1);
    this.tweens.add({ targets: hint, alpha: 0, delay: 8000, duration: 1000 });

    this.toast = this.add
      .text(W / 2, 156, '', baseStyle({ fontSize: '24px', color: '#fff8ee', backgroundColor: '#b8322add', padding: { x: 16, y: 8 } }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD + 3)
      .setAlpha(0);
    this.flash = this.add.rectangle(0, 0, W, H, 0xffffff, 1).setOrigin(0).setScrollFactor(0).setDepth(HUD + 50).setAlpha(0);
    this.viewfinder = this.add.graphics().setScrollFactor(0).setDepth(HUD - 5).setVisible(false);

    this.btnPedal = makeButton(this, 130, H - 62, () => t('sudi.btnPedal'), { width: 180, height: 74, fontSize: 28, fixed: true, depth: HUD + 5, fillAlpha: 0.82 });
    this.btnTuck = makeButton(this, 330, H - 62, () => t('sudi.btnTuck'), { width: 160, height: 74, fontSize: 28, fixed: true, depth: HUD + 5, fillAlpha: 0.82, fill: 0xdbeaf6 });
    this.btnPhoto = makeButton(this, W - 130, H - 62, () => `◉ ${t('sudi.btnPhoto')}`, {
      width: 180,
      height: 74,
      fontSize: 26,
      fixed: true,
      depth: HUD + 5,
      fillAlpha: 0.82,
      fill: 0xfbe3ec,
      onDown: () => this.takeHillsPhoto(),
    });
    this.btnPhoto.container.setAlpha(0.35);
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = { right: kb.addKey(K.RIGHT), d: kb.addKey(K.D), down: kb.addKey(K.DOWN), s: kb.addKey(K.S), space: kb.addKey(K.SPACE) };
    kb.on('keydown-SPACE', () => this.takeHillsPhoto());
  }

  private showToast(msg: string, bg = '#b8322add', ms = 1600): void {
    this.tweens.killTweensOf(this.toast);
    this.toast.setText(msg).setBackgroundColor(bg).setAlpha(1).setY(156);
    this.tweens.add({ targets: this.toast, alpha: 0, y: 140, delay: ms, duration: 500 });
  }

  private pop(text: string, x: number, y: number, color: string, size = 28): void {
    const txt = this.add
      .text(x, y, text, baseStyle({ fontSize: `${size}px`, color, fontStyle: 'bold', stroke: '#1b2238', strokeThickness: 6 }))
      .setOrigin(0.5)
      .setDepth(HUD - 2);
    this.tweens.add({ targets: txt, y: y - 70, alpha: 0, duration: 1300, ease: 'Quad.easeOut', onComplete: () => txt.destroy() });
  }

  private say(who: Body, key: StrKey, ms = 2600): void {
    const color = who === this.koko ? CSS.koko : who === this.gogo ? CSS.gogo : CSS.me;
    const bg = this.add.graphics();
    const txt = i18nText(this, 0, -14, () => t(key), { fontSize: '19px', color, wordWrap: { width: 280, useAdvancedWrap: true }, align: 'center' }).setOrigin(0.5, 1);
    const draw = () => {
      const w = txt.width + 26;
      const h = txt.height + 18;
      bg.clear();
      bg.fillStyle(0xffffff, 0.95);
      bg.fillRoundedRect(-w / 2, -h - 6, w, h, 12);
      bg.fillTriangle(-8, -7, 8, -7, 0, 6);
    };
    draw();
    onLang(this, () => bg.active && draw());
    const box = this.add.container(0, 0, [bg, txt]).setDepth(HUD - 3);
    this.bubbles.push({ who, box, until: this.time.now + ms });
    sfx.blip();
  }

  // ------------------------------------------------------------------ events

  private bridgeCard(i: number): void {
    this.carded[i] = true;
    const b = BRIDGES[i];
    const name = i18nText(this, W / 2, 214, () => t(`sudi.b${i + 1}` as StrKey), {
      fontFamily: FONT_SERIF,
      fontSize: '40px',
      color: '#fff8ee',
      stroke: '#1b2238',
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD + 2)
      .setAlpha(0);
    const seal = makeSeal(this, W / 2 + name.width / 2 + 44, 214, b.seal, 46).setScrollFactor(0).setDepth(HUD + 2).setAlpha(0).setAngle(-6);
    this.tweens.add({ targets: [name, seal], alpha: 1, yoyo: true, hold: 1800, duration: 450, onComplete: () => {
      name.destroy();
      seal.destroy();
    } });
    const touch = this.sys.game.device.input.touch;
    const hints: (StrKey | null)[] = ['sudi.ev1', touch ? 'sudi.ev2touch' : 'sudi.ev2', touch ? 'sudi.ev3touch' : 'sudi.ev3', null, null, 'sudi.ev6'];
    const h = hints[i];
    if (h && !(i === 5 && !this.sunUp)) this.time.delayedCall(900, () => this.showToast(t(h), '#1b2238dd', 2600));
  }

  private stampBridge(i: number): void {
    this.stamped[i] = true;
    sudiRun.seals += 1;
    const slot = this.sealSlots[i];
    const cam = this.cameras.main;
    const seal = makeSeal(this, this.me.x - cam.scrollX, this.me.y - 160, BRIDGES[i].seal, 64).setScrollFactor(0).setDepth(HUD + 4).setScale(1.4);
    this.tweens.add({
      targets: seal,
      x: slot.x,
      y: slot.y,
      scale: 44 / 64,
      angle: -8,
      duration: 650,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        sfx.stamp();
        slot.filled = true;
        this.tweens.add({ targets: seal, scale: { from: 0.9, to: 44 / 64 }, duration: 160 });
      },
    });
  }

  private onLaunch(b: Body): void {
    sfx.whee();
    this.pop(t('sudi.fly'), b.x, b.y - 180, '#ffd1e0');
    const br = bridgeAt(b.x - 10) ?? BRIDGES.find((x) => Math.abs(x.x0 + SPAN / 2 - b.x) < SPAN) ?? null;
    if (!br) return;
    if (br.index === 0 && !this.ev.reflectShot) this.reflectionShot();
    if (br.index === 4 && !this.ev.sunrise) void this.sunriseCutaway();
  }

  private onLand(b: Body): void {
    sudiRun.airTime += b.airT;
    const sl = Math.atan(slope(b.x));
    const diff = Math.abs(b.angle - sl);
    if (diff < 0.3) {
      sudiRun.perfect += 1;
      b.s = Math.min(b.cap, b.s + 60);
      sfx.bell();
      this.pop(t('sudi.perfect'), b.x, b.y - 150, '#a8f0c0', 26);
    } else if (diff > 0.65) {
      b.s *= 0.55;
      this.cameras.main.shake(220, 0.006);
      this.pop(t('sudi.wobble'), b.x, b.y - 150, '#ffb38a', 24);
    }
    b.lean = 0;
  }

  /** 映波桥: slow motion and a photo of me flying, with my reflection below. */
  private reflectionShot(): void {
    this.ev.reflectShot = true;
    this.slow = 0.3;
    this.time.delayedCall(260, () => {
      const cam = this.cameras.main;
      const sx = this.me.x - cam.scrollX;
      const top = Math.max(0, this.me.y - 190);
      const reflY = WATER + (WATER - this.me.y) * REFL;
      const bottom = Math.min(H, reflY + 30);
      const size = Math.min(bottom - top, 420);
      const x0 = Phaser.Math.Clamp(sx - size / 2, 0, W - size);
      const key = nextSudiKey('reflect');
      this.snapshot(x0, top, size, size, key, () => (sudiRun.photoReflect = key));
      this.showToast(t('sudi.ev1done'), '#2e6f8edd');
    });
    this.time.delayedCall(900, () => (this.slow = 1));
  }

  private snapshot(x: number, y: number, w: number, h: number, key: string, done: () => void): void {
    const hud = this.children.list.filter((o) => (o as unknown as { depth: number }).depth >= HUD - 6 && (o as unknown as { visible: boolean }).visible) as unknown as { setVisible: (v: boolean) => void }[];
    hud.forEach((o) => o.setVisible(false));
    this.guide.setVisible(false);
    this.game.renderer.snapshotArea(Math.round(x), Math.round(y), Math.round(w), Math.round(h), (snap) => {
      hud.forEach((o) => o.setVisible(true));
      this.guide.setVisible(true);
      sfx.shutter();
      this.flash.setAlpha(0.8);
      this.tweens.add({ targets: this.flash, alpha: 0, duration: 300 });
      if (snap instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, snap);
          done();
        };
        if (snap.complete) add();
        else snap.onload = add;
      }
    });
  }

  /** 望山桥: at the top of the flight, slow motion and frame the western hills. */
  private startHillsMoment(): void {
    this.ev.hillsActive = true;
    this.ev.hillsUntil = this.time.now + 2800;
    this.slow = 0.16;
    const v = this.viewfinder;
    v.clear();
    v.lineStyle(2, 0xffffff, 0.7);
    v.strokeRect(330, 140, 620, 300);
    v.lineStyle(5, 0xffffff, 1);
    for (const [x, y, dx, dy] of [
      [330, 140, 1, 1],
      [950, 140, -1, 1],
      [330, 440, 1, -1],
      [950, 440, -1, -1],
    ]) {
      v.lineBetween(x, y, x + dx * 36, y);
      v.lineBetween(x, y, x, y + dy * 36);
    }
    v.setVisible(true);
    this.btnPhoto.container.setAlpha(1);
    this.tweens.add({ targets: this.btnPhoto.container, scale: 1.12, yoyo: true, repeat: 5, duration: 220 });
    const touch = this.sys.game.device.input.touch;
    this.showToast(t(touch ? 'sudi.ev3touch' : 'sudi.ev3'), '#1b2238dd', 2000);
  }

  private endHillsMoment(): void {
    this.ev.hillsActive = false;
    this.viewfinder.setVisible(false);
    this.btnPhoto.container.setAlpha(0.35);
    this.slow = 1;
  }

  private takeHillsPhoto(): void {
    if (!this.ev.hillsActive || sudiRun.photoHills) return;
    const key = nextSudiKey('hills');
    this.viewfinder.setVisible(false);
    this.snapshot(330, 140, 620, 300, key, () => (sudiRun.photoHills = key));
    this.showToast(t('sudi.ev3done'), '#2e6f8edd');
    this.time.delayedCall(350, () => this.endHillsMoment());
  }

  /** 压堤桥: the middle of the causeway — race to the north end. */
  private startRace(): void {
    this.ev.race = 'countdown';
    this.say(this.koko, 'sudi.race1', 2000);
    this.time.delayedCall(700, () => this.say(this.gogo, 'sudi.race2', 1400));
    // line everyone up
    this.koko.x = this.me.x - 50;
    this.gogo.x = this.me.x - 100;
    this.koko.s = this.gogo.s = this.me.s;
    const counts = ['3', '2', '1', t('sudi.go')];
    counts.forEach((c, i) => {
      this.time.delayedCall(500 + i * 450, () => {
        const txt = this.add
          .text(W / 2, 280, c, baseStyle({ fontFamily: FONT_SERIF, fontSize: '72px', color: '#fff8ee', stroke: '#b8322a', strokeThickness: 8 }))
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(HUD + 2)
          .setScale(1.5);
        sfx.blip();
        this.tweens.add({ targets: txt, scale: 1, alpha: 0, duration: 620, onComplete: () => txt.destroy() });
        if (i === counts.length - 1) {
          this.ev.race = 'on';
          this.koko.cap = 430;
          this.gogo.cap = 405;
          sfx.chime();
        }
      });
    });
  }

  /** 东浦桥: at the top of the jump — "look back!" — the sun rises over the outer lake. */
  private async sunriseCutaway(): Promise<void> {
    this.ev.sunrise = true;
    this.paused = true;
    const layer = this.add.container(0, 0).setScrollFactor(0).setDepth(HUD + 20).setAlpha(0);
    const g = this.add.graphics();
    g.fillGradientStyle(0x6d88c4, 0x6d88c4, 0xffcf9a, 0xffcf9a, 1);
    g.fillRect(0, 0, W, 420);
    const water = this.add.graphics();
    water.fillGradientStyle(0xf3c9a0, 0xf3c9a0, 0x5d7ea0, 0x5d7ea0, 1);
    water.fillRect(0, 418, W, H - 418);
    // looking east across the outer lake at sunrise: hazy hills with a slender
    // pagoda to the north-east (left), small islands, and 小瀛洲 with its three
    // little stone pagodas to the south-east (right)
    const shore = this.add.graphics();
    const r = rng(77);
    const hill: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, 420)];
    for (let x = 0; x <= 520; x += 8) hill.push(new Phaser.Math.Vector2(x, 420 - 56 * Math.exp(-(((x - 230) / 140) ** 2)) - 10 - Math.sin(x * 0.04) * 4));
    hill.push(new Phaser.Math.Vector2(520, 420));
    shore.fillStyle(0xa197b8, 0.75);
    shore.fillPoints(hill, true);
    shore.fillStyle(0x8e86a8, 0.9);
    shore.fillRect(256, 330, 5, 36); // 保俶塔, slender on its hill
    shore.fillTriangle(254, 330, 263, 330, 258.5, 318);
    // the city as a soft, low haze
    for (let x = 500; x < W; x += 34 + r() * 40) {
      const h = 10 + r() * 22;
      shore.fillStyle(0xb5a9c2, 0.35);
      shore.fillRect(x, 418 - h, 22 + r() * 26, h);
    }
    // 湖心亭 island
    shore.fillStyle(0x7f86a6, 0.95);
    shore.fillEllipse(470, 420, 120, 14);
    shore.fillRect(462, 404, 16, 10);
    shore.fillTriangle(456, 405, 484, 405, 470, 396);
    // 小瀛洲 and the three little pagodas in the water before it
    shore.fillEllipse(960, 421, 220, 16);
    for (let i = 0; i < 9; i++) shore.fillCircle(880 + i * 20, 414 - (i % 2) * 4, 9);
    for (const [px, py] of [[900, 430], [948, 436], [996, 429]]) {
      shore.fillRect(px - 1.5, py - 12, 3, 12);
      shore.fillCircle(px, py - 14, 3.5);
    }
    // the sun and its path on the water
    const sun = this.add.graphics();
    for (const [rad, a] of [[160, 0.1], [100, 0.18], [64, 0.35]]) {
      sun.fillStyle(0xffe2a8, a);
      sun.fillCircle(0, 0, rad);
    }
    sun.fillStyle(0xfff5d8, 1);
    sun.fillCircle(0, 0, 44);
    sun.setPosition(640, 470);
    const glitter = this.add.graphics();
    for (let y = 424; y < H; y += 7) {
      const w = 20 + (y - 420) * 0.9;
      glitter.fillStyle(0xfff1c8, 0.25 + r() * 0.35);
      glitter.fillRect(640 - w / 2 + (r() - 0.5) * w * 0.6, y, w * (0.3 + r() * 0.5), 2.5);
    }
    const mist = this.add.tileSprite(0, 380, W, 120, 'mistBand').setOrigin(0, 0.5).setTint(0xffe3bd).setAlpha(0.9);
    // the three of us, seen from behind, on the railing
    const us = this.add.graphics();
    us.fillStyle(0x2a2633, 1);
    us.fillRect(0, H - 70, W, 70);
    for (const [x, hat] of [[520, 'cap'], [640, ''], [760, 'tail']] as const) {
      us.fillCircle(x, H - 128, 22);
      us.fillRoundedRect(x - 28, H - 108, 56, 60, 14);
      if (hat === 'cap') us.fillRect(x - 24, H - 146, 48, 10);
      if (hat === 'tail') us.fillEllipse(x + 22, H - 120, 12, 26);
    }
    const caption = i18nText(this, W / 2, H - 196, () => `KOKO：${t('sudi.ev5')}`, {
      fontSize: '26px',
      color: '#fff8ee',
      stroke: '#7a3550',
      strokeThickness: 5,
    }).setOrigin(0.5);
    layer.add([g, sun, water, glitter, shore, mist, us, caption]);

    sfx.chime();
    music.play('sudiSunrise');
    await new Promise<void>((res) => this.tweens.add({ targets: layer, alpha: 1, duration: 450, onComplete: () => res() }));
    this.tweens.add({ targets: sun, y: 330, duration: 2600, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: mist, alpha: 0.35, duration: 2600 });
    for (let i = 0; i < 4; i++) this.time.delayedCall(300 + i * 500, () => sfx.bird());
    this.sunUp = true;
    this.tweens.addCounter({ from: this.tod, to: 0.82, duration: 2400, onUpdate: (tw) => (this.sunBoost = tw.getValue() ?? 0.82) });
    await new Promise<void>((res) => this.time.delayedCall(2900, () => res()));
    await new Promise<void>((res) => this.tweens.add({ targets: layer, alpha: 0, duration: 600, onComplete: () => res() }));
    layer.destroy();
    this.paused = false;
    // egrets take off in the morning light
    for (let i = 0; i < 3; i++) {
      const e = this.add.image(-60 - i * 80, 120 + i * 40, 'egret1').setScrollFactor(0).setDepth(OVERLAY_DEPTH + 4).setScale(0.8);
      this.egrets.push(e);
    }
  }

  private drawRainbow(): void {
    const b = BRIDGES[5];
    const cx = b.x0 + SPAN / 2;
    const cy = BASE + 60;
    const colors = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0x9775fa, 0xda77f2];
    const g = this.rainbow;
    colors.forEach((c, i) => {
      g.lineStyle(13, c, 0.42);
      g.beginPath();
      g.arc(cx, cy, 360 - i * 12, Math.PI, 0, false);
      g.strokePath();
    });
  }

  // ------------------------------------------------------------------ physics

  private step(b: Body, pedal: boolean, tuck: boolean, dt: number, isMe: boolean): void {
    const windHere = this.gustOn && b.x > BRIDGES[1].x0 - 560 && b.x < BRIDGES[1].x0 + SPAN + 160;
    if (!b.air) {
      const sl = slope(b.x);
      b.s += (pedal ? 330 : -25) * dt;
      b.s += ((380 * sl) / Math.sqrt(1 + sl * sl)) * dt;
      if (windHere) b.s -= (tuck ? 45 : 300) * dt;
      const floor = this.ev.finished && isMe ? 0 : 90;
      b.s = Phaser.Math.Clamp(b.s, floor, b.cap);
      const nx = b.x + b.s * dt;
      if (slope(b.x) < 0 && slope(nx) >= 0 && b.s > 290) {
        b.air = true;
        b.airT = 0;
        b.vy = -(b.s - 190) * 0.85;
        b.lean = 0;
        if (isMe) this.onLaunch(b);
      } else {
        b.y = ground(nx);
      }
      b.x = nx;
      b.angle = Math.atan(slope(b.x));
    } else {
      b.airT += dt;
      b.vy += 1150 * dt;
      b.x += b.s * dt;
      b.y += b.vy * dt;
      if (isMe) b.lean = Phaser.Math.Clamp(b.lean + (tuck ? 1.6 : -0.9) * dt, 0, 1.1);
      else {
        // friends lean just right for a tidy landing
        const land = this.predictLanding(b);
        b.lean = Math.max(0, Math.atan(slope(land.x)) - Math.atan2(b.vy, b.s) * 0.3);
      }
      const target = Math.atan2(b.vy, b.s) * 0.3 + b.lean;
      b.angle += (target - b.angle) * Math.min(1, 7 * dt);
      const gy = ground(b.x);
      if (b.y >= gy && b.vy > 0) {
        b.y = gy;
        b.air = false;
        if (isMe) this.onLand(b);
        else b.lean = 0;
      }
    }
    b.cy.tuck = tuck && !b.air;
    b.cy.roll(b.s * dt, pedal || b.air);
    b.cy.g.setPosition(b.x, b.y).setRotation(b.angle);
    b.cy.draw();
    b.refl.tuck = b.cy.tuck;
    b.refl.wheelAngle = b.cy.wheelAngle;
    b.refl.crank = b.cy.crank;
    b.refl.draw();
    const sc = b.cy.g.scaleX;
    b.refl.g.setPosition(b.x, WATER + (WATER - b.y) * REFL).setScale(sc, -sc * REFL * 1.25).setRotation(-b.angle * REFL);
  }

  private predictLanding(b: Body): { x: number; y: number } {
    let x = b.x;
    let y = b.y;
    let vy = b.vy;
    for (let i = 0; i < 240; i++) {
      vy += 1150 / 60;
      x += b.s / 60;
      y += vy / 60;
      if (y >= ground(x) && vy > 0) break;
    }
    return { x, y: ground(x) };
  }

  /** Shows where I'll land and whether the bike is angled right for it. */
  private drawGuide(): void {
    const g = this.guide;
    g.clear();
    const b = this.me;
    if (!b.air) return;
    const land = this.predictLanding(b);
    const sl = Math.atan(slope(land.x));
    const diff = Math.abs(b.angle - sl);
    const ok = diff < 0.3;
    g.lineStyle(3, 0xffffff, 0.7);
    g.lineBetween(land.x - Math.cos(sl) * 40, land.y - Math.sin(sl) * 40, land.x + Math.cos(sl) * 40, land.y + Math.sin(sl) * 40);
    g.lineStyle(4, ok ? 0x7dffb0 : 0xffb35c, 0.95);
    g.lineBetween(land.x - Math.cos(b.angle) * 34, land.y - 8 - Math.sin(b.angle) * 34, land.x + Math.cos(b.angle) * 34, land.y - 8 + Math.sin(b.angle) * 34);
    g.fillStyle(ok ? 0x7dffb0 : 0xffb35c, 0.9);
    g.fillCircle(land.x, land.y, 5);
  }

  // ------------------------------------------------------------------ petals

  private spawnPetal(now: number): void {
    if (now < this.spawnAt) return;
    this.spawnAt = now + (this.sunUp ? 90 : 160);
    const cam = this.cameras.main;
    const loose = this.petals.filter((p) => !p.fixed);
    if (loose.length > 46) return;
    const catkin = this.tod > 0.5 && Math.random() < 0.35;
    const pool = catkin ? this.willowXs : this.peachXs;
    const near = pool.filter((x) => x > cam.scrollX - 80 && x < cam.scrollX + W + 360);
    if (!near.length) return;
    const tx = near[Math.floor(Math.random() * near.length)];
    const img = this.add
      .image(tx + (Math.random() - 0.5) * 120, BASE - 210 + Math.random() * 90, catkin ? 'sudiCatkin' : 'sudiPetal')
      .setDepth(35)
      .setAngle(Math.random() * 360);
    this.petals.push({ img, vx: -10 + Math.random() * 20, vy: 30 + Math.random() * 35, spin: (Math.random() - 0.5) * 180, fixed: false, catkin });
  }

  private updatePetals(dt: number, time: number): void {
    const me = this.me;
    const hx = me.x + 10;
    const hy = me.y - 70;
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      if (!p.fixed) {
        const wind = this.gustOn ? -260 : 0;
        p.img.x += (p.vx + wind + Math.sin(time * 0.002 + i) * 20) * dt;
        p.img.y += p.vy * dt * (p.catkin ? 0.6 : 1);
        p.img.angle += p.spin * dt;
        if (p.img.y > WATER + 16) {
          p.img.destroy();
          this.petals.splice(i, 1);
          continue;
        }
      }
      if (!p.catkin && Math.hypot(p.img.x - hx, p.img.y - hy) < 52) this.catchPetal(p, i);
    }
  }

  private catchPetal(p: Petal, i: number): void {
    const n = this.me.air ? 2 : 1;
    sudiRun.petals += n;
    const now = this.time.now;
    this.petalCombo = now - this.lastCatch < 700 ? this.petalCombo + 1 : 0;
    this.lastCatch = now;
    sfx.petal(this.petalCombo);
    this.petalText.setText(String(sudiRun.petals));
    this.tweens.add({ targets: this.petalText, scale: { from: 1.4, to: 1 }, duration: 200 });
    if (n === 2 && this.petalCombo === 0) this.pop(t('sudi.airPetal'), p.img.x, p.img.y - 30, '#ffd1e0', 20);
    // fly to the counter
    const cam = this.cameras.main;
    const fly = this.add.image(p.img.x - cam.scrollX, p.img.y, 'sudiPetal').setScrollFactor(0).setDepth(HUD + 2).setScale(1.4);
    this.tweens.add({ targets: fly, x: W - 336, y: 40, angle: 360, duration: 500, ease: 'Cubic.easeIn', onComplete: () => fly.destroy() });
    this.tweens.killTweensOf(p.img);
    p.img.destroy();
    this.petals.splice(i, 1);
  }

  // ------------------------------------------------------------------ loop

  update(time: number, deltaMs: number): void {
    const realDt = Math.min(deltaMs, 50) / 1000;
    const dt = realDt * this.slow;
    const k = this.keys;
    const me = this.me;

    const pedal = !this.ev.finished && (k.right.isDown || k.d.isDown || this.btnPedal.isDown());
    const tuck = !this.ev.finished && (k.down.isDown || k.s.isDown || this.btnTuck.isDown());

    // wind gusts around 锁澜桥
    const windZone = me.x > BRIDGES[1].x0 - 560 && me.x < BRIDGES[1].x0 + SPAN + 160;
    if (windZone && !this.ev.windWarned) {
      this.ev.windWarned = true;
      this.nextGust = time + 600;
    }
    if (windZone && !this.gustOn && time > this.nextGust) {
      this.gustOn = true;
      this.gustUntil = time + 1300;
      sfx.wind();
      this.tweens.add({ targets: this.btnTuck.container, scale: 1.12, yoyo: true, repeat: 3, duration: 160 });
    }
    if (this.gustOn && (time > this.gustUntil || !windZone)) {
      this.gustOn = false;
      this.nextGust = time + 1300;
    }

    if (!this.paused) {
      this.step(me, pedal, tuck, dt, true);
      // friends: follow behind before the race, then race for real
      const racing = this.ev.race === 'on';
      const kokoPedal = racing || this.koko.x < me.x - 150;
      const gogoPedal = racing || this.gogo.x < me.x - 290;
      this.step(this.koko, kokoPedal && !(this.ev.finished && this.koko.x > FINISH_X + 200), false, dt, false);
      this.step(this.gogo, gogoPedal && !(this.ev.finished && this.gogo.x > FINISH_X + 120), false, dt, false);
    }
    if (this.ev.race === 'countdown') {
      this.koko.x = Math.min(this.koko.x, me.x - 40);
      this.gogo.x = Math.min(this.gogo.x, me.x - 90);
    }

    // time of day follows the ride, then jumps forward at sunrise
    const before = Phaser.Math.Clamp(me.x / (BRIDGES[4].x0 + SPAN * 0.5), 0, 1);
    if (!this.sunUp) this.tod = 0.06 + 0.48 * before;
    else {
      const after = Phaser.Math.Clamp((me.x - BRIDGES[4].x0) / (FINISH_X - BRIDGES[4].x0), 0, 1);
      this.tod = Math.max(this.sunBoost, 0.82 + 0.18 * after);
    }

    const cam = this.cameras.main;
    cam.scrollX = Phaser.Math.Clamp(me.x - SCREEN_X, 0, WORLD_W - W);
    this.sky.update(this.tod, cam.scrollX, time);
    for (const g of this.lampGlows) g.setAlpha(Phaser.Math.Clamp(1 - (this.tod - 0.3) * 2.5, 0, 1) * (0.85 + Math.sin(time * 0.006) * 0.15));

    // events along the causeway
    BRIDGES.forEach((b: Bridge, i) => {
      if (!this.carded[i] && me.x > b.x0 - 360) this.bridgeCard(i);
      if (!this.stamped[i] && me.x > b.x0 + SPAN + 30) this.stampBridge(i);
    });
    if (!this.ev.hillsActive && !sudiRun.photoHills && me.air && me.vy > -60 && bridgeAt(me.x - 40)?.index === 2 && this.ev.hillsUntil === 0) this.startHillsMoment();
    if (this.ev.hillsActive && time > this.ev.hillsUntil) this.endHillsMoment();
    if (this.ev.race === 'none' && me.x > BRIDGES[3].x0 + SPAN * 0.62) this.startRace();
    if (this.sunUp) this.rainbow.setAlpha(Math.min(1, this.rainbow.alpha + realDt * 0.6));
    const rcx = BRIDGES[5].x0 + SPAN / 2;
    if (!this.ev.rainbowPassed && this.sunUp && me.air && Math.abs(me.x - rcx) < 70) {
      this.ev.rainbowPassed = true;
      sfx.chime();
      this.pop(t('sudi.rainbow'), me.x, me.y - 200, '#fff3b0', 32);
      for (let i = 0; i < 18; i++) {
        const s = this.add.image(me.x, me.y - 80, 'sparkle').setDepth(OVERLAY_DEPTH + 25).setTint([0xff6b6b, 0xffe066, 0x74c0fc, 0xda77f2][i % 4]);
        const a = (i / 18) * Math.PI * 2;
        this.tweens.add({ targets: s, x: me.x + Math.cos(a) * 160, y: me.y - 80 + Math.sin(a) * 120, alpha: 0, scale: 2, duration: 900, onComplete: () => s.destroy() });
      }
    }

    // race positions and the finish
    if (this.ev.race === 'on' && !this.ev.finished && me.x >= FINISH_X) this.finish();
    if (!this.ev.finished && this.ev.race !== 'on' && me.x >= FINISH_X) this.finish();
    if (this.ev.finished && (me.s < 5 || time > this.ev.finishAt + 3500) && this.ev.finishAt > 0) {
      this.ev.finishAt = -1;
      this.cameras.main.fadeOut(1200, 255, 246, 226);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('SudiEnd'));
    }
    if (this.ev.finished && me.s > 0 && !me.air) me.s = Math.max(0, me.s - 260 * realDt);
    this.drawRace();

    // petals, wind streaks, guide, speech bubbles, birds, egrets
    if (!this.paused) {
      this.spawnPetal(time);
      this.updatePetals(dt, time);
    }
    this.drawWind(time);
    this.drawGuide();
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bb = this.bubbles[i];
      bb.box.setPosition(bb.who.x + 10, bb.who.y - 150);
      if (time > bb.until) {
        bb.box.destroy();
        this.bubbles.splice(i, 1);
      }
    }
    if (this.tod > 0.35 && Math.random() < realDt * (this.sunUp ? 0.9 : 0.35)) sfx.bird();
    for (const e of this.egrets) {
      e.x += 60 * realDt;
      e.y += Math.sin(time * 0.002 + e.x * 0.01) * 0.3;
      e.setTexture(Math.sin(time * 0.012 + e.y) > 0 ? 'egret1' : 'egret2');
      if (e.x > W + 80) e.x = -80;
    }
  }

  private finish(): void {
    this.ev.finished = true;
    this.ev.finishAt = this.time.now;
    if (this.ev.race === 'on') {
      const ahead = [this.koko, this.gogo].filter((b) => b.x > this.me.x).length;
      sudiRun.rank = ahead + 1;
      this.ev.race = 'done';
      const key: StrKey = sudiRun.rank === 1 ? 'sudi.rank1' : sudiRun.rank === 2 ? 'sudi.rank2' : 'sudi.rank3';
      sfx.chime();
      this.showToast(t(key), sudiRun.rank === 1 ? '#c9952add' : '#1b2238dd', 2600);
    }
  }

  private drawRace(): void {
    const g = this.raceG;
    g.clear();
    if (this.ev.race !== 'on' && this.ev.race !== 'countdown') return;
    const x0 = 440 - 22;
    const x1 = 440 + 5 * 56 + 22;
    const y = 78;
    const startX = BRIDGES[3].x0 + SPAN;
    const k = (x: number) => x0 + (x1 - x0) * Phaser.Math.Clamp((x - startX) / (FINISH_X - startX), 0, 1);
    g.lineStyle(4, 0xffffff, 0.6);
    g.lineBetween(x0, y, x1, y);
    g.fillStyle(0xb8322a, 1);
    g.fillRect(x1 - 2, y - 10, 4, 20);
    for (const [b, c] of [[this.gogo, 0x2471a3], [this.koko, 0xc2185b], [this.me, 0xc0392b]] as const) {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(k(b.x), y, 9);
      g.fillStyle(c, 1);
      g.fillCircle(k(b.x), y, 7);
    }
  }

  private drawWind(time: number): void {
    const g = this.windG;
    g.clear();
    if (!this.gustOn) return;
    for (let i = 0; i < 26; i++) {
      const y = 140 + ((i * 97) % 420);
      const x = W - ((time * 1.4 + i * 211) % (W + 300));
      g.lineStyle(2, 0xffffff, 0.35);
      g.lineBetween(x, y, x + 60 + (i % 4) * 30, y);
    }
  }
}

import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton, type Button } from '../ui/Button';
import { overGlobalUI } from '../ui/overlay';
import { hillPolygon, rng } from '../art/paint';
import { drawKid, drawBench, drawCar, Snowfall, type Kid } from './art';
import { dqRun } from './state';

const WORLD_W = 4300;
const GROUND = 560;
const ME_SCREEN_X = 260;
const WALK = 110;
const GRAV = 900;
const HUD = 300;

interface Ball {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  T: number;
  mine: boolean;
  dead: boolean;
}

interface Patch {
  x: number;
  y: number;
  w: number;
  amount: number;
  g: Phaser.GameObjects.Graphics;
}

interface Foe {
  who: Kid;
  g: Phaser.GameObjects.Graphics;
  homeX: number;
  peekX: number;
  /** 0 = hidden behind cover, 1 = leaning out */
  out: number;
  peekUntil: number;
  nextPeek: number;
  thrown: boolean;
}

/** 北山街 on a snowy morning: a snowball fight on the way to the Broken Bridge. */
export class DuanqiaoStreetScene extends Phaser.Scene {
  private me!: Phaser.GameObjects.Graphics;
  private meX = 200;
  private ducking = false;
  private duckBtn: Button | null = null;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private balls: Ball[] = [];
  private patches: Patch[] = [];
  private foes: Foe[] = [];
  private walkers: Record<'koko' | 'gogo', Phaser.GameObjects.Graphics> = {} as never;
  private ambush = -1;
  private ambushHits = 0;
  private ambushNeed = 3;
  private walking = false;
  private lastThrow = 0;
  private snow!: Snowfall;
  private hudSnow!: Phaser.GameObjects.Text;
  private hudHits!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private frost!: Phaser.GameObjects.Image;
  private bubbles: { box: Phaser.GameObjects.Container; target: Phaser.GameObjects.Graphics; until: number }[] = [];
  private lakeRipples: Phaser.GameObjects.TileSprite | null = null;
  private covers: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('DuanqiaoStreet');
  }

  create(): void {
    music.play('dqFight');
    this.meX = 200;
    this.ducking = false;
    this.balls = [];
    this.patches = [];
    this.foes = [];
    this.ambush = -1;
    this.walking = false;
    this.bubbles = [];
    this.covers = [];

    this.cameras.main.setBounds(0, 0, WORLD_W, H);
    this.paintWorld();

    this.me = this.add.graphics().setDepth(40);
    drawKid(this.me, 'me', { facing: 1 });
    for (const [who, dx] of [['koko', 180], ['gogo', 300]] as const) {
      const g = this.add.graphics().setDepth(38);
      drawKid(g, who, { facing: 1 });
      g.setPosition(this.meX + dx, GROUND);
      this.walkers[who] = g;
    }

    this.snow = new Snowfall(this, { count: 170, depth: 250, front: 260 });
    this.keyDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p));
    this.buildHud();

    this.cameras.main.fadeIn(900, 255, 255, 255);
    void this.script();
  }

  // ---- world ------------------------------------------------------------------------

  private paintWorld(): void {
    const r = rng(52);
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-100);
    sky.fillGradientStyle(0xd7dee4, 0xd7dee4, 0xeef1f3, 0xeef1f3, 1);
    sky.fillRect(0, 0, W, H);
    // far hills across the lake, white on top
    const hills = this.add.graphics().setScrollFactor(0.12, 1).setDepth(-90);
    const pts = hillPolygon(W + WORLD_W * 0.12 + 80, 330, 60, 420, 71, 14);
    hills.fillStyle(0x9aa7ad, 1);
    hills.fillPoints(pts, true);
    hills.fillStyle(0xf4f7f9, 1);
    hills.fillPoints(pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : new Phaser.Math.Vector2(p.x, p.y + 0.5))).filter((p) => p.y < 380), false);
    for (let i = 1; i < pts.length - 1; i++) {
      hills.fillStyle(0xf4f7f9, 0.9);
      hills.fillEllipse(pts[i].x, pts[i].y + 6, 28, 12);
    }
    // the grey winter lake
    const lake = this.add.graphics().setScrollFactor(0, 1).setDepth(-80);
    lake.fillGradientStyle(0xaab8c0, 0xaab8c0, 0x8e9fa8, 0x8e9fa8, 1);
    lake.fillRect(0, 400, W, 110);
    this.lakeRipples = this.add.tileSprite(0, 400, W, 110, 'ripples').setOrigin(0).setScrollFactor(0, 1).setDepth(-79).setAlpha(0.35);
    // the far causeway: a white line of snowy willows (白堤)
    const far = this.add.graphics().setScrollFactor(0.3, 1).setDepth(-70);
    far.fillStyle(0xf2f5f7, 1);
    far.fillRect(0, 420, W + WORLD_W * 0.3, 6);
    for (let x = 0; x < W + WORLD_W * 0.3; x += 26 + r() * 20) {
      far.fillStyle(0x7a8a80, 1);
      far.fillEllipse(x, 412, 18, 20);
      far.fillStyle(0xffffff, 0.95);
      far.fillEllipse(x, 405, 16, 8);
    }

    // lakeside railing, sidewalk and snow
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0xb7b2a6, 1);
    g.fillRect(0, 500, WORLD_W, 14);
    for (let x = 0; x < WORLD_W; x += 60) g.fillRect(x, 500, 8, 60);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 496, WORLD_W, 6);
    g.fillStyle(0xe9edf0, 1);
    g.fillRect(0, GROUND, WORLD_W, H - GROUND);
    g.fillStyle(0xd5dbe0, 1);
    for (let x = 0; x < WORLD_W; x += 40 + r() * 40) g.fillEllipse(x, GROUND + 20 + r() * 120, 30 + r() * 30, 6);
    // footprints in the snow
    g.fillStyle(0xc6cdd3, 1);
    for (let x = 30; x < WORLD_W; x += 34) {
      g.fillEllipse(x, GROUND + 70 + Math.sin(x) * 4, 9, 5);
      g.fillEllipse(x + 16, GROUND + 80 + Math.sin(x) * 4, 9, 5);
    }

    // plane trees and street lamps
    for (let x = 120; x < WORLD_W; x += 520) {
      this.add.image(x, GROUND + 6, 'dqPlane').setOrigin(0.5, 1).setDepth(10).setScale(0.95);
    }
    const lamps = this.add.graphics().setDepth(9);
    for (let x = 380; x < WORLD_W; x += 520) {
      lamps.fillStyle(0x3a3a3a, 1);
      lamps.fillRect(x - 3, GROUND - 230, 6, 230);
      lamps.fillRect(x - 3, GROUND - 230, 30, 5);
      lamps.fillStyle(0xfff2c4, 1);
      lamps.fillCircle(x + 27, GROUND - 220, 8);
      lamps.fillStyle(0xffffff, 1);
      lamps.fillRect(x - 4, GROUND - 236, 34, 6);
    }

    // things to scrape snow off: cars, benches, holly hedges
    const props = this.add.graphics().setDepth(20);
    const cars: [number, number][] = [[700, 0xc0392b], [1580, 0x2e86c1], [2420, 0xf1f1f1], [3050, 0x16a085], [3700, 0xf39c12]];
    for (const [x, c] of cars) {
      drawCar(props, x, GROUND + 4, c);
      this.addPatch(x, GROUND - 86, 130, 3);
      this.addPatch(x, GROUND - 48, 200, 1);
    }
    for (const x of [480, 1900, 2850, 3500]) {
      drawBench(props, x, GROUND + 2);
      this.addPatch(x, GROUND - 44, 150, 2);
    }
    for (const x of [1250, 2650, 3350]) {
      for (let i = 0; i < 7; i++) {
        props.fillStyle([0x2f5a3a, 0x3a6a44][i % 2], 1);
        props.fillEllipse(x - 90 + i * 30, GROUND - 26, 50, 56);
      }
      this.addPatch(x, GROUND - 52, 210, 2);
    }
    // the roast sweet-potato cart, steaming
    this.add.image(2050, GROUND + 4, 'dqCart').setOrigin(0.5, 1).setDepth(21);
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const s = this.add.image(2050 + (Math.random() - 0.5) * 10, GROUND - 150, 'dqFlake').setDepth(22).setAlpha(0.5).setScale(1.5).setTint(0xdddddd);
        this.tweens.add({ targets: s, y: s.y - 80, x: s.x + 20, alpha: 0, scale: 3, duration: 1600, onComplete: () => s.destroy() });
      },
    });

    // the Broken Bridge, crowded, at the end of the street
    const bridge = this.add.graphics().setDepth(8);
    const bx = WORLD_W - 260;
    bridge.fillStyle(0x8e8a80, 1);
    bridge.slice(bx, 500, 200, Math.PI, Math.PI * 2, false);
    bridge.fillPath();
    bridge.fillStyle(0xaab8c0, 1);
    bridge.slice(bx, 502, 70, Math.PI, Math.PI * 2, false);
    bridge.fillPath();
    bridge.fillStyle(0xffffff, 1);
    bridge.fillEllipse(bx, 300, 260, 18);
    for (let i = 0; i < 40; i++) {
      bridge.fillStyle([0xc0392b, 0x2e86c1, 0x27ae60, 0xf1c40f, 0x8e44ad, 0x34495e][i % 6], 1);
      const a = Math.PI + (i / 40) * Math.PI;
      bridge.fillCircle(bx + Math.cos(a) * 196 + (Math.random() - 0.5) * 8, 500 + Math.sin(a) * 196 - 14 - Math.random() * 10, 9);
    }
  }

  private addPatch(x: number, y: number, w: number, amount: number): void {
    const g = this.add.graphics().setDepth(22);
    const p: Patch = { x, y, w, amount, g };
    this.drawPatch(p);
    this.patches.push(p);
  }

  private drawPatch(p: Patch): void {
    const g = p.g;
    g.clear();
    if (p.amount <= 0) return;
    const h = 6 + p.amount * 4;
    g.fillStyle(0xdfe6ec, 1);
    g.fillRoundedRect(p.x - p.w / 2, p.y - h + 2, p.w, h, Math.min(8, h / 2));
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(p.x - p.w / 2 + 2, p.y - h, p.w - 4, h - 2, Math.min(8, h / 2));
  }

  // ---- HUD ------------------------------------------------------------------------------

  private buildHud(): void {
    const panel = this.add.graphics().setScrollFactor(0).setDepth(HUD);
    panel.fillStyle(0x2f3b48, 0.55);
    panel.fillRoundedRect(16, 12, 330, 50, 14);
    this.hudSnow = this.add.text(36, 37, '', baseStyle({ fontSize: '21px', color: '#ffffff', fontStyle: 'bold' })).setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD + 1);
    this.hudHits = this.add.text(200, 37, '', baseStyle({ fontSize: '21px', color: '#ffe08a', fontStyle: 'bold' })).setOrigin(0, 0.5).setScrollFactor(0).setDepth(HUD + 1);
    this.banner = this.add.text(W / 2, 110, '', baseStyle({ fontSize: '28px', color: '#ffffff', fontStyle: 'bold', stroke: '#2f3b48', strokeThickness: 6 })).setOrigin(0.5).setScrollFactor(0).setDepth(HUD);
    const touch = this.sys.game.device.input.touch;
    i18nText(this, W / 2, H - 24, () => t(touch ? 'dq.st.hintTouch' : 'dq.st.hintKeys'), { fontSize: '17px', color: '#2f3b48', stroke: '#ffffff', strokeThickness: 4 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD);
    this.duckBtn = makeButton(this, W - 110, H - 80, () => t('dq.st.btnDuck'), {
      width: 150,
      height: 70,
      fontSize: 28,
      fixed: true,
      depth: HUD + 2,
      onDown: () => (this.ducking = true),
      onUp: () => (this.ducking = false),
    });
    this.frost = this.add.image(W / 2, H / 2, 'dqPuff').setScrollFactor(0).setDepth(HUD - 10).setScale(22).setAlpha(0);
    this.refreshHud();
  }

  private refreshHud(): void {
    this.hudSnow.setText(t('dq.st.snow', { n: dqRun.snow }));
    this.hudHits.setText(t('dq.st.hits', { n: dqRun.hits }));
    if (this.ambush >= 0 && this.ambushHits < this.ambushNeed) {
      const key: StrKey = this.ambush === 0 ? 'dq.st.ambushG' : this.ambush === 1 ? 'dq.st.ambushK' : 'dq.st.ambushB';
      this.banner.setText(`${t(key)}  ${t('dq.st.left', { n: this.ambushNeed - this.ambushHits })}`);
    } else this.banner.setText('');
  }

  private bubble(target: Phaser.GameObjects.Graphics, who: Kid, key: StrKey, ms = 2600): void {
    const txt = i18nText(this, 0, 0, () => t(key), { fontSize: '20px', color: CSS.ink, wordWrap: { width: 360, useAdvancedWrap: true } }).setOrigin(0.5);
    const bg = this.add.graphics();
    const w = txt.width + 30;
    const h = txt.height + 20;
    bg.fillStyle(0xffffff, 0.96);
    bg.lineStyle(3, Phaser.Display.Color.HexStringToColor(who === 'koko' ? CSS.koko : who === 'gogo' ? CSS.gogo : CSS.me).color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.fillTriangle(-10, h / 2 - 1, 10, h / 2 - 1, 0, h / 2 + 14);
    const box = this.add.container(target.x, target.y - 170, [bg, txt]).setDepth(HUD - 5);
    this.bubbles.push({ box, target, until: this.time.now + ms });
  }

  // ---- throwing, scraping, getting hit -----------------------------------------------

  private onPointer(p: Phaser.Input.Pointer): void {
    if (overGlobalUI(p) || this.duckBtn?.isDown()) return;
    if (p.x > W - 200 && p.y > H - 130) return;
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    const patch = this.patches.find((q) => q.amount > 0 && Math.abs(wp.x - q.x) < q.w / 2 + 10 && wp.y > q.y - 40 && wp.y < q.y + 16 && Math.abs(q.x - this.meX) < 700);
    if (patch) {
      this.scrape(patch);
      return;
    }
    if (this.time.now - this.lastThrow < 260 || this.ducking) return;
    this.lastThrow = this.time.now;
    this.throwBall(this.meX + 14, GROUND - 112, wp.x, wp.y, true);
    drawKid(this.me, 'me', { facing: 1, armUp: true });
    this.time.delayedCall(180, () => drawKid(this.me, 'me', { facing: 1 }));
  }

  private scrape(p: Patch): void {
    p.amount -= 1;
    this.drawPatch(p);
    dqRun.snow += 1;
    sfx.dig();
    for (let i = 0; i < 6; i++) {
      const s = this.add.image(p.x + (Math.random() - 0.5) * p.w * 0.6, p.y - 6, 'dqFlake').setDepth(HUD - 2).setScale(0.8);
      const sx = s.x - this.cameras.main.scrollX;
      s.setScrollFactor(0).setPosition(sx, p.y - 6);
      this.tweens.add({ targets: s, x: 60, y: 37, scale: 0.3, delay: i * 30, duration: 500, ease: 'Cubic.easeIn', onComplete: () => s.destroy() });
    }
    this.pop(t('dq.st.scrape'), p.x, p.y - 40, '#ffffff');
    this.refreshHud();
  }

  private throwBall(fx: number, fy: number, tx: number, ty: number, mine: boolean): void {
    const dist = Math.hypot(tx - fx, ty - fy);
    const T = mine ? 0.32 + dist / 1600 : 0.95;
    const vx = (tx - fx) / T;
    const vy = (ty - fy) / T - 0.5 * GRAV * T;
    const img = this.add.image(fx, fy, 'dqSnowball').setDepth(45).setScale(mine ? 1 : 1.1);
    this.balls.push({ img, x: fx, y: fy, vx, vy, t: 0, T, mine, dead: false });
    sfx.whee();
  }

  private poof(x: number, y: number, s = 1): void {
    const p = this.add.image(x, y, 'dqPuff').setDepth(46).setScale(0.3 * s);
    this.tweens.add({ targets: p, scale: 1.1 * s, alpha: 0, duration: 380, onComplete: () => p.destroy() });
    sfx.splash();
  }

  private pop(text: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, text, baseStyle({ fontSize: '24px', color, fontStyle: 'bold', stroke: '#2f3b48', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD - 1);
    this.tweens.add({ targets: txt, y: y - 50, alpha: 0, delay: 400, duration: 900, onComplete: () => txt.destroy() });
  }

  private foeBox(f: Foe): { x0: number; x1: number; y0: number; y1: number } {
    const x = f.g.x;
    return { x0: x - 30, x1: x + 30, y0: GROUND - 150, y1: GROUND - 60 };
  }

  private updateBalls(sec: number): void {
    for (const b of this.balls) {
      if (b.dead) continue;
      b.t += sec;
      b.vy += GRAV * sec;
      b.x += b.vx * sec;
      b.y += b.vy * sec;
      b.img.setPosition(b.x, b.y).setAngle(b.t * 400);
      // two snowballs meeting in the air
      for (const o of this.balls) {
        if (o === b || o.dead || o.mine === b.mine) continue;
        if (Math.hypot(o.x - b.x, o.y - b.y) < 26) {
          b.dead = o.dead = true;
          this.poof((b.x + o.x) / 2, (b.y + o.y) / 2, 1.2);
          dqRun.blocks += 1;
          this.pop(t('dq.st.block'), b.x, b.y - 30, '#bff4ff');
        }
      }
      if (b.dead) continue;
      if (b.mine) {
        for (const f of this.foes) {
          const box = this.foeBox(f);
          if (f.out > 0.5 && b.x > box.x0 && b.x < box.x1 && b.y > box.y0 && b.y < box.y1) {
            b.dead = true;
            this.poof(b.x, b.y);
            dqRun.hits += 1;
            this.ambushHits += 1;
            this.pop(t('dq.st.hit'), b.x, box.y0 - 20, '#ffe08a');
            this.tweens.add({ targets: f.g, angle: { from: -12, to: 0 }, duration: 300 });
            f.peekUntil = 0;
            this.refreshHud();
          }
        }
      } else if (b.t >= b.T * 0.97 && Math.abs(b.x - this.meX) < 40) {
        if (this.ducking) continue;
        b.dead = true;
        this.poof(b.x, b.y, 1.4);
        dqRun.ouch += 1;
        this.frost.setAlpha(0.85);
        this.tweens.add({ targets: this.frost, alpha: 0, delay: 500, duration: 900 });
        this.pop(t('dq.st.ouch'), this.meX, GROUND - 170, '#ffffff');
        this.tweens.add({ targets: this.me, angle: { from: -10, to: 0 }, duration: 400 });
      }
      if (!b.dead && (b.y > GROUND + 40 || b.t > b.T + 1.2)) {
        b.dead = true;
        this.poof(b.x, Math.min(b.y, GROUND + 30), 0.7);
      }
      if (b.dead) b.img.destroy();
    }
    this.balls = this.balls.filter((b) => !b.dead);
  }

  // ---- ambushes ---------------------------------------------------------------------------

  private startAmbush(i: number): void {
    this.ambush = i;
    this.ambushHits = 0;
    this.ambushNeed = i === 2 ? 4 : 3;
    const coverX = this.meX + 600;
    // cover to hide behind: a snowy holly hedge, or a parked car
    const cover = this.add.graphics().setDepth(25);
    const hedge = (x: number) => {
      for (let k = 0; k < 6; k++) {
        cover.fillStyle([0x2f5a3a, 0x3a6a44][k % 2], 1);
        cover.fillEllipse(x - 75 + k * 30, GROUND - 34, 52, 76);
      }
      cover.fillStyle(0xffffff, 1);
      for (let k = 0; k < 6; k++) cover.fillEllipse(x - 75 + k * 30, GROUND - 68, 40, 14);
    };
    const car = (x: number, c: number) => {
      drawCar(cover, x, GROUND + 4, c);
      cover.fillStyle(0xffffff, 1);
      cover.fillRoundedRect(x - 62, GROUND - 98, 124, 12, 6);
    };
    const add = (who: Kid, homeX: number, peekX: number) => {
      const g = this.walkers[who as 'koko' | 'gogo'];
      drawKid(g, who, { facing: -1 });
      g.setPosition(homeX, GROUND).setDepth(19);
      this.foes.push({ who, g, homeX, peekX, out: 0, peekUntil: 0, nextPeek: this.time.now + 900 + Math.random() * 600, thrown: false });
    };
    if (i === 0) {
      hedge(coverX);
      add('gogo', coverX, coverX - 20);
    }
    if (i === 1) {
      car(coverX, 0x8e44ad);
      add('koko', coverX + 20, coverX - 10);
    }
    if (i === 2) {
      hedge(coverX - 60);
      car(coverX + 200, 0x2c3e50);
      add('gogo', coverX - 60, coverX - 80);
      add('koko', coverX + 210, coverX + 190);
    }
    this.covers.push(cover);
    this.refreshHud();
    const first = this.foes[0];
    this.bubble(first.g, first.who, first.who === 'gogo' ? 'dq.st.g1' : 'dq.st.k1', 1800);
  }

  private updateFoes(now: number, sec: number): void {
    for (const f of this.foes) {
      if (now > f.nextPeek && f.peekUntil < now && f.out < 0.05) {
        f.peekUntil = now + 1300;
        f.nextPeek = now + 2300 + Math.random() * 1400;
        f.thrown = false;
      }
      const want = now < f.peekUntil ? 1 : 0;
      f.out += (want - f.out) * Math.min(1, sec * 8);
      // crouched behind cover, or standing up to throw
      f.g.x = f.homeX + (f.peekX - f.homeX) * f.out;
      f.g.setScale(1, 0.42 + 0.58 * f.out);
      if (f.out > 0.8 && !f.thrown && now > f.peekUntil - 900) {
        f.thrown = true;
        drawKid(f.g, f.who, { facing: -1, armUp: true });
        this.time.delayedCall(200, () => drawKid(f.g, f.who, { facing: -1 }));
        this.throwBall(f.g.x - 14, GROUND - 120, this.meX + (Math.random() - 0.5) * 16, GROUND - 105, false);
      }
    }
  }

  private async script(): Promise<void> {
    await wait(this, 800);
    this.walking = true;
    this.bubble(this.walkers.koko, 'koko', 'dq.st.k2', 4200);
    for (const [i, x] of [1000, 2250, 3350].entries()) {
      await this.until(() => this.meX >= x);
      if (i === 1) this.bubble(this.walkers.gogo, 'gogo', 'dq.st.g2', 2400);
      this.walking = false;
      // friends run ahead and hide
      this.startAmbush(i);
      await this.until(() => this.ambushHits >= this.ambushNeed);
      sfx.chime();
      for (const f of this.foes) {
        f.peekUntil = 0;
        f.nextPeek = Infinity;
        drawKid(f.g, f.who, { facing: 1 });
        f.g.setDepth(38).setScale(1);
      }
      this.foes = [];
      this.ambush = -1;
      this.refreshHud();
      await wait(this, 700);
      this.walking = true;
    }
    await this.until(() => this.meX >= WORLD_W - 700);
    this.walking = false;
    this.bubble(this.walkers.gogo, 'gogo', 'dq.st.g3', 2600);
    await wait(this, 2600);
    this.cameras.main.fadeOut(900, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('DuanqiaoCrowd'));
  }

  private until(cond: () => boolean): Promise<void> {
    return new Promise((resolve) => {
      const ev = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (cond()) {
            ev.remove();
            resolve();
          }
        },
      });
    });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50);
    const sec = dt / 1000;
    this.snow.update(dt, time);
    if (this.keyDown.isDown) this.ducking = true;
    else if (!this.duckBtn?.isDown()) this.ducking = false;

    if (this.walking) {
      this.meX = Math.min(WORLD_W - 600, this.meX + WALK * sec);
      // friends stroll alongside, bobbing
      for (const [k, dx] of [['koko', 180], ['gogo', 300]] as const) {
        const g = this.walkers[k];
        g.x += (this.meX + dx - g.x) * Math.min(1, sec * 2.5);
        g.y = GROUND - Math.abs(Math.sin(time * 0.012 + dx)) * 4;
      }
    }
    const bob = this.walking ? Math.abs(Math.sin(time * 0.012)) * 4 : 0;
    this.me.setPosition(this.meX, GROUND - bob).setScale(1, this.ducking ? 0.62 : 1);
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.meX - ME_SCREEN_X, 0, WORLD_W - W);
    if (this.lakeRipples) this.lakeRipples.tilePositionX = this.cameras.main.scrollX * 0.3 + time * 0.005;

    this.updateFoes(time, sec);
    this.updateBalls(sec);

    this.bubbles = this.bubbles.filter((b) => {
      if (time > b.until) {
        b.box.destroy();
        return false;
      }
      b.box.setPosition(b.target.x, b.target.y - 170);
      return true;
    });
  }
}

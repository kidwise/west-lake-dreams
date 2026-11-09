import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { makeButton, type Button } from '../ui/Button';
import { overGlobalUI } from '../ui/overlay';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { hillPolygon, rng } from '../art/paint';
import { drawPagoda } from './art';
import { sfRun } from './state';

const WORLD = 5200;
const SCROLL = 58;
const TEA_Y = 560;
const HUD = 300;
const FOLLOW_R = 130;
const CALVES = 12;

type CalfState = 'free' | 'follow' | 'stuck' | 'lost';
interface Calf {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: CalfState;
  pullUntil: number;
  wob: number;
}

interface Skill {
  key: 'whistle' | 'moo' | 'bell';
  label: StrKey;
  cool: number;
  ready: number;
  btn?: Button;
}

/** Riding Granny Cow across the valley from the North Peak to the South Peak, herding her lost calves. */
export class ShuangfengHerdScene extends Phaser.Scene {
  private cow!: Phaser.GameObjects.Container;
  private cowX = 900;
  private cowY = 300;
  private target: { x: number; y: number } | null = null;
  private calves: Calf[] = [];
  private active = false;
  private windUntil = 0;
  private nextWind = 0;
  private bellUntil = 0;
  private skills: Skill[] = [];
  private countText!: Phaser.GameObjects.Text;
  private rings!: Phaser.GameObjects.Graphics;
  private ringFx: { x: number; y: number; r: number; max: number; color: number }[] = [];
  private factsShown = new Set<StrKey>();
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> = {};
  private windFx: Phaser.GameObjects.TileSprite | null = null;
  private stuckWarned = 0;

  constructor() {
    super('ShuangfengHerd');
  }

  create(): void {
    music.play('sfHerd');
    this.cowX = 900;
    this.cowY = 300;
    this.target = null;
    this.calves = [];
    this.active = false;
    this.windUntil = 0;
    this.bellUntil = 0;
    this.ringFx = [];
    this.factsShown = new Set();
    this.stuckWarned = 0;
    this.skills = [
      { key: 'whistle', label: 'sf.h.btnWhistle', cool: 5000, ready: 0 },
      { key: 'moo', label: 'sf.h.btnMoo', cool: 3000, ready: 0 },
      { key: 'bell', label: 'sf.h.btnBell', cool: 8000, ready: 0 },
    ];
    this.cameras.main.setBounds(0, 0, WORLD, H);
    this.cameras.main.setScroll(WORLD - W, 0);
    this.paint();
    this.spawnCalves();
    this.buildCow();
    this.rings = this.add.graphics().setDepth(60);
    this.countText = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#2f3b3a' })).setScrollFactor(0).setDepth(HUD);
    i18nText(this, 36, 38, () => t('sf.h.title'), { fontFamily: FONT_SERIF, fontSize: '22px' }).setScrollFactor(0).setDepth(HUD);
    this.windFx = this.add.tileSprite(0, 0, W, H, 'sfMist').setOrigin(0).setScrollFactor(0).setDepth(55).setAlpha(0);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.steer(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => p.isDown && this.steer(p));
    this.input.on('pointerup', () => (this.target = null));
    const kb = this.input.keyboard;
    this.cursors = kb?.createCursorKeys();
    if (kb) this.wasd = kb.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    kb?.on('keydown-ONE', () => this.use(0));
    kb?.on('keydown-TWO', () => this.use(1));
    kb?.on('keydown-THREE', () => this.use(2));
    this.cameras.main.fadeIn(900, 240, 244, 240);
    this.updateCount();
    void this.play();
  }

  // ---- scenery -------------------------------------------------------------------------------

  private paint(): void {
    const sky = this.add.graphics().setScrollFactor(0).setDepth(0);
    sky.fillGradientStyle(0xf7d9a8, 0xf7d9a8, 0xdcebf2, 0xdcebf2, 1);
    sky.fillRect(0, 0, W, H);
    // far ridges move slowly
    const far = this.add.graphics().setScrollFactor(0.3).setDepth(1);
    far.fillStyle(0xb7c9c0, 1);
    far.fillPoints(hillPolygon(WORLD * 0.3 + W + 100, 470, 40, H, 91, 20), true);
    const mid = this.add.graphics().setScrollFactor(0.6).setDepth(2);
    mid.fillStyle(0x93b09a, 1);
    mid.fillPoints(hillPolygon(WORLD * 0.6 + W + 100, 530, 50, H, 93, 20), true);
    for (let i = 0; i < 8; i++) this.add.image(i * 500, 500, 'sfMist').setScrollFactor(0.6).setScale(1.5, 0.7).setAlpha(0.6).setDepth(3);
    // the two peaks at either end: the lit North Peak where we start, the bare South Peak ahead
    const peaks = this.add.graphics().setDepth(4);
    peaks.fillStyle(0x6f907c, 1);
    peaks.fillPoints([new Phaser.Math.Vector2(WORLD - 700, H), new Phaser.Math.Vector2(WORLD - 330, 330), new Phaser.Math.Vector2(WORLD - 200, 300), new Phaser.Math.Vector2(WORLD - 80, 330), new Phaser.Math.Vector2(WORLD + 200, H)], true);
    drawPagoda(peaks, WORLD - 200, 306, 150, { lit: 1 });
    peaks.fillStyle(0x7f9e8c, 1);
    peaks.fillPoints([new Phaser.Math.Vector2(-200, H), new Phaser.Math.Vector2(140, 360), new Phaser.Math.Vector2(260, 330), new Phaser.Math.Vector2(380, 360), new Phaser.Math.Vector2(760, H)], true);
    // tea terraces of Longjing, row on row
    const r = rng(21);
    const terr = this.add.graphics().setDepth(5);
    for (let row = 0; row < 5; row++) {
      const y = TEA_Y + 10 + row * 34;
      terr.fillStyle(row % 2 ? 0x8fae6a : 0x9ab872, 1);
      terr.fillRect(0, y - 4, WORLD, 40);
      terr.fillStyle(0x7a8a5a, 1);
      terr.fillRect(0, y + 28, WORLD, 3);
    }
    for (let row = 0; row < 5; row++) {
      const y = TEA_Y + 22 + row * 34;
      for (let x = (row % 2) * 30; x < WORLD; x += 60) {
        // a road lined with tall pines cuts across the middle (九里松)
        if (x > 2300 && x < 2900) continue;
        this.add.image(x + r() * 8, y + (r() - 0.5) * 4, 'sfTea').setDepth(6 + row * 0.1).setScale(0.9 + r() * 0.2);
      }
    }
    terr.fillStyle(0xd9ccb4, 1);
    terr.fillRect(2300, TEA_Y + 50, 600, 50);
    terr.fillStyle(0x8fae6a, 1);
    terr.fillRect(2300, TEA_Y, 600, 50);
    terr.fillRect(2300, TEA_Y + 100, 600, H - TEA_Y - 100);
    for (let x = 2320; x < 2900; x += 64) {
      this.add.image(x, TEA_Y + 56, 'sfPine').setOrigin(0.5, 1).setScale(0.55 + (x % 3) * 0.05).setDepth(7);
      this.add.image(x + 32, TEA_Y + 150, 'sfPine').setOrigin(0.5, 1).setScale(0.65 + (x % 2) * 0.05).setDepth(8);
    }
  }

  private spawnCalves(): void {
    const r = rng(12);
    for (let i = 0; i < CALVES; i++) {
      const x = WORLD - 900 - i * ((WORLD - 1500) / CALVES) - r() * 120;
      const y = 150 + r() * 260;
      const img = this.add.image(x, y, 'sfCalf').setDepth(30).setScale(0.6);
      this.calves.push({ img, x, y, vx: 0, vy: 0, state: 'free', pullUntil: 0, wob: r() * 10 });
    }
    sfRun.calvesTotal = CALVES;
  }

  private buildCow(): void {
    this.cow = this.add.container(0, 0).setDepth(40);
    // the three of us riding on her back
    ([['me', 10], ['gogo', 40], ['koko', 70]] as const).forEach(([who, dx]) => {
      const g = this.add.graphics();
      drawPerson(g, LOOKS[who], { facing: -1, armUp: who === 'gogo', backpack: who === 'me' });
      g.setPosition(dx - 22, 6).setScale(0.48);
      this.cow.add(g);
    });
    this.cow.add(this.add.image(0, 0, 'sfCow').setScale(0.62));
  }

  // ---- story ------------------------------------------------------------------------------------

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('cow', 'sf.h.c1');
    await dlg.say('cow', 'sf.h.c2');
    await dlg.say('koko', 'sf.h.k1');
    dlg.hide();
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, 112, () => t(touch ? 'sf.h.hintTouch' : 'sf.h.hintKeys'), {
      fontSize: '18px',
      color: '#2f3b3a',
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: W - 260, useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(HUD);
    this.tweens.add({ targets: hint, alpha: 0, delay: 10000, duration: 1200 });
    this.skills.forEach((s, i) => {
      s.btn = makeButton(this, W / 2 + (i - 1) * 220, H - 46, () => `${i + 1} · ${t(s.label)}`, { width: 190, height: 56, fontSize: 22, fixed: true, depth: HUD, onClick: () => this.use(i) });
    });
    this.active = true;
    this.nextWind = this.time.now + 14000;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.active && (ev.remove(), res()) });
    });
    hint.destroy();
    for (const s of this.skills) s.btn?.destroy();
    sfRun.calves = this.calves.filter((c) => c.state === 'follow').length;
    sfx.chime();
    await wait(this, 600);
    await dlg.say('cow', sfRun.calves >= CALVES ? 'sf.h.cAll' : 'sf.h.c3', { n: sfRun.calves });
    await dlg.say('gogo', 'sf.h.g1');
    dlg.hide();
    this.cameras.main.fadeOut(900, 240, 236, 220);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('ShuangfengDig'));
  }

  private steer(p: Phaser.Input.Pointer): void {
    if (!this.active || overGlobalUI(p)) return;
    if (p.y > H - 80 && Math.abs(p.x - W / 2) < 340) return;
    this.target = { x: p.x, y: p.y };
  }

  private use(i: number): void {
    const s = this.skills[i];
    const now = this.time.now;
    if (!this.active || !s || now < s.ready) return;
    s.ready = now + s.cool;
    const cx = this.cam().scrollX + this.cowX;
    const cy = this.cowY;
    if (s.key === 'whistle') {
      sfx.whistle();
      this.ringFx.push({ x: cx, y: cy, r: 40, max: 460, color: 0xf1948a });
      for (const c of this.calves) {
        if (c.state === 'free' && Math.hypot(c.x - cx, c.y - cy) < 460) c.pullUntil = now + 1600;
      }
    } else if (s.key === 'moo') {
      sfx.moo();
      this.ringFx.push({ x: cx, y: cy, r: 40, max: 320, color: 0x5dade2 });
      for (const c of this.calves) {
        if ((c.state === 'free' || c.state === 'stuck') && Math.hypot(c.x - cx, c.y - cy) < 320) {
          if (c.state === 'stuck') this.unstick(c);
          c.vy = -280;
        }
      }
    } else {
      sfx.cowbell();
      this.bellUntil = now + 4500;
      this.ringFx.push({ x: cx, y: cy, r: 40, max: 220, color: 0xd9a93a });
    }
  }

  private unstick(c: Calf): void {
    c.state = 'free';
    c.img.clearTint().setAlpha(1);
    this.pop(t('sf.h.free'), c.x, c.y - 40, '#2471a3');
  }

  private updateCount(): void {
    const n = this.calves.filter((c) => c.state === 'follow').length;
    this.countText.setText(t('sf.h.count', { n, total: CALVES }));
  }

  private pop(s: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '22px', color, fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD - 5);
    this.tweens.add({ targets: txt, y: y - 36, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
  }

  private toast(key: StrKey): void {
    if (this.factsShown.has(key)) return;
    this.factsShown.add(key);
    const box = this.add.container(W / 2, 200).setScrollFactor(0).setDepth(HUD + 2).setAlpha(0);
    const txt = this.add.text(0, 0, t(key), baseStyle({ fontFamily: FONT_SERIF, fontSize: '21px', color: '#2f3b3a', align: 'center', wordWrap: { width: 980, useAdvancedWrap: true } })).setOrigin(0.5);
    const bg = this.add.graphics();
    bg.fillStyle(0xfdf8ee, 0.9);
    bg.fillRoundedRect(-txt.width / 2 - 24, -txt.height / 2 - 14, txt.width + 48, txt.height + 28, 14);
    box.add([bg, txt]);
    this.tweens.add({ targets: box, alpha: 1, duration: 300, yoyo: true, hold: 4200, onComplete: () => box.destroy() });
  }

  private cam(): Phaser.Cameras.Scene2D.Camera {
    return this.cameras.main;
  }

  // ---- frame ---------------------------------------------------------------------------------

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    const cam = this.cam();
    if (this.active) {
      cam.scrollX = Math.max(0, cam.scrollX - SCROLL * dt);
      // steering: towards the pointer, or with the arrow keys
      const kx = (this.cursors?.left.isDown || this.wasd.A?.isDown ? -1 : 0) + (this.cursors?.right.isDown || this.wasd.D?.isDown ? 1 : 0);
      const ky = (this.cursors?.up.isDown || this.wasd.W?.isDown ? -1 : 0) + (this.cursors?.down.isDown || this.wasd.S?.isDown ? 1 : 0);
      if (kx || ky) {
        this.cowX += kx * 380 * dt;
        this.cowY += ky * 320 * dt;
      } else if (this.target) {
        const dx = this.target.x - this.cowX;
        const dy = this.target.y - this.cowY;
        const d = Math.hypot(dx, dy);
        const step = Math.min(d, 420 * dt);
        if (d > 1) {
          this.cowX += (dx / d) * step;
          this.cowY += (dy / d) * step;
        }
      }
      this.cowX = Phaser.Math.Clamp(this.cowX, 130, W - 200);
      this.cowY = Phaser.Math.Clamp(this.cowY, 140, TEA_Y - 70);
      // gusts of wind blow everything back the way we came
      if (time > this.nextWind) {
        this.windUntil = time + 2600;
        this.nextWind = time + 11000 + Math.random() * 5000;
        sfx.wind();
        this.pop(t('sf.h.wind'), W / 2 + cam.scrollX, 240, '#5d8ab0');
      }
      if (cam.scrollX <= 0) this.active = false;
      const prog = 1 - cam.scrollX / (WORLD - W);
      if (prog > 0.18) this.toast('sf.h.n.tea');
      if (prog > 0.5) this.toast('sf.h.n.pine');
    }
    const windy = time < this.windUntil;
    if (this.windFx) {
      this.windFx.setAlpha(Phaser.Math.Linear(this.windFx.alpha, windy ? 0.35 : 0, dt * 3));
      this.windFx.tilePositionX -= dt * 900;
    }
    const wx = cam.scrollX + this.cowX;
    const wy = this.cowY;
    this.cow.setPosition(wx, wy + Math.sin(time * 0.003) * 5);
    // the calves
    const bell = time < this.bellUntil;
    let k = 0;
    let changed = false;
    for (const c of this.calves) {
      if (c.state === 'lost') continue;
      if (c.state === 'follow') {
        // in a line behind Granny Cow
        const tx = wx + 110 + k * 58;
        const ty = wy + 30 + Math.sin(time * 0.003 + k) * 14 - (k % 2) * 20;
        const gain = bell ? 9 : 3.2;
        c.x += (tx - c.x) * Math.min(1, gain * dt);
        c.y += (ty - c.y) * Math.min(1, gain * dt);
        if (windy && !bell) c.x += 150 * dt;
        k += 1;
        // blown too far back, it drifts off on its own
        if (Math.hypot(tx - c.x, ty - c.y) > 240) {
          c.state = 'free';
          changed = true;
        }
      } else if (c.state === 'free') {
        c.wob += dt;
        if (time < c.pullUntil) {
          const dx = wx - c.x;
          const dy = wy - c.y;
          const d = Math.hypot(dx, dy) || 1;
          c.vx = (dx / d) * 260;
          c.vy = (dy / d) * 260;
        } else {
          c.vx += (Math.sin(c.wob * 0.9) * 30 - c.vx) * dt;
          c.vy += 16 * dt; // slowly sinking
          c.vy = Math.min(c.vy, 40);
        }
        if (windy) c.x += 120 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.vy < 0) c.vy += 260 * dt;
        c.y = Math.max(110, c.y);
        if (Math.hypot(c.x - wx, c.y - wy) < (bell ? 210 : FOLLOW_R)) {
          c.state = 'follow';
          changed = true;
          sfx.cowbell();
          this.pop(t('sf.h.join'), c.x, c.y - 40, '#c0392b');
        } else if (c.y > TEA_Y - 10) {
          // too low: it turns to mist and catches on the tea bushes
          c.state = 'stuck';
          c.y = TEA_Y + 6;
          c.img.setTint(0xc8d0d4).setAlpha(0.75);
          if (time > this.stuckWarned) {
            this.stuckWarned = time + 6000;
            this.pop(t('sf.h.stuck'), c.x, c.y - 70, '#7a4a3a');
          }
        }
      }
      // left behind, off the right-hand edge
      if (c.state !== 'follow' && c.x > cam.scrollX + W + 120 && this.active) {
        c.state = 'lost';
        this.tweens.add({ targets: c.img, alpha: 0, duration: 600 });
        changed = true;
        continue;
      }
      c.img.setPosition(c.x, c.y + (c.state === 'stuck' ? 0 : Math.sin(time * 0.004 + c.wob) * 4));
      c.img.setFlipX(c.state === 'follow' ? false : c.vx > 10);
    }
    if (changed) this.updateCount();
    // whistle / moo / bell rings
    const g = this.rings;
    g.clear();
    for (const r of this.ringFx) {
      r.r += dt * 600;
      g.lineStyle(4, r.color, Math.max(0, 1 - r.r / r.max));
      g.strokeCircle(r.x, r.y, r.r);
    }
    this.ringFx = this.ringFx.filter((r) => r.r < r.max);
    // cooldowns
    for (const s of this.skills) s.btn?.container.setAlpha(time < s.ready ? 0.45 : 1);
  }
}

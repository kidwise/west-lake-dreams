import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t } from '../core/i18n';
import { sfx } from '../core/sfx';
import { tweenP, wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { lfRun } from './state';

const HUD = 300;
const COLS = 14;
const ROWS = 5;
const BW = 62;
const BH = 30;
const WALL = { x: (W - COLS * BW) / 2, y: 290 };
const FLOOR = 560;
const DURATION = 40;
const LIFT = { x: 1188, y: 250, w: 120, h: 220 };

interface Slot {
  x: number;
  y: number;
  scroll: boolean;
  img: Phaser.GameObjects.Image | null;
  taken: boolean;
}
interface Crab {
  img: Phaser.GameObjects.Image;
  state: 'in' | 'pry' | 'carry' | 'flee';
  slot: Slot;
  brick: Phaser.GameObjects.Image | null;
  until: number;
  exitX: number;
}

/** Inside the base: the old pagoda's ruins under glass. 法海's crabs are stealing the bricks. */
export class LeifengRuinsScene extends Phaser.Scene {
  private slots: Slot[] = [];
  private crabs: Crab[] = [];
  private active = false;
  private startAt = 0;
  private nextCrab = 0;
  private fahai!: Phaser.GameObjects.Image;
  private timeText!: Phaser.GameObjects.Text;
  private savedText!: Phaser.GameObjects.Text;
  private loose = new Set<Phaser.GameObjects.Image>();
  private liftDoors!: Phaser.GameObjects.Graphics;
  private beams!: Phaser.GameObjects.Graphics;

  constructor() {
    super('LeifengRuins');
  }

  create(): void {
    music.play('lfRuins');
    this.slots = [];
    this.crabs = [];
    this.loose = new Set();
    this.active = false;
    this.paint();
    this.timeText = this.add.text(36, 76, '', baseStyle({ fontSize: '20px', color: '#ffe8c8' })).setDepth(HUD);
    this.savedText = this.add.text(36, 106, '', baseStyle({ fontSize: '20px', color: '#ffe8c8' })).setDepth(HUD);
    i18nText(this, 36, 38, () => t('lf.r.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#ffe8c8' }).setDepth(HUD);
    this.cameras.main.fadeIn(800, 30, 16, 24);
    void this.play();
  }

  // ---- the hall under the pagoda ---------------------------------------------------------------------

  private paint(): void {
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x3a2228, 0x3a2228, 0x1c1014, 0x1c1014, 1);
    g.fillRect(0, 0, W, H);
    // the back wall: gilded columns and a faint mural band
    for (let x = 40; x < W; x += 180) {
      g.fillStyle(0x5a2a22, 1);
      g.fillRect(x, 0, 22, FLOOR - 100);
      g.fillStyle(0xc89a50, 0.6);
      g.fillRect(x + 16, 0, 4, FLOOR - 100);
    }
    g.fillStyle(0x4a3026, 1);
    g.fillRect(0, 150, W, 70);
    g.lineStyle(1.5, 0xd8a858, 0.35);
    const r = rng(31);
    for (let i = 0; i < 40; i++) {
      const x = r() * W;
      g.beginPath();
      g.arc(x, 185, 10 + r() * 14, Math.PI, Math.PI * 2, false);
      g.strokePath();
    }
    g.fillStyle(0xc89a50, 0.8);
    g.fillRect(0, 148, W, 3);
    g.fillRect(0, 220, W, 3);
    // the rubble of the old base behind the wall we're protecting
    g.fillStyle(0x4a2c26, 1);
    g.fillPoints([V(WALL.x - 40, WALL.y + 10), V(WALL.x + 60, WALL.y - 40), V(400, WALL.y - 26), V(560, WALL.y - 60), V(760, WALL.y - 34), V(920, WALL.y - 56), V(WALL.x + COLS * BW + 40, WALL.y + 10)], true);
    for (let i = 0; i < 70; i++) {
      g.fillStyle([0x6a3a2a, 0x7a4430, 0x5a3022][i % 3], 1);
      const x = WALL.x + r() * COLS * BW;
      g.fillRect(x, WALL.y - 10 - r() * 40, 14 + r() * 16, 7 + r() * 5);
    }
    // the floor: polished stone, and the glass edge round the ruins
    const fl = this.add.graphics().setDepth(1);
    fl.fillGradientStyle(0x5a3a34, 0x5a3a34, 0x2a1a1c, 0x2a1a1c, 1);
    fl.fillRect(0, FLOOR - 100, W, H - FLOOR + 100);
    fl.lineStyle(1, 0x8a5a48, 0.3);
    for (let x = -400; x < W + 400; x += 90) fl.lineBetween(W / 2 + (x - W / 2) * 0.4, FLOOR - 100, x, H);
    for (const y of [FLOOR - 60, FLOOR + 10, FLOOR + 100]) fl.lineBetween(0, y, W, y);
    // the brick wall itself
    for (let row = 0; row < ROWS; row++) {
      for (let c = 0; c < COLS; c++) {
        const x = WALL.x + c * BW + BW / 2 + (row % 2 ? BW / 2 : 0);
        if (x > WALL.x + COLS * BW) continue;
        const y = WALL.y + row * BH + BH / 2;
        const scroll = r() < 0.18;
        const img = this.add.image(x, y, scroll ? 'lfBrickScroll' : 'lfBrick').setDepth(5);
        this.slots.push({ x, y, scroll, img, taken: false });
      }
    }
    // the glass over the ruins, with reflections
    const glass = this.add.graphics().setDepth(8);
    glass.fillStyle(0xcfe4f0, 0.07);
    glass.fillRect(WALL.x - 30, WALL.y - 70, COLS * BW + 60, ROWS * BH + 90);
    glass.lineStyle(2, 0xe8f0f8, 0.25);
    glass.strokeRect(WALL.x - 30, WALL.y - 70, COLS * BW + 60, ROWS * BH + 90);
    glass.fillStyle(0xffffff, 0.05);
    for (const x of [260, 300, 700, 730]) glass.fillPoints([V(x, WALL.y - 70), V(x + 40, WALL.y - 70), V(x - 60, WALL.y + ROWS * BH + 20), V(x - 100, WALL.y + ROWS * BH + 20)], true);
    // the lift, out of order
    const lift = this.add.graphics().setDepth(3);
    lift.fillStyle(0x3a2a22, 1);
    lift.fillRect(LIFT.x - LIFT.w / 2 - 14, LIFT.y - 40, LIFT.w + 28, LIFT.h + 40);
    lift.fillStyle(0xc89a50, 1);
    lift.fillRect(LIFT.x - LIFT.w / 2 - 14, LIFT.y - 40, LIFT.w + 28, 6);
    this.liftDoors = this.add.graphics().setDepth(4);
    this.drawDoors(0);
    this.add.text(LIFT.x, LIFT.y - 20, '— —', baseStyle({ fontSize: '16px', color: '#ff7a5a', fontStyle: 'bold' })).setOrigin(0.5).setDepth(4).setName('liftLed');
    // spotlights from the ceiling
    this.beams = this.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    for (const x of [360, 640, 920]) {
      this.beams.fillStyle(0xffd8a0, 0.06);
      this.beams.fillTriangle(x - 20, 0, x + 20, 0, x + 140, WALL.y + ROWS * BH);
      this.beams.fillTriangle(x - 20, 0, x + 20, 0, x - 140, WALL.y + ROWS * BH);
      this.beams.fillStyle(0xffd8a0, 0.04);
      this.beams.fillTriangle(x - 10, 0, x + 10, 0, x, WALL.y + ROWS * BH);
    }
    // 法海, sitting on the wall with his wooden fish
    this.fahai = this.add.image(640, WALL.y - 40, 'lfFahai').setOrigin(0.5, 1).setScale(0.5).setDepth(7);
    // the lady and the three of us by the glass
    this.add.image(120, FLOOR + 40, 'lfLady').setOrigin(0.5, 1).setScale(0.5).setDepth(20);
    for (const [who, x] of [['koko', 220], ['gogo', 300], ['me', 380]] as const) {
      const k = this.add.graphics().setDepth(21);
      drawPerson(k, LOOKS[who], { facing: 1, backpack: who === 'me' });
      k.setPosition(x, FLOOR + 40).setScale(0.8);
    }
  }

  private drawDoors(open: number): void {
    const g = this.liftDoors;
    g.clear();
    g.fillStyle(0xffe0a8, 1);
    g.fillRect(LIFT.x - LIFT.w / 2, LIFT.y, LIFT.w, LIFT.h);
    const half = (LIFT.w / 2) * (1 - open);
    g.fillGradientStyle(0xb88a48, 0xe8c078, 0x8a6030, 0xb88a48, 1);
    g.fillRect(LIFT.x - LIFT.w / 2, LIFT.y, half, LIFT.h);
    g.fillRect(LIFT.x + LIFT.w / 2 - half, LIFT.y, half, LIFT.h);
    g.lineStyle(1, 0x6a4a20, 1);
    g.lineBetween(LIFT.x - LIFT.w / 2 + half, LIFT.y, LIFT.x - LIFT.w / 2 + half, LIFT.y + LIFT.h);
    g.lineBetween(LIFT.x + LIFT.w / 2 - half, LIFT.y, LIFT.x + LIFT.w / 2 - half, LIFT.y + LIFT.h);
  }

  // ---- story -------------------------------------------------------------------------------------------

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('white', 'lf.r.w1');
    await dlg.say('white', 'lf.r.w2');
    await dlg.say('me', 'lf.r.m1');
    await dlg.say('koko', 'lf.r.k1');
    this.tweens.add({ targets: this.fahai, y: this.fahai.y - 12, yoyo: true, duration: 120, repeat: 2 });
    sfx.tock();
    await dlg.say('fahai', 'lf.r.f1');
    await dlg.say('gogo', 'lf.r.g1');
    dlg.hide();
    const hint = i18nText(this, W / 2, H - 24, () => t('lf.r.hint'), { fontSize: '20px', color: '#ffe8c8' }).setOrigin(0.5, 1).setDepth(HUD);
    this.active = true;
    this.startAt = this.time.now;
    this.nextCrab = this.time.now + 600;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.active && (ev.remove(), res()) });
    });
    hint.destroy();
    // the last crabs scuttle off, and any dropped bricks go back
    for (const c of this.crabs) {
      if (c.brick) this.dropBrick(c);
      if (c.state === 'pry') c.slot.img?.setAngle(0);
      if (c.state !== 'carry') c.slot.taken = false;
      if (c.state !== 'flee') this.flee(c);
    }
    await wait(this, 500);
    for (const b of [...this.loose]) this.returnBrick(b);
    await wait(this, 800);
    lfRun.bricksLost = this.slots.filter((s) => s.taken && !s.img).length;
    await dlg.say('fahai', 'lf.r.f2');
    dlg.hide();
    // off he goes, up the stairs inside
    sfx.tock();
    await tweenP(this, { targets: this.fahai, x: 1040, y: 120, scale: 0.2, alpha: 0, duration: 900, ease: 'Sine.easeIn' });
    await this.palace(dlg);
    // the lift works again
    sfx.ding();
    (this.children.getByName('liftLed') as Phaser.GameObjects.Text | null)?.setText('▲ 5F').setColor('#ffe08a');
    await this.tweenDoors();
    await dlg.say('gogo', 'lf.r.g2');
    await dlg.say('white', 'lf.r.w4');
    dlg.hide();
    this.cameras.main.fadeOut(800, 255, 220, 160);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('LeifengTop'));
  }

  private async tweenDoors(): Promise<void> {
    await new Promise<void>((res) => this.tweens.addCounter({ from: 0, to: 1, duration: 800, onUpdate: (tw) => this.drawDoors(tw.getValue() ?? 0), onComplete: () => res() }));
  }

  /** The underground palace (地宫) lights up: the silver stupa. */
  private async palace(dlg: Dialogue): Promise<void> {
    await dlg.say('white', 'lf.r.w3');
    dlg.hide();
    const cx = W / 2;
    const glow = this.add.image(cx, FLOOR - 10, 'lfGlow').setScale(0.5).setAlpha(0).setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
    const beam = this.add.graphics().setDepth(29).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    beam.fillStyle(0xe8f0ff, 0.12);
    beam.fillTriangle(cx - 60, FLOOR, cx + 60, FLOOR, cx, 0);
    beam.fillStyle(0xe8f0ff, 0.08);
    beam.fillTriangle(cx - 130, FLOOR, cx + 130, FLOOR, cx, 0);
    sfx.shimmer();
    this.tweens.add({ targets: glow, scale: 5, alpha: 0.9, duration: 1200 });
    this.tweens.add({ targets: beam, alpha: 1, duration: 1200 });
    const stupa = this.add.image(cx, FLOOR + 40, 'lfStupa').setOrigin(0.5, 1).setScale(0.2).setAlpha(0).setDepth(31);
    await tweenP(this, { targets: stupa, y: FLOOR - 20, scale: 1, alpha: 1, duration: 1600, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: stupa, y: FLOOR - 30, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
    for (let i = 0; i < 14; i++) {
      const sp = this.add.image(cx + (Math.random() - 0.5) * 160, FLOOR - Math.random() * 220, 'lfSpark').setDepth(32).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5 + Math.random());
      this.tweens.add({ targets: sp, alpha: 0, y: sp.y - 40, delay: i * 120, duration: 1400, onComplete: () => sp.destroy() });
    }
    await wait(this, 600);
    await dlg.say(null, 'lf.r.n1');
    await dlg.say('koko', 'lf.r.k2');
    dlg.hide();
    this.tweens.add({ targets: [stupa, glow, beam], alpha: 0, duration: 900 });
    await wait(this, 700);
  }

  // ---- the crabs -----------------------------------------------------------------------------------

  private spawnCrab(): void {
    const free = this.slots.filter((s) => s.img && !s.taken);
    if (!free.length) return;
    const slot = free[Math.floor(Math.random() * free.length)];
    slot.taken = true;
    const left = Math.random() < 0.5;
    const img = this.add.image(left ? -50 : W + 50, FLOOR + 20 + Math.random() * 60, 'lfCrabMonk').setScale(0.6).setDepth(12);
    img.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(60, 40, 52), hitAreaCallback: Phaser.Geom.Circle.Contains });
    const crab: Crab = { img, state: 'in', slot, brick: null, until: 0, exitX: left ? -80 : W + 80 };
    img.on('pointerdown', () => this.tapCrab(crab));
    this.crabs.push(crab);
    sfx.scuttle();
    // 法海 bangs his wooden fish
    sfx.tock();
    this.tweens.add({ targets: this.fahai, angle: -6, yoyo: true, duration: 100 });
  }

  private tapCrab(c: Crab): void {
    if (!this.active || c.state === 'flee') return;
    lfRun.crabs += 1;
    if (c.brick) {
      this.dropBrick(c);
      this.pop(t('lf.r.drop'), c.img.x, c.img.y - 50, '#ffe08a');
    } else if (c.state === 'pry') {
      // caught in the act: the brick settles back
      c.slot.taken = false;
      if (c.slot.img) c.slot.img.setAngle(0).setPosition(c.slot.x, c.slot.y);
    } else c.slot.taken = false;
    sfx.blip();
    this.flee(c);
  }

  private flee(c: Crab): void {
    c.state = 'flee';
    c.img.disableInteractive();
    this.tweens.add({ targets: c.img, angle: 360 * (c.exitX < 0 ? -1 : 1), duration: 500 });
  }

  private dropBrick(c: Crab): void {
    const b = c.brick;
    if (!b) return;
    c.brick = null;
    sfx.dig();
    const y = FLOOR + 50 + Math.random() * 40;
    this.tweens.add({ targets: b, y, angle: (Math.random() - 0.5) * 40, duration: 400, ease: 'Bounce.easeOut' });
    b.setInteractive({ useHandCursor: true });
    b.setData('slot', c.slot);
    this.loose.add(b);
    b.once('pointerdown', () => this.returnBrick(b));
  }

  private returnBrick(b: Phaser.GameObjects.Image): void {
    if (!this.loose.has(b)) return;
    this.loose.delete(b);
    b.disableInteractive();
    const slot = b.getData('slot') as Slot;
    lfRun.bricksSaved += 1;
    sfx.stamp();
    this.tweens.add({
      targets: b,
      x: slot.x,
      y: slot.y,
      angle: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        b.setDepth(5);
        slot.img = b;
        slot.taken = false;
        if (slot.scroll) {
          sfx.shimmer();
          this.pop(t('lf.r.scroll'), slot.x, slot.y - 30, '#ffe08a');
          const sp = this.add.image(slot.x, slot.y, 'lfSpark').setScale(2).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({ targets: sp, scale: 4, alpha: 0, duration: 700, onComplete: () => sp.destroy() });
        } else this.pop(t('lf.r.back'), slot.x, slot.y - 30, '#c8f0c8');
      },
    });
  }

  private pop(s: string, x: number, y: number, color: string): void {
    const txt = this.add.text(x, y, s, baseStyle({ fontSize: '22px', color, fontStyle: 'bold', stroke: '#2a1418', strokeThickness: 5 })).setOrigin(0.5).setDepth(HUD - 5);
    this.tweens.add({ targets: txt, y: y - 36, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    if (this.active) {
      const elapsed = (time - this.startAt) / 1000;
      const left = Math.max(0, DURATION - elapsed);
      this.timeText.setText(t('lf.r.time', { n: Math.ceil(left) }));
      if (left <= 0) this.active = false;
      if (time > this.nextCrab) {
        this.spawnCrab();
        this.nextCrab = time + Phaser.Math.Linear(1900, 850, Math.min(1, elapsed / DURATION));
      }
    }
    const kept = this.slots.filter((s) => s.img).length;
    this.savedText.setText(t('lf.r.kept', { n: kept, total: this.slots.length }));
    for (const c of this.crabs) {
      const img = c.img;
      img.setAngle(c.state === 'flee' ? img.angle : Math.sin(time * 0.03) * 6);
      if (c.state === 'in') {
        const dx = c.slot.x - img.x;
        const dy = c.slot.y - img.y;
        const d = Math.hypot(dx, dy);
        const step = 170 * dt;
        if (d <= step) {
          img.setPosition(c.slot.x, c.slot.y);
          c.state = 'pry';
          c.until = time + 900;
        } else img.setPosition(img.x + (dx / d) * step, img.y + (dy / d) * step);
      } else if (c.state === 'pry') {
        c.slot.img?.setAngle(Math.sin(time * 0.06) * 10);
        if (time > c.until && c.slot.img) {
          c.brick = c.slot.img.setDepth(13);
          c.slot.img = null;
          c.state = 'carry';
          sfx.dig();
        }
      } else if (c.state === 'carry') {
        const tx = c.exitX;
        const ty = FLOOR + 40;
        const dx = tx - img.x;
        const dy = ty - img.y;
        const d = Math.hypot(dx, dy);
        const step = 115 * dt;
        img.setPosition(img.x + (dx / d) * step, img.y + (dy / d) * step);
        c.brick?.setPosition(img.x, img.y - 28).setAngle(Math.sin(time * 0.02) * 6);
        if (d < 10) {
          // gone with the brick
          c.brick?.destroy();
          c.brick = null;
          c.state = 'flee';
          this.pop(t('lf.r.lost'), Phaser.Math.Clamp(img.x, 80, W - 80), FLOOR, '#ffb0a0');
        }
      } else {
        img.x += (c.exitX < 0 ? -1 : 1) * 420 * dt;
      }
    }
    this.crabs = this.crabs.filter((c) => {
      if (c.state === 'flee' && (c.img.x < -100 || c.img.x > W + 100)) {
        c.img.destroy();
        return false;
      }
      return true;
    });
  }
}

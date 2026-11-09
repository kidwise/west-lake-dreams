import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { wait } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { Dialogue } from '../ui/Dialogue';
import { overGlobalUI } from '../ui/overlay';
import { getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { koiSideTexture } from '../huagang/koi';
import { LANDMARKS, VIEW } from './art';
import { npRun, nextNpKey } from './state';

const HUD = 300;
const BELL = { x: 330, y: 300, seatY: 325, rim: 438 };
const LOG_SCALE = 0.62;
const LOG_W = 270 * LOG_SCALE;
const REST = BELL.rim + LOG_W / 2;
const PULL = 130;
const PER_STRIKE = 12;
const GOOD = { lo: 0.55, hi: 0.85 };
const RUSH = 0.35;
/** The order the bell's voice reaches the other scenes, nearest first. */
const ORDER = ['leifeng', 'huagang', 'sudi', 'santan', 'shuangfeng', 'quyuan', 'pinghu', 'duanqiao', 'liulang'];

/** Who answers at each place, if we've been there in a dream. */
function friendIcon(scene: Phaser.Scene, id: string): { key: string; scale: number } {
  switch (id) {
    case 'leifeng':
      return { key: 'lfCrabMonk', scale: 0.7 };
    case 'huagang':
      return { key: koiSideTexture(scene, 'kohaku', 3), scale: 0.5 };
    case 'sudi':
      return { key: 'peach', scale: 1.6 };
    case 'santan':
      return { key: 'santanPagodaLit', scale: 0.5 };
    case 'shuangfeng':
      return { key: 'sfCow', scale: 0.3 };
    case 'quyuan':
      return { key: 'bloomFull', scale: 0.8 };
    case 'pinghu':
      return { key: 'phRabbit', scale: 0.9 };
    case 'duanqiao':
      return { key: 'lfLady', scale: 0.32 };
    default:
      return { key: 'sudiCatkin', scale: 2 };
  }
}

interface Wave {
  r: number;
  a: number;
}

/** Ring the evening bell — each good strike carries across the lake to another of the Ten Scenes. */
export class NanpingBellScene extends Phaser.Scene {
  private log!: Phaser.GameObjects.Image;
  private ropes!: Phaser.GameObjects.Graphics;
  private bell!: Phaser.GameObjects.Image;
  private meter!: Phaser.GameObjects.Graphics;
  private ringG!: Phaser.GameObjects.Graphics;
  private waveG!: Phaser.GameObjects.Graphics;
  private countText!: Phaser.GameObjects.Text;
  private pulling = false;
  private power = 0;
  private swinging = false;
  private ring = 0;
  private count = 0;
  private active = false;
  private waves: Wave[] = [];
  private cards: Phaser.GameObjects.GameObject[] = [];
  private visited = new Set<string>();

  constructor() {
    super('NanpingBell');
  }

  create(): void {
    music.play('npBell');
    Object.assign(this, { pulling: false, power: 0, swinging: false, ring: 0, count: 0, active: false });
    this.waves = [];
    this.cards = [];
    this.visited = new Set(getProgress().visited);
    this.add.image(0, 0, 'npTower').setOrigin(0);
    this.waveG = this.add.graphics().setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
    this.ringG = this.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    this.bell = this.add.image(BELL.x, BELL.y, 'npBell').setDepth(5);
    this.ropes = this.add.graphics().setDepth(6);
    this.log = this.add.image(REST, BELL.seatY, 'npLog').setDepth(7).setFlipX(true).setScale(LOG_SCALE, 0.8);
    this.meter = this.add.graphics().setDepth(HUD);
    // 济公 and the three of us, ready on the rope
    this.add.image(110, 640, 'npJigong').setOrigin(0.5, 1).setDepth(20).setScale(0.48);
    for (const [who, x] of [['koko', 470], ['gogo', 540], ['me', 610]] as const) {
      const g = this.add.graphics().setDepth(20);
      drawPerson(g, LOOKS[who], { facing: -1, armUp: true, backpack: who === 'me' });
      g.setPosition(x, 650).setScale(0.85);
    }
    i18nText(this, 664, 86, () => t('np.b.title'), { fontFamily: FONT_SERIF, fontSize: '22px', color: '#fff4e0', stroke: '#2a1e30', strokeThickness: 4 }).setDepth(HUD);
    this.countText = this.add.text(664, 114, '', baseStyle({ fontFamily: FONT_SERIF, fontSize: '34px', color: '#ffe08a', fontStyle: 'bold', stroke: '#2a1e30', strokeThickness: 5 })).setDepth(HUD);
    this.drawRopes();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => !overGlobalUI(p) && this.startPull());
    this.input.on('pointerup', () => this.release());
    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', () => this.startPull());
    kb?.on('keyup-SPACE', () => this.release());
    this.cameras.main.fadeIn(800, 20, 12, 10);
    void this.play();
  }

  private async play(): Promise<void> {
    const dlg = new Dialogue(this);
    await dlg.say('jigong', 'np.b.j0');
    await dlg.say('jigong', 'np.b.j1');
    await dlg.say('gogo', 'np.b.g1');
    dlg.hide();
    const touch = this.sys.game.device.input.touch;
    const hint = i18nText(this, W / 2, H - 14, () => t(touch ? 'np.b.hintTouch' : 'np.b.hint'), { fontSize: '18px', color: '#fff4e0', stroke: '#1a100c', strokeThickness: 5, align: 'center', wordWrap: { width: W - 120, useAdvancedWrap: true } }).setOrigin(0.5, 1).setDepth(HUD);
    this.updateCount();
    this.active = true;
    await new Promise<void>((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => !this.active && !this.swinging && (ev.remove(), res()) });
    });
    hint.destroy();
    this.meter.clear();
    await wait(this, 2500);
    await this.finale(dlg);
  }

  private updateCount(): void {
    this.countText.setText(t('np.b.count', { n: this.count }));
  }

  private drawRopes(): void {
    const g = this.ropes;
    g.clear();
    g.lineStyle(3, 0x8a6a3a, 1);
    const x = this.log.x;
    const y = this.log.y;
    g.lineBetween(480, 122, x - 45, y - 12);
    g.lineBetween(580, 122, x + 45, y - 12);
    // the pull-rope down to our hands
    g.lineStyle(2.5, 0xc8a860, 1);
    g.lineBetween(x + LOG_W / 2 - 6, y, 560, 540);
  }

  // ---- striking ---------------------------------------------------------------------------------

  private startPull(): void {
    if (!this.active || this.swinging || this.pulling) return;
    this.pulling = true;
    this.power = 0;
  }

  private release(): void {
    if (!this.pulling) return;
    this.pulling = false;
    this.swinging = true;
    const power = this.power;
    this.tweens.add({
      targets: this.log,
      x: REST,
      duration: 140 + (1 - power) * 120,
      ease: 'Quad.easeIn',
      onUpdate: () => this.drawRopes(),
      onComplete: () => {
        this.strike(power);
        // bounce back a little, then settle
        this.tweens.add({ targets: this.log, x: REST + 30 * power, yoyo: true, duration: 260, ease: 'Sine.easeOut', onUpdate: () => this.drawRopes(), onComplete: () => (this.swinging = false) });
      },
    });
  }

  private strike(power: number): void {
    npRun.strikes += 1;
    this.tweens.add({ targets: this.bell, angle: (power * 2.5) * (Math.random() < 0.5 ? 1 : -1), yoyo: true, duration: 120, repeat: 1 });
    let key: StrKey;
    if (this.ring > RUSH) {
      sfx.templeBell('dull');
      key = 'np.b.rush';
    } else if (power < GOOD.lo) {
      sfx.templeBell('dull');
      key = 'np.b.weak';
      this.ring = 0.45;
    } else if (power > GOOD.hi) {
      sfx.templeBell('harsh');
      key = 'np.b.harsh';
      this.ring = 0.7;
      this.cameras.main.shake(260, 0.006);
    } else {
      sfx.templeBell('good');
      key = 'np.b.good';
      this.ring = 1;
      npRun.good += 1;
      this.count = Math.min(108, this.count + PER_STRIKE);
      this.updateCount();
      this.waves.push({ r: 10, a: 1 });
      const id = ORDER[npRun.good - 1];
      if (id) this.time.delayedCall(900, () => this.reach(id));
      if (this.count >= 108) this.active = false;
    }
    const good = key === 'np.b.good';
    const txt = this.add.text(BELL.x, 120, t(key), baseStyle({ fontFamily: FONT_SERIF, fontSize: good ? '40px' : '24px', color: good ? '#ffe08a' : '#ffd0c0', fontStyle: 'bold', stroke: '#1a100c', strokeThickness: 6 })).setOrigin(0.5).setDepth(HUD);
    this.tweens.add({ targets: txt, y: 96, alpha: 0, delay: good ? 900 : 700, duration: 700, onComplete: () => txt.destroy() });
  }

  // ---- the roll call across the lake -------------------------------------------------------------

  /** The bell's voice reaches one of the Ten Scenes: an old friend answers, or the place lights up, waiting. */
  private reach(id: string): void {
    // the previous answer gives way at once, so captions never overlap
    for (const c of this.cards) if (c.active) c.destroy();
    this.cards = [];
    const lm = LANDMARKS[id];
    const met = this.visited.has(id);
    if (met) npRun.friends += 1;
    const view = TEN_VIEWS.find((v) => v.id === id);
    const name = view ? t(view.name) : id;
    const cx = Phaser.Math.Clamp(lm.x, VIEW.x + 60, VIEW.x + VIEW.w - 60);
    const cy = lm.y - 74;
    const card = this.add.container(cx, cy).setDepth(10).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1420, 0.75);
    bg.fillCircle(0, 0, 46);
    bg.lineStyle(3, met ? 0xffd27a : 0x9aa8d8, 1);
    bg.strokeCircle(0, 0, 46);
    bg.fillStyle(met ? 0xffd27a : 0x9aa8d8, 1);
    bg.fillTriangle(-8, 44, 8, 44, 0, 60);
    card.add(bg);
    if (met) {
      const ic = friendIcon(this, id);
      const img = this.add.image(0, 0, ic.key);
      img.setScale(Math.min(ic.scale, 76 / Math.max(img.width, img.height)));
      card.add(img);
    } else {
      card.add(this.add.image(0, 0, 'npSpirit').setScale(1.1).setBlendMode(Phaser.BlendModes.ADD));
      card.add(this.add.text(0, 2, '?', baseStyle({ fontSize: '30px', color: '#ffffff', fontStyle: 'bold' })).setOrigin(0.5));
    }
    this.tweens.add({ targets: card, alpha: 1, y: cy - 6, duration: 400, ease: 'Back.easeOut' });
    // a glow on the place itself
    const glow = this.add.image(lm.x, lm.y, 'lfGlow').setScale(1.4).setTint(met ? 0xffd27a : 0x9aa8ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(3).setAlpha(0);
    this.tweens.add({ targets: glow, alpha: 0.9, yoyo: true, duration: 700 });
    const caption = this.add.text(VIEW.x + VIEW.w / 2, VIEW.y + VIEW.h - 96, met ? t(`np.rc.${id}` as StrKey) : t('np.rc.unknown', { name }), baseStyle({
      fontFamily: FONT_SERIF,
      fontSize: '20px',
      color: met ? '#ffe8b0' : '#d8e0ff',
      align: 'center',
      backgroundColor: '#1a1420cc',
      padding: { x: 14, y: 8 },
      wordWrap: { width: VIEW.w - 60, useAdvancedWrap: true },
    })).setOrigin(0.5).setDepth(11).setAlpha(0);
    this.tweens.add({ targets: caption, alpha: 1, duration: 400 });
    this.cards.push(card, caption);
    if (met) sfx.shimmer();
    else sfx.chime();
  }

  /** The 108th strike: every place answers at once; a picture of it goes on the scroll. */
  private async finale(dlg: Dialogue): Promise<void> {
    for (const c of this.cards) if (c.active) this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
    this.cards = [];
    await wait(this, 400);
    for (const id of ORDER) {
      const lm = LANDMARKS[id];
      const met = this.visited.has(id);
      const img = met ? this.add.image(lm.x, lm.y - 26, friendIcon(this, id).key) : this.add.image(lm.x, lm.y - 20, 'npSpirit').setBlendMode(Phaser.BlendModes.ADD);
      img.setScale(Math.min(met ? friendIcon(this, id).scale * 0.6 : 0.7, 44 / Math.max(img.width, img.height) * (met ? 1 : 1.6))).setDepth(10).setAlpha(0);
      this.tweens.add({ targets: img, alpha: 1, duration: 500, delay: ORDER.indexOf(id) * 90 });
      this.add.image(lm.x, lm.y, 'lfGlow').setScale(1).setTint(met ? 0xffd27a : 0x9aa8ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(3).setAlpha(0.6);
    }
    await wait(this, 1500);
    this.snapshot();
    await wait(this, 400);
    await dlg.say(null, 'np.b.n1');
    await dlg.say('jigong', 'np.b.j2');
    await dlg.say('gogo', 'np.b.g2');
    dlg.hide();
    this.cameras.main.fadeOut(1600, 255, 240, 220);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('NanpingEnd'));
  }

  private snapshot(): void {
    const key = nextNpKey('lake');
    this.scene.setVisible(false, 'UI');
    this.game.renderer.snapshotArea(VIEW.x, VIEW.y, VIEW.w, VIEW.h - 60, (img) => {
      this.scene.setVisible(true, 'UI');
      if (img instanceof HTMLImageElement) {
        const add = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          npRun.photo = key;
        };
        if (img.complete) add();
        else img.onload = add;
      }
    });
  }

  // ---- frame ------------------------------------------------------------------------------------------

  update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    this.ring *= Math.exp(-dt / 1.8);
    if (this.pulling) {
      this.power = Math.min(1, this.power + dt * 0.85);
      const shake = this.power >= 1 ? Math.sin(this.time.now * 0.06) * 3 : 0;
      this.log.x = REST + PULL * this.power + shake;
      this.drawRopes();
    }
    // the power meter, only while pulling
    const m = this.meter;
    m.clear();
    if (this.active) {
      const x0 = 160;
      const x1 = 420;
      const y = 530;
      m.fillStyle(0x1a100c, 0.6);
      m.fillRoundedRect(x0 - 6, y - 10, x1 - x0 + 12, 20, 10);
      m.fillStyle(0xffd27a, 0.45);
      m.fillRect(x0 + (x1 - x0) * GOOD.lo, y - 6, (x1 - x0) * (GOOD.hi - GOOD.lo), 12);
      m.fillStyle(this.power > GOOD.hi ? 0xff7a5a : this.power >= GOOD.lo ? 0xffe08a : 0xc8d0e0, 1);
      m.fillRect(x0, y - 4, (x1 - x0) * this.power, 8);
      // the echo still ringing: wait for it to fade below the mark
      m.fillStyle(0x1a100c, 0.6);
      m.fillRoundedRect(x0 - 6, y + 22, x1 - x0 + 12, 12, 6);
      m.fillStyle(this.ring > RUSH ? 0x9aa8ff : 0x8ae0a0, 0.9);
      m.fillRect(x0, y + 25, (x1 - x0) * Math.min(1, this.ring), 6);
      m.fillStyle(0xffffff, 0.8);
      m.fillRect(x0 + (x1 - x0) * RUSH - 1, y + 22, 2, 12);
    }
    // the bell humming: soft rings round it
    const rg = this.ringG;
    rg.clear();
    if (this.ring > 0.02) {
      for (let i = 0; i < 3; i++) {
        const k = ((this.time.now / 900 + i / 3) % 1);
        rg.lineStyle(3, 0xffd8a0, this.ring * 0.5 * (1 - k));
        rg.strokeEllipse(BELL.x, BELL.y + 20, 260 + k * 200, 320 + k * 160);
      }
    }
    // waves spreading across the lake from below the tower
    const wg = this.waveG;
    wg.clear();
    const cx = VIEW.x + VIEW.w / 2;
    const cy = VIEW.y + VIEW.h - 4;
    for (const w of this.waves) {
      w.r += dt * 220;
      w.a = Math.max(0, 1 - w.r / 420);
      const pts: Phaser.Math.Vector2[] = [];
      for (let k = 0; k <= 40; k++) {
        const a = Math.PI + (k / 40) * Math.PI;
        const px = cx + Math.cos(a) * w.r * 1.5;
        const py = cy + Math.sin(a) * w.r * 0.5;
        if (px > VIEW.x && px < VIEW.x + VIEW.w && py > VIEW.horizon) pts.push(new Phaser.Math.Vector2(px, py));
      }
      if (pts.length > 1) {
        wg.lineStyle(2.5, 0xffe0b0, 0.7 * w.a);
        wg.strokePoints(pts, false, false);
      }
    }
    this.waves = this.waves.filter((w) => w.a > 0);
  }
}

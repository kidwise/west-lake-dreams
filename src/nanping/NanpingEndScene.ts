import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, wait, waitForTap } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { markVisited, getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { rng } from '../art/paint';
import { makeSeal } from '../sudi/art';
import { npRun } from './state';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: number;
}

/** Waking up on New Year's Eve: the real bell of 净慈寺 counts to 108, fireworks, and the scroll. */
export class NanpingEndScene extends Phaser.Scene {
  private sparks: Spark[] = [];
  private fw!: Phaser.GameObjects.Graphics;
  private fireworks = false;
  private nextBurst = 0;

  constructor() {
    super('NanpingEnd');
  }

  create(): void {
    markVisited('nanping');
    this.sparks = [];
    this.fireworks = false;
    void this.play();
  }

  private async play(): Promise<void> {
    await this.newYear();
    await this.scroll();
    this.invitation();
  }

  // ---- New Year's Eve -------------------------------------------------------------------------------

  private async newYear(): Promise<void> {
    music.play('morning');
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const g = this.add.graphics();
    // a cosy room, red paper-cuts in the window, a big window onto the night
    g.fillGradientStyle(0x6a3a30, 0x6a3a30, 0x3a2220, 0x3a2220, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x0c1028, 1);
    g.fillRect(380, 60, 760, 400);
    // the night outside: the city's lights, the dark hills and the lake
    const r = rng(8);
    this.fw = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const night = this.add.graphics();
    night.fillGradientStyle(0x0c1028, 0x0c1028, 0x2a2048, 0x2a2048, 1);
    night.fillRect(380, 60, 760, 400);
    for (let i = 0; i < 50; i++) {
      night.fillStyle(0xffffff, 0.3 + r() * 0.5);
      night.fillCircle(380 + r() * 760, 60 + r() * 200, 1 + r());
    }
    night.fillStyle(0x161830, 1);
    night.fillPoints([V(380, 380), V(380, 330), V(520, 300), V(660, 320), V(800, 290), V(960, 310), V(1140, 300), V(1140, 380)], true);
    night.fillStyle(0x1e2440, 1);
    night.fillRect(380, 380, 760, 80);
    for (let i = 0; i < 70; i++) {
      night.fillStyle([0xffd27a, 0xffe8b0, 0xff9a6a][i % 3], 0.85);
      night.fillRect(380 + r() * 760, 330 + r() * 120, 2 + r() * 3, 2 + r() * 3);
    }
    this.fw.setDepth(1);
    night.setDepth(0.5);
    const frame = this.add.graphics().setDepth(2);
    frame.lineStyle(12, 0x2a1810, 1);
    frame.strokeRect(374, 54, 772, 412);
    frame.lineBetween(760, 54, 760, 466);
    frame.lineBetween(374, 260, 1146, 260);
    // red paper-cut flowers on the glass, and a 福 upside down on the wall
    for (const [x, y] of [[560, 160], [960, 160]]) {
      frame.fillStyle(0xd0281e, 1);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        frame.fillEllipse(x + Math.cos(a) * 26, y + Math.sin(a) * 26, 26, 16);
      }
      frame.fillCircle(x, y, 20);
      frame.fillStyle(0x0c1028, 1);
      frame.fillCircle(x, y, 7);
    }
    frame.fillStyle(0xd0281e, 1);
    frame.fillPoints([V(200, 100), V(270, 170), V(200, 240), V(130, 170)], true);
    const fu = this.add.text(200, 170, '福', baseStyle({ fontFamily: FONT_SERIF, fontSize: '56px', color: '#ffd27a', fontStyle: 'bold' })).setOrigin(0.5).setAngle(180).setDepth(3);
    void fu;
    // a faint wallpaper pattern
    const wp = this.add.graphics().setDepth(0.2);
    for (let y = 10; y < 520; y += 36) {
      for (let x = (y / 36) % 2 ? 18 : 0; x < W; x += 36) {
        wp.fillStyle(0xc87a5a, 0.12);
        wp.fillPoints([V(x, y - 6), V(x + 6, y), V(x, y + 6), V(x - 6, y)], true);
        wp.fillStyle(0xe8b070, 0.1);
        wp.fillCircle(x, y, 1.6);
      }
    }
    // heavy red curtains, gathered at the sides of the window
    for (const [cx, s] of [[372, 1], [1148, -1]] as const) {
      for (let k = 0; k < 5; k++) {
        const x0 = cx - s * 10 + s * k * 14;
        frame.fillStyle(k % 2 ? 0x8a1a14 : 0xb02a1e, 1);
        frame.fillPoints([V(x0, 40), V(x0 + s * 16, 40), V(x0 + s * 12 + s * k * 2, 300), V(x0 + s * 20, 500), V(x0 + s * 2, 500), V(x0 - s * 4 + s * k * 2, 300)], true);
      }
      frame.fillStyle(0xe0b050, 1);
      frame.fillRect(cx + s * 20 - 18, 292, 36, 8);
    }
    frame.fillStyle(0x6a2a18, 1);
    frame.fillRect(330, 34, 860, 12);
    // a pot of narcissus (水仙) on the sill, the New Year flower
    const nx = 470;
    frame.fillStyle(0x2a5a8a, 1);
    frame.fillRoundedRect(nx - 34, 444, 68, 22, 6);
    frame.fillStyle(0xf4f4f4, 1);
    frame.fillRoundedRect(nx - 30, 446, 60, 6, 3);
    for (let k = 0; k < 7; k++) {
      frame.lineStyle(3, 0x4a8a4a, 1);
      frame.lineBetween(nx - 18 + k * 6, 446, nx - 24 + k * 8, 380 + (k % 3) * 10);
    }
    for (const [fx, fy] of [[nx - 22, 384], [nx - 4, 376], [nx + 16, 386], [nx + 26, 400]]) {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        frame.fillStyle(0xfffaf0, 1);
        frame.fillEllipse(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 8, 8);
      }
      frame.fillStyle(0xf0c040, 1);
      frame.fillCircle(fx, fy, 4);
    }
    // red lanterns
    for (const x of [300, 1220]) {
      frame.lineStyle(2, 0x2a1810, 1);
      frame.lineBetween(x, 0, x, 80);
      frame.fillStyle(0xd0281e, 1);
      frame.fillEllipse(x, 120, 70, 80);
      frame.fillStyle(0xffd27a, 1);
      frame.fillRect(x - 16, 76, 32, 8);
      frame.fillRect(x - 16, 156, 32, 8);
      frame.lineStyle(2, 0xffd27a, 1);
      frame.lineBetween(x, 164, x, 196);
      this.add.image(x, 120, 'lfGlow').setScale(2.4).setTint(0xff6a4a).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
    }
    // the table with dumplings, and me at the window
    const tb = this.add.graphics().setDepth(4);
    tb.fillStyle(0x5a2a1a, 1);
    tb.fillRect(0, 520, W, 200);
    // a red tablecloth with a gold border and a hanging fringe
    tb.fillGradientStyle(0xb8281e, 0xb8281e, 0x8a1a14, 0x8a1a14, 1);
    tb.fillRect(0, 512, W, 70);
    tb.fillStyle(0xe0b050, 1);
    tb.fillRect(0, 512, W, 4);
    tb.fillRect(0, 568, W, 3);
    for (let x = 10; x < W; x += 40) {
      tb.fillStyle(0xe0b050, 0.8);
      tb.fillPoints([V(x, 540), V(x + 8, 532), V(x + 16, 540), V(x + 8, 548)], true);
    }
    for (let x = 4; x < W; x += 8) {
      tb.lineStyle(2, 0xe0b050, 0.8);
      tb.lineBetween(x, 582, x, 592);
    }
    tb.fillStyle(0xf4f0e8, 1);
    tb.fillEllipse(240, 520, 220, 40);
    for (let k = 0; k < 9; k++) {
      tb.fillStyle(0xfaf6ec, 1);
      tb.fillEllipse(170 + (k % 5) * 34, 508 + Math.floor(k / 5) * 14, 30, 16);
      tb.lineStyle(1, 0xd8d0c0, 1);
      tb.strokeEllipse(170 + (k % 5) * 34, 508 + Math.floor(k / 5) * 14, 30, 16);
    }
    // a plate of mandarin oranges and a teapot
    for (let k = 0; k < 5; k++) {
      tb.fillStyle(0xf08a2a, 1);
      tb.fillCircle(1020 + (k % 3) * 22 + (k > 2 ? 11 : 0), 500 - (k > 2 ? 16 : 0), 13);
      tb.fillStyle(0xffc070, 0.7);
      tb.fillCircle(1016 + (k % 3) * 22 + (k > 2 ? 11 : 0), 496 - (k > 2 ? 16 : 0), 4);
    }
    tb.fillStyle(0xf4f0e8, 1);
    tb.fillEllipse(1042, 512, 110, 16);
    tb.fillStyle(0x6a3a22, 1);
    tb.fillEllipse(720, 494, 60, 44);
    tb.fillRect(746, 484, 22, 6);
    tb.fillStyle(0x8a5032, 1);
    tb.fillEllipse(720, 474, 30, 8);
    const me = this.add.graphics().setDepth(3.5);
    drawPerson(me, LOOKS.me, { facing: 1, armUp: true });
    me.setPosition(860, 516).setScale(1.2);
    this.cameras.main.fadeIn(1600, 255, 240, 220);
    await narrate(this, [{ key: 'np.w1' }, { key: 'np.w2' }], { color: '#fff0dc', y: 600, size: 26, depth: 600, hintY: 660 });
    // the countdown, in time with the bell across the lake
    const big = this.add.text(760, 260, '', baseStyle({ fontFamily: FONT_SERIF, fontSize: '96px', color: '#ffe08a', fontStyle: 'bold', stroke: '#2a1810', strokeThickness: 8 })).setOrigin(0.5).setDepth(10);
    for (const n of [105, 106, 107]) {
      big.setText(`${n}`).setScale(1.3).setAlpha(1);
      sfx.templeBell('good');
      this.tweens.add({ targets: big, scale: 1, alpha: 0.6, duration: 1400 });
      await wait(this, 1700);
    }
    big.setText('108').setScale(1.4).setAlpha(1);
    sfx.templeBell('good');
    await wait(this, 600);
    this.tweens.add({ targets: big, alpha: 0, duration: 400 });
    const hny = this.add.text(760, 250, t('np.w.hny'), baseStyle({ fontFamily: FONT_SERIF, fontSize: '64px', color: '#ffe08a', fontStyle: 'bold', stroke: '#8a1a10', strokeThickness: 8 })).setOrigin(0.5).setDepth(10).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: hny, scale: 1, alpha: 1, duration: 600, ease: 'Back.easeOut' });
    music.play('npNewYear');
    this.fireworks = true;
    this.nextBurst = 0;
    await wait(this, 1800);
    const dlg = new Dialogue(this);
    await dlg.say('mom', 'np.w.mom');
    await dlg.say('koko', 'np.w.k');
    await dlg.say('gogo', 'np.w.g');
    await dlg.say('me', 'np.w.m');
    dlg.hide();
    await narrate(this, [{ key: 'np.w3' }], { color: '#fff0dc', y: 600, size: 26, depth: 600, hintY: 660 });
    this.tweens.add({ targets: hny, alpha: 0, duration: 600 });
  }

  private burst(): void {
    const x = 440 + Math.random() * 640;
    const y = 90 + Math.random() * 150;
    const color = [0xff6a5a, 0xffd27a, 0x8ae0ff, 0xc89aff, 0x8aff9a][Math.floor(Math.random() * 5)];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      const v = 90 + Math.random() * 60;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
    }
    sfx.splash();
  }

  // ---- the 南屏晚钟 scroll ---------------------------------------------------------------------------

  private async scroll(): Promise<void> {
    this.add.rectangle(0, 0, W, H, 0x101420, 0.55).setOrigin(0).setDepth(100);
    const left = 70;
    const right = W - 70;
    const top = 110;
    const bottom = 610;
    const paper = this.add.graphics().setDepth(101);
    const rollers = [this.add.graphics().setDepth(103), this.add.graphics().setDepth(103)];
    for (const g of rollers) {
      g.fillStyle(0x6b3f26, 1);
      g.fillRoundedRect(-14, top - 24, 28, bottom - top + 48, 10);
      g.fillStyle(0x8a5a3a, 1);
      g.fillRect(-8, top - 20, 6, bottom - top + 40);
      g.fillStyle(0xd9b45a, 1);
      g.fillCircle(0, top - 24, 8);
      g.fillCircle(0, bottom + 24, 8);
      g.x = W / 2;
    }
    type Fadeable = Phaser.GameObjects.GameObject & { x: number; alpha: number; setAlpha: (a: number) => unknown; setDepth: (d: number) => unknown };
    const items: { obj: Fadeable; x: number }[] = [];
    const add = <T extends Fadeable>(obj: T, x = obj.x): T => {
      obj.setAlpha(0);
      obj.setDepth(102);
      items.push({ obj, x });
      return obj;
    };
    add(this.add.text(right - 66, top + 150, '南\n屏\n晚\n钟', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 66, top + 330, '晚钟', 50).setAngle(-4));
    add(i18nText(this, left + 36, top + 26, () => t('np.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    const px = left + 330;
    const py = top + 200;
    add(this.add.rectangle(px, py, 540, 320, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae));
    if (npRun.photo && this.textures.exists(npRun.photo)) {
      const img = this.add.image(px, py, npRun.photo);
      img.setScale(Math.min(520 / img.width, 300 / img.height));
      add(img);
    } else add(i18nText(this, px, py, () => t('np.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
    const cap: StrKey = 'np.photo.cap';
    add(i18nText(this, px, py + 186, () => t(cap), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#4a4038' }).setOrigin(0.5));

    const stats: [StrKey, () => string][] = [
      ['np.stat.well', () => t('np.stat.wellVal', { l: npRun.logs, j: npRun.junk })],
      ['np.stat.echo', () => t('np.stat.echoVal', { m: npRun.echoMiss })],
      ['np.stat.bell', () => t('np.stat.bellVal', { n: npRun.strikes, g: npRun.good })],
      ['np.stat.friends', () => t(npRun.friends ? 'np.stat.friendsVal' : 'np.stat.friendsNone', { n: npRun.friends })],
    ];


    stats.forEach(([label, value], i) => {
      const y = top + 62 + i * 80;
      add(i18nText(this, left + 680, y, () => t(label), { fontSize: '16px', color: '#6b5d52' }).setOrigin(0, 0.5), left + 760);
      add(i18nText(this, left + 680, y + 27, () => value(), { fontSize: '20px', color: '#2f2a26', fontStyle: 'bold' }).setOrigin(0, 0.5), left + 760);
    });

    sfx.blip();
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1800,
        ease: 'Cubic.easeOut',
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          const half = ((right - left) / 2) * k;
          paper.clear();
          paper.fillStyle(0xf4ead6, 1);
          paper.fillRect(W / 2 - half, top - 10, half * 2, bottom - top + 20);
          paper.lineStyle(2, 0xb8a78c, 1);
          paper.strokeRect(W / 2 - half + 12, top, half * 2 - 24, bottom - top);
          rollers[0].x = W / 2 - half;
          rollers[1].x = W / 2 + half;
          for (const it of items) {
            if (Math.abs(it.x - W / 2) < half - 10 && it.obj.alpha === 0) {
              this.tweens.add({ targets: it.obj, alpha: 1, duration: 300 });
              if (it.obj instanceof Phaser.GameObjects.Container) sfx.stamp();
            }
          }
        },
        onComplete: () => resolve(),
      });
    });
    const hint = i18nText(this, W / 2, H - 40, () => t('common.tapToContinue'), { fontSize: '18px', color: CSS.paper }).setOrigin(0.5).setDepth(110);
    await waitForTap(this);
    hint.destroy();
  }

  private invitation(): void {
    sfx.chime();
    const layer = this.add.container(0, 0).setDepth(300).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(0xf6f1e7, 0.98);
    bg.fillRoundedRect(110, 40, W - 220, H - 80, 30);
    bg.lineStyle(2, 0x2f3b3a, 0.5);
    bg.strokeRoundedRect(124, 54, W - 248, H - 108, 24);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 96, () => t('np.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '32px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 234, () => t('np.inviteBody'), {
        fontSize: '17px',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: W - 320, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    const visited = new Set(getProgress().visited);
    TEN_VIEWS.forEach((v, i) => {
      const x = W / 2 - 400 + (i % 2) * 420;
      const y = 396 + Math.floor(i / 2) * 32;
      const done = visited.has(v.id);
      const dot = this.add.graphics();
      dot.fillStyle(v.id === 'nanping' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
      dot.fillCircle(x, y, 8);
      layer.add(dot);
      layer.add(i18nText(this, x + 20, y, () => `${t(v.name)}${done ? '  ✓' : ''}`, { fontSize: '19px', color: done ? CSS.ink : '#8d887f' }).setOrigin(0, 0.5));
    });
    const again = makeButton(this, W / 2 - 160, H - 92, () => t('wake.again'), {
      width: 260,
      fill: 0xc0392b,
      stroke: 0x7b241c,
      textColor: '#fff8ee',
      depth: 310,
      onClick: () => this.leave(true),
    });
    const toTitle = makeButton(this, W / 2 + 160, H - 92, () => t('wake.toTitle'), { width: 260, depth: 310, onClick: () => this.leave(false) });
    again.container.setAlpha(0);
    toTitle.container.setAlpha(0);
    this.tweens.add({ targets: [layer, again.container, toTitle.container], alpha: 1, duration: 800 });
  }

  private leave(replay: boolean): void {
    this.cameras.main.fadeOut(700, 20, 30, 40);
    // the photo is still on screen; NanpingIntroScene clears it next time
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'NanpingIntro' : 'Title');
    });
  }

  update(_time: number, delta: number): void {
    if (!this.fw || !this.fw.active) return;
    const dt = Math.min(0.05, delta / 1000);
    if (this.fireworks && this.time.now > this.nextBurst) {
      this.burst();
      this.nextBurst = this.time.now + 500 + Math.random() * 700;
    }
    const g = this.fw;
    g.clear();
    for (const s of this.sparks) {
      s.vy += 60 * dt;
      s.vx *= 0.985;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt * 0.7;
      g.fillStyle(s.color, Math.max(0, s.life));
      g.fillCircle(s.x, s.y, 2.2);
    }
    this.sparks = this.sparks.filter((s) => s.life > 0 && s.x > 380 && s.x < 1140 && s.y < 460);
  }
}

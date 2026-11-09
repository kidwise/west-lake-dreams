import * as Phaser from 'phaser';
import { drawPanel } from '../ui/panel';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait, waitForTap } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton } from '../ui/Button';
import { Dialogue } from '../ui/Dialogue';
import { markVisited, getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { drawPerson, LOOKS } from '../art/Cyclist';
import { makeSeal } from '../sudi/art';
import { lfRun } from './state';

/** Waking up at the dinner table: a plate of crabs — and 法海, hiding in one of them. The scroll. */
export class LeifengEndScene extends Phaser.Scene {
  constructor() {
    super('LeifengEnd');
  }

  create(): void {
    markVisited('leifeng');
    void this.play();
  }

  private async play(): Promise<void> {
    await this.dinner();
    await this.scroll();
    this.invitation();
  }

  // ---- dinner ------------------------------------------------------------------------------------

  private async dinner(): Promise<void> {
    music.play('lfHome');
    const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);
    const g = this.add.graphics();
    // a warm old room: plaster wall above a wooden wainscot, a tiled floor
    g.fillGradientStyle(0x7a5a48, 0x7a5a48, 0x5a4034, 0x5a4034, 1);
    g.fillRect(0, 0, W, 470);
    g.fillStyle(0x4a2e22, 1);
    g.fillRect(0, 330, W, 140);
    g.fillStyle(0x5a3a2a, 1);
    for (let x = 20; x < W; x += 110) g.fillRect(x, 346, 90, 108);
    g.fillStyle(0x6a4430, 1);
    g.fillRect(0, 326, W, 8);
    g.fillGradientStyle(0x6a5048, 0x6a5048, 0x3a2a26, 0x3a2a26, 1);
    g.fillRect(0, 470, W, H - 470);
    g.lineStyle(1, 0x2a1a18, 0.4);
    for (let x = -600; x < W + 600; x += 80) g.lineBetween(W / 2 + (x - W / 2) * 0.5, 470, x, H);
    // the window: dusk outside, and the pagoda on its hill far away
    g.fillStyle(0x2a1a18, 1);
    g.fillRect(860, 60, 340, 240);
    g.fillGradientStyle(0x4a3a72, 0x4a3a72, 0xe8906a, 0xe8906a, 1);
    g.fillRect(872, 72, 316, 216);
    g.fillStyle(0x3a2440, 1);
    g.fillPoints([V(872, 288), V(872, 250), V(960, 236), V(1040, 248), V(1110, 240), V(1188, 256), V(1188, 288)], true);
    this.add.image(1050, 252, 'lfPagoda').setOrigin(0.5, 1).setScale(0.1).setTint(0x9a7a8a);
    const frame = this.add.graphics();
    frame.lineStyle(6, 0x2a1a18, 1);
    frame.lineBetween(1030, 66, 1030, 294);
    frame.lineBetween(866, 180, 1194, 180);
    frame.strokeRect(866, 66, 328, 228);
    // a calendar and an old wall clock
    frame.fillStyle(0xf4ece0, 1);
    frame.fillRect(120, 110, 90, 120);
    frame.fillStyle(0xc0392b, 1);
    frame.fillRect(120, 110, 90, 26);
    frame.fillStyle(0x3a2a26, 1);
    for (let i = 0; i < 20; i++) frame.fillRect(128 + (i % 5) * 16, 146 + Math.floor(i / 5) * 18, 8, 6);
    frame.fillStyle(0x5a3a22, 1);
    frame.fillRoundedRect(300, 90, 70, 150, 10);
    frame.fillStyle(0xf4ece0, 1);
    frame.fillCircle(335, 130, 24);
    frame.lineStyle(2, 0x2a1a18, 1);
    frame.lineBetween(335, 130, 335, 114);
    frame.lineBetween(335, 130, 347, 136);
    frame.fillStyle(0xd9b45a, 1);
    frame.fillCircle(335, 200, 9);
    // a warm lamp over the table
    frame.lineStyle(2, 0x2a1a18, 1);
    frame.lineBetween(620, 0, 620, 70);
    frame.fillStyle(0xe8b060, 1);
    frame.fillTriangle(560, 112, 680, 112, 620, 64);
    frame.fillStyle(0xfff0c0, 1);
    frame.fillEllipse(620, 112, 120, 10);
    this.add.image(620, 300, 'lfGlow').setScale(8).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    // the three of us behind the table
    for (const [who, x] of [['koko', 400], ['me', 620], ['gogo', 840]] as const) {
      const k = this.add.graphics();
      drawPerson(k, LOOKS[who], { facing: who === 'gogo' ? -1 : 1 });
      k.setPosition(x, 505).setScale(1.25);
    }
    // the table, in perspective, with a blue-and-white checked cloth
    const tb = this.add.graphics();
    tb.fillStyle(0xe8eef4, 1);
    tb.fillPoints([V(260, 440), V(980, 440), V(1060, 540), V(180, 540)], true);
    tb.lineStyle(2, 0x8aa8cc, 0.7);
    for (let k = 1; k < 10; k++) tb.lineBetween(260 + k * 72, 440, 180 + k * 88, 540);
    for (const y of [465, 490, 515]) {
      const f = (y - 440) / 100;
      tb.lineBetween(260 - 80 * f, y, 980 + 80 * f, y);
    }
    tb.fillStyle(0xc8d4e2, 1);
    tb.fillRect(180, 540, 880, 30);
    tb.fillStyle(0x4a2a1a, 1);
    for (const x of [210, 1020]) tb.fillRect(x, 570, 22, 150);
    // rice bowls, a dish of ginger vinegar, the plate of crabs
    for (const x of [360, 880]) {
      tb.fillStyle(0xf4f0e8, 1);
      tb.fillEllipse(x, 470, 80, 22);
      tb.fillStyle(0x4a6aa8, 1);
      tb.fillRect(x - 36, 470, 72, 3);
      tb.fillStyle(0xffffff, 1);
      tb.fillEllipse(x, 462, 66, 14);
    }
    tb.fillStyle(0xf4f0e8, 1);
    tb.fillEllipse(760, 500, 52, 16);
    tb.fillStyle(0x3a1a12, 1);
    tb.fillEllipse(760, 498, 40, 9);
    tb.fillStyle(0xf0d070, 1);
    tb.fillRect(750, 496, 8, 3);
    tb.fillRect(762, 498, 6, 2);
    tb.fillStyle(0xd8dde6, 1);
    tb.fillEllipse(620, 494, 270, 54);
    tb.fillStyle(0xffffff, 1);
    tb.fillEllipse(620, 490, 256, 46);
    tb.lineStyle(3, 0x4a6aa8, 1);
    tb.strokeEllipse(620, 490, 236, 38);
    for (const [x, y, a] of [[560, 482, -10], [680, 484, 12], [618, 470, 4]]) this.add.image(x, y, 'lfCrabCooked').setScale(0.75).setAngle(a);
    // chopsticks
    tb.lineStyle(3, 0x8a5a2a, 1);
    tb.lineBetween(420, 500, 500, 520);
    tb.lineBetween(424, 494, 504, 514);
    this.cameras.main.fadeIn(1400, 60, 30, 60);
    await narrate(this, [{ key: 'lf.w1' }, { key: 'lf.w2' }], { color: '#fff0dc', y: 250, size: 28, hintY: 310 });
    const dlg = new Dialogue(this);
    await dlg.say('gogo', 'lf.w.g1');
    dlg.hide();
    // GOGO lifts the shell — and there he is
    sfx.dig();
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.5).setOrigin(0).setAlpha(0);
    const open = this.add.image(W / 2, 290, 'lfCrabOpen').setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: shade, alpha: 1, duration: 400 });
    await tweenP(this, { targets: open, scale: 1.4, alpha: 1, duration: 600, ease: 'Back.easeOut' });
    sfx.shimmer();
    await dlg.say('gogo', 'lf.w.g2');
    await dlg.say('koko', 'lf.w.k1');
    await dlg.say('mom', 'lf.w.mom');
    await dlg.say('me', 'lf.w.m1');
    dlg.hide();
    this.tweens.add({ targets: [open, shade], alpha: 0, duration: 500 });
    await wait(this, 400);
    for (let i = 0; i < 2; i++) {
      sfx.stone(98);
      await wait(this, 1300);
    }
    await narrate(this, [{ key: 'lf.w3' }], { color: '#fff0dc', y: 250, size: 28, hintY: 310 });
  }

  // ---- the 雷峰夕照 scroll ---------------------------------------------------------------------------

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
    add(this.add.text(right - 66, top + 150, '雷\n峰\n夕\n照', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 66, top + 330, '夕照', 50).setAngle(-4));
    add(i18nText(this, left + 36, top + 26, () => t('lf.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    const px = left + 330;
    const py = top + 200;
    add(this.add.rectangle(px, py, 540, 320, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae));
    if (lfRun.photo && this.textures.exists(lfRun.photo)) {
      const img = this.add.image(px, py, lfRun.photo);
      img.setScale(Math.min(520 / img.width, 300 / img.height));
      add(img);
    } else add(i18nText(this, px, py, () => t('lf.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
    const cap: StrKey = lfRun.photoGrade ? (`lf.photo.${lfRun.photoGrade}` as StrKey) : 'lf.photo.none';
    add(i18nText(this, px, py + 186, () => t(cap), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#4a4038' }).setOrigin(0.5));

    const stats: [StrKey, () => string][] = [
      ['lf.stat.stairs', () => t('lf.stat.stairsVal', { t: lfRun.stairsTime, s: lfRun.stumbles, h: lfRun.hits })],
      ['lf.stat.race', () => t(lfRun.beatGogo ? 'lf.stat.raceWin' : 'lf.stat.raceLose')],
      ['lf.stat.bricks', () => t('lf.stat.bricksVal', { n: lfRun.bricksSaved, l: lfRun.bricksLost })],
      ['lf.stat.shoo', () => t('lf.stat.shooVal', { n: lfRun.shoos })],
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
    drawPanel(bg, 110, 40, W - 220, H - 80, 30, 0xfbf8f2, 0.98);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 96, () => t('lf.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '32px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 234, () => t('lf.inviteBody'), {
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
      dot.fillStyle(v.id === 'leifeng' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
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
    // the photo is still on screen; LeifengIntroScene clears it next time
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'LeifengIntro' : 'Title');
    });
  }

}

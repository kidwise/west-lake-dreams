import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { narrate, tweenP, wait, waitForTap } from '../ui/narrate';
import { i18nText, baseStyle } from '../ui/text';
import { makeButton } from '../ui/Button';
import { overGlobalUI } from '../ui/overlay';
import { markVisited, getProgress } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { makeSeal } from '../sudi/art';
import { Snowfall } from './art';
import { dqRun } from './state';

type G = Phaser.GameObjects.Graphics;

/** The four shapes of 张岱's snowy lake, each drawn with a brush when tapped. */
const STEPS: { key: StrKey; x: number; y: number; r: number; draw: (g: G, k: number) => void }[] = [
  {
    key: 'dq.e.s1',
    x: 560,
    y: 380,
    r: 120,
    draw: (g, k) => {
      // 长堤一痕: one long, thin stroke
      g.lineStyle(3, 0x2a2826, 0.85);
      g.lineBetween(220, 384, 220 + 680 * k, 378);
      g.lineStyle(1.2, 0x2a2826, 0.4);
      g.lineBetween(240, 389, 240 + 620 * k, 385);
    },
  },
  {
    key: 'dq.e.s2',
    x: 760,
    y: 326,
    r: 50,
    draw: (g, k) => {
      // 湖心亭一点: a dot of a pavilion on its islet
      g.fillStyle(0x2a2826, 0.9 * k);
      g.fillTriangle(744, 320, 776, 320, 760, 306);
      g.fillRect(752, 320, 16, 8);
      g.lineStyle(2, 0x2a2826, 0.6 * k);
      g.lineBetween(730, 330, 790, 330);
    },
  },
  {
    key: 'dq.e.s3',
    x: 480,
    y: 470,
    r: 50,
    draw: (g, k) => {
      // 余舟一芥: a boat no bigger than a mustard seed
      g.lineStyle(2.5, 0x2a2826, 0.9 * k);
      g.beginPath();
      g.arc(480, 456, 24, Math.PI * 0.15, Math.PI * 0.85, false);
      g.strokePath();
      g.lineBetween(458, 466, 502, 466);
    },
  },
  {
    key: 'dq.e.s4',
    x: 480,
    y: 462,
    r: 40,
    draw: (g, k) => {
      // 舟中人两三粒: two or three specks
      g.fillStyle(0x2a2826, k);
      g.fillCircle(472, 462, 2.6);
      g.fillCircle(482, 461, 2.6);
      g.fillCircle(491, 463, 2.2);
    },
  },
];

/** 湖心亭看雪, then waking up in summer: the snow scroll and the invitation. */
export class DuanqiaoEndScene extends Phaser.Scene {
  private snow: Snowfall | null = null;

  constructor() {
    super('DuanqiaoEnd');
  }

  create(): void {
    music.play('dqXiao');
    markVisited('duanqiao');
    void this.play();
  }

  private async play(): Promise<void> {
    await this.epilogue();
    this.cameras.main.fadeOut(1400, 255, 255, 255);
    await new Promise<void>((res) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => res()));
    await this.wake();
    await this.scroll();
    this.invitation();
  }

  // ---- 湖心亭看雪 -------------------------------------------------------------------------

  private async epilogue(): Promise<void> {
    const paper = this.add.graphics();
    paper.fillStyle(0xf4f1ea, 1);
    paper.fillRect(0, 0, W, H);
    this.snow = new Snowfall(this, { count: 90, depth: 50, front: 51 });
    this.snow.wind = 8;
    this.children.list.forEach((o) => {
      if (o instanceof Phaser.GameObjects.Image && o.texture.key === 'dqFlake') o.setTint(0xb8bec4);
    });
    this.cameras.main.fadeIn(1500, 20, 24, 30);
    await narrate(this, [{ key: 'dq.e.n1' }], { y: 140, size: 28, color: '#3a3632', depth: 600, hintY: 200 });
    const hint = i18nText(this, W / 2, 110, () => t('dq.e.hint'), { fontSize: '19px', color: '#8a847a' }).setOrigin(0.5).setDepth(100);
    const ink = this.add.graphics().setDepth(10);
    const ghost = this.add.graphics().setDepth(9);
    const lines: Phaser.GameObjects.Text[] = [];
    for (const [i, s] of STEPS.entries()) {
      ghost.clear();
      ghost.setAlpha(1);
      s.draw(ghost, 1);
      ghost.setAlpha(0.12);
      this.tweens.add({ targets: ghost, alpha: 0.22, yoyo: true, repeat: -1, duration: 900 });
      await this.tapNear(s.x, s.y, s.r);
      this.tweens.killTweensOf(ghost);
      ghost.clear();
      sfx.stamp();
      await new Promise<void>((resolve) => {
        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: i === 0 ? 1100 : 600,
          ease: 'Sine.easeOut',
          onUpdate: (tw) => {
            ink.clear();
            STEPS.slice(0, i).forEach((p) => p.draw(ink, 1));
            s.draw(ink, tw.getValue() ?? 0);
          },
          onComplete: () => resolve(),
        });
      });
      const txt = i18nText(this, 200 + i * 230, 590, () => t(s.key), { fontFamily: FONT_SERIF, fontSize: '24px', color: '#3a3632' }).setOrigin(0, 0.5).setDepth(100).setAlpha(0);
      this.tweens.add({ targets: txt, alpha: 1, duration: 600 });
      lines.push(txt);
    }
    hint.destroy();
    await wait(this, 900);
    this.tweens.add({ targets: lines, alpha: 0, duration: 500 });
    const full = i18nText(this, W / 2, 580, () => t('dq.e.full'), {
      fontFamily: FONT_SERIF,
      fontSize: '24px',
      color: '#2a2826',
      align: 'center',
      wordWrap: { width: W - 260, useAdvancedWrap: true },
    })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0);
    const src = i18nText(this, W / 2, 650, () => t('dq.e.src'), { fontFamily: FONT_SERIF, fontSize: '19px', color: '#6b645a' }).setOrigin(0.5).setDepth(100).setAlpha(0);
    await tweenP(this, { targets: [full, src], alpha: 1, duration: 1200 });
    await waitForTap(this);
  }

  private tapNear(x: number, y: number, r: number): Promise<void> {
    return new Promise((resolve) => {
      const on = (p: Phaser.Input.Pointer) => {
        if (overGlobalUI(p)) return;
        if (Math.hypot(p.x - x, p.y - y) < r + 30) {
          this.input.off('pointerdown', on);
          resolve();
        }
      };
      this.input.on('pointerdown', on);
    });
  }

  // ---- waking up in summer ------------------------------------------------------------------

  private async wake(): Promise<void> {
    music.play('morning');
    this.tweens.killAll();
    this.children.removeAll(true);
    this.snow = null;
    const g = this.add.graphics();
    g.fillGradientStyle(0xf6ead2, 0xf6ead2, 0xead9b9, 0xead9b9, 1);
    g.fillRect(0, 0, W, H);
    // window: blazing summer sun and green trees
    g.fillStyle(0xfff4dc, 1);
    g.fillRect(700, 80, 420, 290);
    g.fillGradientStyle(0x6fb7e8, 0x6fb7e8, 0xbfe3f5, 0xbfe3f5, 1);
    g.fillRect(714, 94, 392, 262);
    g.fillStyle(0xfff3b0, 1);
    g.fillCircle(1040, 150, 34);
    g.fillStyle(0x4f9a4a, 1);
    for (let i = 0; i < 9; i++) g.fillCircle(744 + i * 41, 330 - (i % 2) * 18, 28);
    g.lineStyle(8, 0xfff4dc, 1);
    g.lineBetween(910, 80, 910, 370);
    // the air conditioner, humming
    g.fillStyle(0xf8f8f6, 1);
    g.fillRoundedRect(160, 70, 360, 100, 18);
    g.fillStyle(0xd8dad8, 1);
    g.fillRect(180, 140, 320, 12);
    const air = this.add.graphics();
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1600,
      repeat: -1,
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 0;
        air.clear();
        air.lineStyle(2, 0xbfe3f5, 1 - k);
        for (let i = 0; i < 4; i++) air.lineBetween(210 + i * 80, 170 + k * 50, 230 + i * 80, 190 + k * 50);
      },
    });
    // bed and the phone on it
    g.fillStyle(0x8a6a50, 1);
    g.fillRect(60, 440, 600, 160);
    g.fillStyle(0xfdfaf3, 1);
    g.fillRoundedRect(90, 410, 160, 56, 20);
    g.fillStyle(0x9cc6e0, 1);
    g.fillRoundedRect(220, 420, 440, 90, 24);
    const phone = this.add.container(470, 420).setAngle(-8);
    const pg = this.add.graphics();
    pg.fillStyle(0x222428, 1);
    pg.fillRoundedRect(-46, -80, 92, 160, 14);
    pg.fillStyle(0x3a3f48, 1);
    pg.fillRoundedRect(-40, -72, 80, 144, 10);
    phone.add(pg);
    this.cameras.main.fadeIn(1200, 255, 255, 255);
    sfx.cicada();
    await narrate(this, [{ key: 'dq.w1' }, { key: 'dq.w2' }], { color: '#3a3230', y: 640, size: 28, hintY: H - 20 });
    // the phone lights up with tomorrow's forecast
    sfx.bell();
    const screen = this.add.graphics();
    screen.fillStyle(0xdfeaf6, 1);
    screen.fillRoundedRect(-40, -72, 80, 144, 10);
    screen.fillStyle(0xffffff, 1);
    screen.fillRoundedRect(-36, -40, 72, 64, 8);
    phone.add(screen);
    const snowflake = this.add.text(0, -20, '❄', baseStyle({ fontSize: '26px', color: '#5b9bd5' })).setOrigin(0.5);
    const txt = i18nText(this, 0, 10, () => t('dq.phone'), { fontSize: '11px', color: '#2f3b48', align: 'center' }).setOrigin(0.5);
    phone.add([snowflake, txt]);
    this.tweens.add({ targets: phone, scale: { from: 1, to: 1.15 }, yoyo: true, duration: 300 });
    // a big card version so the forecast can be read
    const card = this.add.container(860, 520).setAlpha(0);
    const cg = this.add.graphics();
    cg.fillStyle(0xffffff, 0.96);
    cg.fillRoundedRect(-180, -60, 360, 120, 18);
    cg.lineStyle(2, 0x5b9bd5, 1);
    cg.strokeRoundedRect(-180, -60, 360, 120, 18);
    card.add(cg);
    card.add(this.add.text(-130, 0, '❄', baseStyle({ fontSize: '54px', color: '#5b9bd5' })).setOrigin(0.5));
    card.add(i18nText(this, 30, 0, () => t('dq.phone'), { fontSize: '26px', color: '#2f3b48', align: 'center' }).setOrigin(0.5));
    this.tweens.add({ targets: card, alpha: 1, y: 500, duration: 600 });
    await narrate(this, [{ key: 'dq.w3' }], { color: '#3a3230', y: 640, size: 28, hintY: H - 20 });
  }

  // ---- the snow scroll ---------------------------------------------------------------------

  private async scroll(): Promise<void> {
    this.add.rectangle(0, 0, W, H, 0x2a2420, 0.55).setOrigin(0).setDepth(100);
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
    add(this.add.text(right - 66, top + 150, '断\n桥\n残\n雪', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 66, top + 330, '残雪', 50).setAngle(-4));
    add(i18nText(this, left + 36, top + 26, () => t('dq.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    const photo = (x: number, w: number, h: number, key: string, label: StrKey) => {
      const y = top + 60 + h / 2;
      add(this.add.rectangle(x, y, w + 16, h + 16, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae));
      if (key && this.textures.exists(key)) {
        const img = this.add.image(x, y, key);
        img.setScale(Math.min(w / img.width, h / img.height));
        add(img);
      } else add(i18nText(this, x, y, () => t('dq.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
      add(i18nText(this, x, y + h / 2 + 26, () => t(label), { fontFamily: FONT_SERIF, fontSize: '17px', color: '#4a4038' }).setOrigin(0.5));
    };
    photo(left + 200, 300, 200, dqRun.photoSnowmen, 'dq.photo.snowmen');
    photo(left + 560, 380, 200, dqRun.photoBridge, 'dq.photo.bridge');

    const stats: [StrKey, () => string][] = [
      ['dq.stat.hits', () => t('dq.stat.unitTimes', { n: dqRun.hits })],
      ['dq.stat.blocks', () => t('dq.stat.unitTimes', { n: dqRun.blocks })],
      ['dq.stat.ouch', () => t('dq.stat.unitTimes', { n: dqRun.ouch })],
      ['dq.stat.snow', () => t('dq.stat.unitScoop', { n: dqRun.snow })],
      ['dq.stat.find', () => t('dq.stat.unitSec', { n: dqRun.findTime })],
    ];
    stats.forEach(([label, value], i) => {
      const x = left + 60 + i * 180;
      const y = bottom - 100;
      add(i18nText(this, x, y, () => t(label), { fontSize: '16px', color: '#6b5d52' }).setOrigin(0, 0.5), W / 2);
      add(i18nText(this, x, y + 28, () => value(), { fontSize: '22px', color: '#2f2a26', fontStyle: 'bold' }).setOrigin(0, 0.5), W / 2);
    });
    // a sprinkle of painted snowflakes
    const dots = this.add.graphics();
    for (let i = 0; i < 40; i++) {
      dots.fillStyle(0xb8bec4, 0.6);
      dots.fillCircle(left + 30 + Math.random() * (right - left - 200), top + 20 + Math.random() * (bottom - top - 40), 1.5 + Math.random() * 2);
    }
    add(dots as never, W / 2);

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
    layer.add(i18nText(this, W / 2, 100, () => t('dq.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '34px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 232, () => t('dq.inviteBody'), {
        fontSize: '18px',
        align: 'center',
        lineSpacing: 9,
        wordWrap: { width: W - 320, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    const visited = new Set(getProgress().visited);
    TEN_VIEWS.forEach((v, i) => {
      const x = W / 2 - 400 + (i % 2) * 420;
      const y = 384 + Math.floor(i / 2) * 34;
      const done = visited.has(v.id);
      const dot = this.add.graphics();
      dot.fillStyle(v.id === 'duanqiao' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
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
    // the photos are still on screen; DuanqiaoIntroScene clears them next time
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'DuanqiaoIntro' : 'Title');
    });
  }

  update(time: number, delta: number): void {
    this.snow?.update(delta, time);
  }
}

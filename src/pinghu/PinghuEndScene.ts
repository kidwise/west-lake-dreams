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
import { hillPolygon, rng } from '../art/paint';
import { makeSeal } from '../sudi/art';
import { Shimmer } from './Shimmer';
import { phRun } from './state';

const HORIZON = 360;

/** By boat to the moon in the middle of the lake; waking up; the 秋月 scroll. */
export class PinghuEndScene extends Phaser.Scene {
  private reflection: Shimmer | null = null;
  private boat: Phaser.GameObjects.Container | null = null;
  private wake: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super('PinghuEnd');
  }

  create(): void {
    music.play('phBoat');
    markVisited('pinghu');
    void this.play();
  }

  private async play(): Promise<void> {
    await this.boatRide();
    this.cameras.main.fadeOut(1400, 255, 250, 230);
    await new Promise<void>((res) => this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => res()));
    await this.wakeUp();
    await this.scroll();
    this.invitation();
  }

  // ---- by boat to the moon -------------------------------------------------------------

  private async boatRide(): Promise<void> {
    const r = rng(77);
    const g = this.add.graphics();
    g.fillGradientStyle(0x14224a, 0x14224a, 0x3a4a7a, 0x3a4a7a, 1);
    g.fillRect(0, 0, W, HORIZON);
    g.fillGradientStyle(0x2a3a66, 0x2a3a66, 0x0c142e, 0x0c142e, 1);
    g.fillRect(0, HORIZON, W, H - HORIZON);
    for (let i = 0; i < 70; i++) this.add.image(r() * W, r() * (HORIZON - 60), 'phStar').setAlpha(0.2 + r() * 0.4);
    const hills = hillPolygon(W + 40, HORIZON - 30, 36, HORIZON + 2, 31, 14);
    g.fillStyle(0x1a2440, 1);
    g.fillPoints(hills, true);
    this.add.image(W / 2 + 120, 150, 'phHalo').setScale(3).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(W / 2 + 120, 150, 'phMoon').setScale(0.62);
    // a perfect reflection: the lake is calm
    this.reflection = new Shimmer(this, W / 2 + 120, 2 * HORIZON - 150 + 20, 'phMoon', { strips: 30 });
    this.reflection.scaleX = 0.66;
    this.reflection.scaleY = 0.5;
    this.reflection.rough = 0.05;
    this.reflection.alpha = 0.85;
    this.add.tileSprite(0, HORIZON, W, H - HORIZON, 'ripples').setOrigin(0).setAlpha(0.06);
    // our little boat, gliding towards the moon's reflection
    this.wake = this.add.graphics().setDepth(5);
    const boat = this.add.container(-200, 560).setDepth(10);
    boat.add(this.add.image(-10, -40, 'phBoatSide').setScale(0.75));
    const lamp = this.add.image(126, -62, 'phHalo').setScale(0.4).setTint(0xffb36b).setBlendMode(Phaser.BlendModes.ADD);
    boat.add(lamp);
    this.boat = boat;
    this.tweens.add({ targets: boat, x: W / 2 - 40, duration: 9000, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: boat, y: 566, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
    this.cameras.main.fadeIn(1400, 10, 16, 40);
    await narrate(this, [{ key: 'ph.e.n1' }], { y: 640, size: 28, depth: 600, hintY: H - 24 });
    await wait(this, 2500);
  }

  // ---- waking up ---------------------------------------------------------------------------

  private async wakeUp(): Promise<void> {
    music.play('morning');
    this.tweens.killAll();
    this.children.removeAll(true);
    this.reflection = null;
    this.boat = null;
    this.wake = null;
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a2f48, 0x2a2f48, 0x1e2236, 0x1e2236, 1);
    g.fillRect(0, 0, W, H);
    // the window, with the full moon in it
    g.fillStyle(0x3a4060, 1);
    g.fillRect(760, 80, 360, 280);
    g.fillGradientStyle(0x14224a, 0x14224a, 0x3a4a7a, 0x3a4a7a, 1);
    g.fillRect(774, 94, 332, 252);
    this.add.image(1010, 170, 'phHalo').setScale(1.4).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(1010, 170, 'phMoon').setScale(0.3);
    g.lineStyle(8, 0x3a4060, 1);
    g.lineBetween(940, 80, 940, 360);
    // moonlight on the floor, like frost (地上霜)
    const light = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    light.fillStyle(0xdfe8ff, 0.16);
    light.fillPoints(
      [new Phaser.Math.Vector2(774, 360), new Phaser.Math.Vector2(1106, 360), new Phaser.Math.Vector2(900, 700), new Phaser.Math.Vector2(420, 700)],
      true,
    );
    // bed, and half a mooncake on the table
    g.fillStyle(0x4a3a30, 1);
    g.fillRect(60, 430, 560, 160);
    g.fillStyle(0xcfd4e6, 1);
    g.fillRoundedRect(90, 400, 160, 56, 20);
    g.fillStyle(0x5a6a90, 1);
    g.fillRoundedRect(210, 410, 410, 90, 24);
    g.fillStyle(0x3a2e26, 1);
    g.fillRect(640, 470, 140, 120);
    const cake = this.add.graphics();
    cake.fillStyle(0xc98a3a, 1);
    cake.slice(710, 462, 34, Math.PI, Math.PI * 2, false);
    cake.fillPath();
    cake.fillStyle(0xe0a85a, 1);
    cake.slice(710, 462, 26, Math.PI, Math.PI * 2, false);
    cake.fillPath();
    cake.fillStyle(0x8a4a2a, 1);
    cake.fillRect(676, 460, 68, 4);
    this.cameras.main.fadeIn(1400, 255, 250, 230);
    await narrate(this, [{ key: 'ph.w1' }], { color: '#e8ecf6', y: 640, size: 28, hintY: H - 20 });
    const dlg = new Dialogue(this);
    await dlg.say('gogo', 'ph.w.g');
    await dlg.say('koko', 'ph.w.k');
    dlg.hide();
    await narrate(this, [{ key: 'ph.w2' }], { color: '#e8ecf6', y: 640, size: 28, hintY: H - 20 });
  }

  // ---- the 秋月 scroll ------------------------------------------------------------------------

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
    add(this.add.text(right - 66, top + 150, '平\n湖\n秋\n月', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 66, top + 330, '秋月', 50).setAngle(-4));
    add(i18nText(this, left + 36, top + 26, () => t('ph.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    // the photo of the mirror-calm lake
    const px = left + 330;
    const py = top + 200;
    add(this.add.rectangle(px, py, 540, 320, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae));
    if (phRun.photoMirror && this.textures.exists(phRun.photoMirror)) {
      const img = this.add.image(px, py, phRun.photoMirror);
      img.setScale(Math.min(520 / img.width, 300 / img.height));
      add(img);
    } else add(i18nText(this, px, py, () => t('ph.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
    add(i18nText(this, px, py + 186, () => t('ph.photo.mirror'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#4a4038' }).setOrigin(0.5));

    const stats: [StrKey, () => string][] = [
      ['ph.stat.steps', () => t('ph.stat.unitTimes', { n: phRun.turns })],
      ['ph.stat.hints', () => t('ph.stat.unitTimes', { n: phRun.hints })],
      ['ph.stat.calm', () => t('ph.stat.unitSec', { n: phRun.calmTime })],
      ['ph.stat.qin', () => t('ph.stat.qinScore', { p: phRun.perfect, g: phRun.good, m: phRun.miss })],
    ];
    stats.forEach(([label, value], i) => {
      const y = top + 62 + i * 76;
      add(i18nText(this, left + 680, y, () => t(label), { fontSize: '16px', color: '#6b5d52' }).setOrigin(0, 0.5), left + 760);
      add(i18nText(this, left + 680, y + 28, () => value(), { fontSize: '21px', color: '#2f2a26', fontStyle: 'bold' }).setOrigin(0, 0.5), left + 760);
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
    layer.add(i18nText(this, W / 2, 100, () => t('ph.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '34px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 232, () => t('ph.inviteBody'), {
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
      dot.fillStyle(v.id === 'pinghu' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
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
    // the photo is still on screen; PinghuIntroScene clears it next time
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'PinghuIntro' : 'Title');
    });
  }

  update(time: number): void {
    this.reflection?.update(time);
    if (this.boat && this.wake) {
      // a fading V of ripples behind the boat
      const g = this.wake;
      g.clear();
      for (let i = 1; i < 6; i++) {
        g.lineStyle(2, 0xdfe6f2, 0.25 - i * 0.04);
        g.lineBetween(this.boat.x - 120 - i * 40, this.boat.y + 14 - i * 6, this.boat.x - 100 - i * 40 + 20, this.boat.y + 14);
        g.lineBetween(this.boat.x - 120 - i * 40, this.boat.y + 14 + i * 6, this.boat.x - 100 - i * 40 + 20, this.boat.y + 14);
      }
    }
  }
}

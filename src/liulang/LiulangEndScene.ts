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
import { makeSeal } from '../sudi/art';
import { llRun } from './state';

/** Waking up on a spring morning — and Mum saying: shall we go and fly a kite at 柳浪闻莺? */
export class LiulangEndScene extends Phaser.Scene {
  constructor() {
    super('LiulangEnd');
  }

  create(): void {
    markVisited('liulang');
    void this.play();
  }

  private async play(): Promise<void> {
    await this.wakeUp();
    await this.scroll();
    this.invitation();
  }

  private async wakeUp(): Promise<void> {
    music.play('morning');
    this.add.image(0, 0, 'llRoom').setOrigin(0);
    const bird = this.add.image(1080, 420, 'llOriole-perch').setScale(0.4).setFlipX(true);
    this.tweens.add({ targets: bird, y: 416, yoyo: true, repeat: -1, duration: 500 });
    this.cameras.main.fadeIn(1600, 255, 255, 255);
    await narrate(this, [{ key: 'll.e1' }], { color: '#4a4038', y: 120, size: 28, hintY: 180 });
    const mom = this.add.image(-100, H + 10, 'llMom').setOrigin(0.5, 1).setScale(0.62);
    await tweenP(this, { targets: mom, x: 420, duration: 900, ease: 'Sine.easeOut' });
    const dlg = new Dialogue(this);
    await dlg.say('mom', 'll.e.mom1');
    await dlg.say('me', 'll.e.m1');
    await dlg.say('mom', 'll.e.mom2');
    dlg.hide();
    sfx.oriole([{ f: 1568, long: false }, { f: 2093, long: true }, { f: 1760, long: false }], 0.6);
    bird.setTexture('llOriole-sing');
    await wait(this, 1200);
    bird.setTexture('llOriole-perch');
    await narrate(this, [{ key: 'll.e2' }], { color: '#4a4038', y: 120, size: 28, hintY: 180 });
  }

  // ---- the 柳浪闻莺 scroll ---------------------------------------------------------------------------

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
    add(this.add.text(right - 66, top + 150, '柳\n浪\n闻\n莺', baseStyle({ fontFamily: FONT_SERIF, fontSize: '46px', color: '#2f2a26', align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    add(makeSeal(this, right - 66, top + 330, '闻莺', 50).setAngle(-4));
    add(i18nText(this, left + 36, top + 26, () => t('ll.scrollSub'), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#6b5d52' }).setOrigin(0, 0.5));

    const px = left + 330;
    const py = top + 200;
    add(this.add.rectangle(px, py, 540, 320, 0xfdfaf3).setStrokeStyle(1, 0xc9bfae));
    if (llRun.photo && this.textures.exists(llRun.photo)) {
      const img = this.add.image(px, py, llRun.photo);
      img.setScale(Math.min(520 / img.width, 300 / img.height));
      add(img);
    } else add(i18nText(this, px, py, () => t('ll.photo.none'), { fontSize: '16px', color: '#9a8f84' }).setOrigin(0.5));
    const cap: StrKey = 'll.photo.cap';
    add(i18nText(this, px, py + 186, () => t(cap), { fontFamily: FONT_SERIF, fontSize: '18px', color: '#4a4038' }).setOrigin(0.5));

    const stats: [StrKey, () => string][] = [
      ['ll.stat.whistle', () => t(llRun.whistleTries <= 1 ? 'll.stat.whistleFirst' : 'll.stat.whistleVal', { n: llRun.whistleTries })],
      ['ll.stat.orioles', () => t('ll.stat.oriolesVal', { n: llRun.orioles, f: llRun.songsFirst })],
      ['ll.stat.kite', () => t('ll.stat.kiteVal', { k: t(`ll.kite.${llRun.kite}` as StrKey), h: llRun.height })],
      ['ll.stat.rescue', () => t(llRun.rescued ? 'll.stat.rescueYes' : 'll.stat.rescueNo')],
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
    // sits below the top-right controls; content shifts down with the layer
    const layer = this.add.container(0, 22).setDepth(300).setAlpha(0);
    const bg = this.add.graphics();
    drawPanel(bg, 110, 54, W - 220, H - 108, 30, 0xfbf8f2, 0.98);
    layer.add(bg);
    layer.add(i18nText(this, W / 2, 96, () => t('ll.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '32px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 234, () => t('ll.inviteBody'), {
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
      dot.fillStyle(v.id === 'liulang' ? 0xf28fb0 : done ? 0xe0628e : 0xc9c3b8, 1);
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
    // the photo is still on screen; LiulangIntroScene clears it next time
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(replay ? 'LiulangIntro' : 'Title');
    });
  }

}

import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t } from '../core/i18n';
import { paintBackdrop, type Backdrop } from '../art/backdrop';
import { i18nText } from '../ui/text';
import { makeButton } from '../ui/Button';
import { TEN_VIEWS } from '../story/chapters';
import { getProgress, resetRun } from '../core/state';
import { rng } from '../art/paint';
import { sfx } from '../core/sfx';

export class TitleScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private leaving = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.leaving = false;
    music.play('lake');
    this.backdrop = paintBackdrop(this, { horizon: 300 });

    // a band of lotus along the bottom
    const r = rng(42);
    for (let i = 0; i < 26; i++) {
      const x = (i / 26) * (W + 100) - 40 + r() * 30;
      const key = ['leaf1', 'leaf2', 'leaf3'][i % 3];
      this.add.image(x, H + 30 + r() * 30, key).setOrigin(0.5, 1).setScale(0.8 + r() * 0.5).setDepth(10);
    }
    for (const [x, key] of [[180, 'bloomFull'], [420, 'bloomHalf'], [640, 'bud'], [880, 'bloomHalf']] as const) {
      const flower = this.add.image(x, H + 20, key).setOrigin(0.5, 1).setScale(1.1).setDepth(11);
      this.tweens.add({ targets: flower, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 2200 + x });
    }

    // title card
    const card = this.add.graphics().setDepth(20);
    card.fillStyle(0xf6f1e7, 0.82);
    card.fillRoundedRect(70, 110, 640, 300, 28);
    card.lineStyle(2, 0x2f3b3a, 0.5);
    card.strokeRoundedRect(82, 122, 616, 276, 22);

    i18nText(this, 390, 200, () => t('game.title'), {
      fontFamily: FONT_SERIF,
      fontSize: '72px',
      color: CSS.ink,
    })
      .setOrigin(0.5)
      .setDepth(21);
    i18nText(this, 390, 270, () => t('game.subtitle'), {
      fontFamily: FONT_SERIF,
      fontSize: '28px',
      color: CSS.muted,
    })
      .setOrigin(0.5)
      .setDepth(21);

    const start = makeButton(this, 390, 345, () => t('title.start'), {
      width: 260,
      height: 66,
      fontSize: 30,
      fill: 0xc0392b,
      stroke: 0x7b241c,
      textColor: '#fff8ee',
      depth: 22,
      onClick: () => this.begin(),
    });
    this.tweens.add({ targets: start.container, scale: 1.05, yoyo: true, repeat: -1, duration: 900 });
    this.input.keyboard?.once('keydown-ENTER', () => this.begin());

    this.drawViewList();
  }

  private drawViewList(): void {
    const visited = new Set(getProgress().visited);
    const x0 = 750;
    const y0 = 110;
    const pw = 480;
    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(0xf6f1e7, 0.8);
    panel.fillRoundedRect(x0, y0, pw, 480, 24);

    i18nText(this, x0 + pw / 2, y0 + 36, () => t('title.views'), {
      fontFamily: FONT_SERIF,
      fontSize: '28px',
    })
      .setOrigin(0.5)
      .setDepth(21);

    TEN_VIEWS.forEach((v, i) => {
      const y = y0 + 82 + i * 36;
      const playable = !!v.startScene;
      const done = visited.has(v.id);
      if (playable) {
        const hl = this.add.graphics().setDepth(20).setAlpha(0);
        hl.fillStyle(0xe0628e, 0.14);
        hl.fillRoundedRect(x0 + 12, y - 16, pw - 24, 32, 10);
        const zone = this.add.zone(x0 + pw / 2, y, pw - 24, 34).setInteractive({ useHandCursor: true }).setDepth(23);
        zone.on('pointerover', () => hl.setAlpha(1));
        zone.on('pointerout', () => hl.setAlpha(0));
        zone.on('pointerup', () => this.begin(v.startScene));
      }
      const dot = this.add.graphics().setDepth(21);
      dot.fillStyle(playable ? 0xe0628e : 0xb7b2a8, 1);
      dot.fillCircle(x0 + 30, y + 1, 7);
      i18nText(this, x0 + 48, y, () => t(v.name), {
        fontSize: '20px',
        color: playable ? CSS.ink : '#a8a39a',
      })
        .setOrigin(0, 0.5)
        .setDepth(21);
      if (playable) {
        i18nText(this, x0 + pw - 20, y, () => t(done ? 'title.visited' : 'title.play'), {
          fontSize: '15px',
          color: done ? '#2e8b57' : CSS.koko,
        })
          .setOrigin(1, 0.5)
          .setDepth(21);
      }
    });
    const locked = TEN_VIEWS.filter((v) => !v.startScene).length;
    i18nText(this, x0 + pw / 2, y0 + 452, () => t('title.moreSoon', { n: locked }), {
      fontSize: '16px',
      color: '#a8a39a',
    })
      .setOrigin(0.5)
      .setDepth(21);
  }

  private begin(startScene = TEN_VIEWS[0].startScene): void {
    if (this.leaving || !startScene) return;
    this.leaving = true;
    sfx.chime();
    resetRun(this.textures);
    this.cameras.main.fadeOut(900, 20, 30, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(startScene);
    });
  }

  update(time: number): void {
    this.backdrop.update(time, 0);
  }
}

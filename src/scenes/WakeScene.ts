import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t } from '../core/i18n';
import { narrate, tweenP, wait, waitForTap } from '../ui/narrate';
import { i18nText } from '../ui/text';
import { makeButton } from '../ui/Button';
import { run, markVisited, resetRun } from '../core/state';
import { TEN_VIEWS } from '../story/chapters';
import { rng } from '../art/paint';
import { sfx } from '../core/sfx';

/** "……然后梦就醒了，我起床上厕所。" Then the dream album and the invitation to Hangzhou. */
export class WakeScene extends Phaser.Scene {
  constructor() {
    super('Wake');
  }

  create(): void {
    markVisited('quyuan');
    music.play('morning');
    this.paintBedroom();
    this.cameras.main.fadeIn(1600, 255, 255, 255);
    void this.play();
  }

  private paintBedroom(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x34405a, 0x34405a, 0x4b5875, 0x4b5875, 1);
    g.fillRect(0, 0, W, H);
    // floor
    g.fillStyle(0x5a4b44, 1);
    g.fillRect(0, 560, W, H - 560);
    // window with morning light
    g.fillStyle(0xfbe9c8, 1);
    g.fillRect(820, 110, 300, 260);
    g.fillStyle(0xb9d6e6, 1);
    g.fillRect(832, 122, 276, 236);
    g.fillStyle(0xfff3d6, 1);
    g.fillCircle(1040, 200, 34);
    g.lineStyle(8, 0xfbe9c8, 1);
    g.lineBetween(970, 110, 970, 370);
    g.lineBetween(820, 240, 1120, 240);
    // curtains
    g.fillStyle(0x8e6e9c, 1);
    g.fillRect(780, 90, 60, 320);
    g.fillRect(1100, 90, 60, 320);
    // bed
    g.fillStyle(0x6d4c41, 1);
    g.fillRect(80, 420, 520, 150);
    g.fillRect(80, 330, 30, 240);
    g.fillStyle(0xf3efe6, 1);
    g.fillRoundedRect(110, 400, 140, 50, 18);
    g.fillStyle(0x7fb3d5, 1);
    g.fillRoundedRect(200, 410, 400, 80, 22);
    g.fillStyle(0x6a9fc4, 1);
    for (let x = 230; x < 590; x += 60) g.fillCircle(x, 450, 8);
    // nightstand + alarm clock
    g.fillStyle(0x795548, 1);
    g.fillRect(630, 450, 120, 120);
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(690, 420, 28);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(690, 420, 22);
    g.lineStyle(3, 0x333333, 1);
    g.lineBetween(690, 420, 690, 404);
    g.lineBetween(690, 420, 680, 430);
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(672, 396, 8);
    g.fillCircle(708, 396, 8);

    // a soft sunbeam
    const beam = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    beam.fillStyle(0xfff3d6, 0.1);
    beam.fillTriangle(832, 122, 1108, 358, 300, H);
    beam.fillTriangle(832, 122, 300, H, 60, H);
    this.tweens.add({ targets: beam, alpha: 1, duration: 3000, delay: 800 });

    // a dim veil so narration reads clearly
    this.add.rectangle(0, 0, W, H, 0x1b2738, 0.35).setOrigin(0).setName('veil');
  }

  private async play(): Promise<void> {
    await wait(this, 900);
    sfx.bell();
    await narrate(this, [{ key: 'wake.1' }, { key: 'wake.2' }, { key: 'wake.3' }]);
    await this.showAlbum();
    this.showInvitation();
  }

  private async showAlbum(): Promise<void> {
    const layer = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, W, H, 0x1b2738, 0.55).setOrigin(0);
    layer.add(shade);
    layer.add(
      i18nText(this, W / 2, 80, () => t('wake.album'), { fontFamily: FONT_SERIF, fontSize: '40px', color: CSS.paper }).setOrigin(0.5),
    );

    const photos = run.photoKeys.filter((k) => this.textures.exists(k));
    if (!photos.length) {
      layer.add(
        i18nText(this, W / 2, H / 2, () => t('wake.noPhotos'), { fontFamily: FONT_SERIF, fontSize: '28px', color: CSS.paper }).setOrigin(0.5),
      );
    }
    const r = rng(photos.length + 3);
    const cols = Math.min(5, Math.max(1, photos.length));
    const rows = Math.ceil(photos.length / 5);
    photos.forEach((key, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const inRow = row < rows - 1 ? 5 : photos.length - row * 5;
      const x = W / 2 + (col - (Math.min(cols, inRow) - 1) / 2) * 228;
      const y = (rows === 1 ? H / 2 : 270 + row * 210) - 10;
      const card = this.add.container(x, y - 40).setAlpha(0).setAngle((r() - 0.5) * 10);
      const frame = this.add.rectangle(0, 0, 206, 176, 0xfdfaf3).setStrokeStyle(1, 0xcccccc);
      const img = this.add.image(0, -12, key);
      img.setScale(190 / img.width);
      card.add([frame, img]);
      layer.add(card);
      this.tweens.add({ targets: card, y, alpha: 1, duration: 500, delay: 200 + i * 160, ease: 'Back.easeOut' });
    });

    await wait(this, 600 + photos.length * 160);
    const hint = i18nText(this, W / 2, H - 50, () => t('common.tapToContinue'), { fontSize: '18px', color: CSS.paper }).setOrigin(0.5);
    layer.add(hint);
    await waitForTap(this);
    await tweenP(this, { targets: layer, alpha: 0, duration: 500 });
    layer.destroy();
  }

  private showInvitation(): void {
    sfx.chime();
    const layer = this.add.container(0, 0).setDepth(200).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(0xf6f1e7, 0.97);
    bg.fillRoundedRect(110, 50, W - 220, H - 100, 30);
    bg.lineStyle(2, 0x2f3b3a, 0.5);
    bg.strokeRoundedRect(124, 64, W - 248, H - 128, 24);
    layer.add(bg);

    layer.add(
      i18nText(this, W / 2, 120, () => t('wake.inviteTitle'), { fontFamily: FONT_SERIF, fontSize: '44px', color: CSS.me }).setOrigin(0.5),
    );
    layer.add(
      i18nText(this, W / 2, 205, () => t('wake.inviteBody'), {
        fontSize: '23px',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: W - 340, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );

    TEN_VIEWS.forEach((v, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = W / 2 - 400 + col * 420;
      const y = 300 + row * 42;
      const done = v.id === 'quyuan';
      const dot = this.add.graphics();
      dot.fillStyle(done ? 0xe0628e : 0xc9c3b8, 1);
      dot.fillCircle(x, y, 8);
      layer.add(dot);
      layer.add(
        i18nText(this, x + 20, y, () => `${t(v.name)}${done ? '  ✓' : ''}`, {
          fontSize: '20px',
          color: done ? CSS.ink : '#8d887f',
        }).setOrigin(0, 0.5),
      );
    });

    const again = makeButton(this, W / 2 - 160, H - 110, () => t('wake.again'), {
      width: 260,
      fill: 0xc0392b,
      stroke: 0x7b241c,
      textColor: '#fff8ee',
      depth: 210,
      onClick: () => this.leave('Title', true),
    });
    const toTitle = makeButton(this, W / 2 + 160, H - 110, () => t('wake.toTitle'), {
      width: 260,
      depth: 210,
      onClick: () => this.leave('Title', false),
    });
    again.container.setAlpha(0);
    toTitle.container.setAlpha(0);
    this.tweens.add({ targets: [layer, again.container, toTitle.container], alpha: 1, duration: 800 });
  }

  private leave(scene: string, replay: boolean): void {
    this.cameras.main.fadeOut(700, 20, 30, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (replay) {
        resetRun(this.textures);
        this.scene.start('Intro');
      }
      else this.scene.start(scene);
    });
  }
}

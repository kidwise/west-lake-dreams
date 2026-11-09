import * as Phaser from 'phaser';
import { drawPanel } from '../ui/panel';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, getLang, type StrKey } from '../core/i18n';
import { sfx } from '../core/sfx';
import { i18nText } from '../ui/text';
import { makeButton } from '../ui/Button';
import { overGlobalUI } from '../ui/overlay';
import { TEN_VIEWS } from '../story/chapters';
import { makeSeal } from '../sudi/art';
import { generatePanorama, PANO, STATIONS } from '../art/tenPanorama';

const TOP = 86;
const PAN_MS = 34000;

/** 西湖十景全图: unlocked once all ten dreams are dreamt — a long handscroll of the whole lake. */
export class TenScenesScene extends Phaser.Scene {
  private auto = true;
  private dragX: number | null = null;
  private ended = false;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  constructor() {
    super('TenScenes');
  }

  create(): void {
    music.play('llScroll');
    this.auto = true;
    this.dragX = null;
    this.ended = false;
    generatePanorama(this);
    // a dark wooden table under the scroll
    const bg = this.add.graphics().setScrollFactor(0);
    bg.fillGradientStyle(0x3a2a20, 0x3a2a20, 0x1e1410, 0x1e1410, 1);
    bg.fillRect(0, 0, W, H);
    this.add.image(0, TOP, 'tenPanorama').setOrigin(0);
    // each scene's title, seal and a line about the dream
    STATIONS.forEach((s) => {
      const view = TEN_VIEWS.find((v) => v.id === s.id);
      if (!view) return;
      const zh = () => getLang() === 'zh';
      const title = i18nText(this, s.x + 120, TOP + 46, () => (zh() ? Array.from(t(view.name)).join('\n') : t(view.name)), {
        fontFamily: FONT_SERIF,
        fontSize: '26px',
        color: '#2f2a26',
        align: 'center',
        lineSpacing: 2,
        wordWrap: { width: 150, useAdvancedWrap: true },
      }).setOrigin(0.5, 0);
      void title;
      // the seal gives each scene's place in the traditional list of the Ten Scenes
      const rank = TEN_VIEWS.findIndex((v) => v.id === s.id);
      makeSeal(this, s.x + 120, TOP + 200, ['第一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九', '第十'][rank], 34).setAngle(-4);
      i18nText(this, s.x, TOP + PANO.h - 40, () => t(`ten.cap.${s.id}` as StrKey), {
        fontFamily: FONT_SERIF,
        fontSize: '17px',
        color: '#4a4038',
        backgroundColor: '#f4ead4cc',
        padding: { x: 8, y: 4 },
        align: 'center',
        wordWrap: { width: 300, useAdvancedWrap: true },
      }).setOrigin(0.5, 1);
    });
    // the scroll's wooden rollers at the edges of the view
    const rollers = this.add.graphics().setScrollFactor(0).setDepth(20);
    for (const x of [14, W - 14]) {
      rollers.fillStyle(0x6b3f26, 1);
      rollers.fillRoundedRect(x - 16, TOP - 26, 32, PANO.h + 52, 12);
      rollers.fillStyle(0x8a5a3a, 1);
      rollers.fillRect(x - 8, TOP - 20, 6, PANO.h + 40);
      rollers.fillStyle(0xd9b45a, 1);
      rollers.fillCircle(x, TOP - 26, 10);
      rollers.fillCircle(x, TOP + PANO.h + 26, 10);
    }
    i18nText(this, W / 2, 34, () => t('ten.title'), { fontFamily: FONT_SERIF, fontSize: '28px', color: '#f4e6c8' }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
    i18nText(this, W / 2, H - 30, () => t('ten.hint'), { fontSize: '16px', color: '#c8b898' }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
    makeButton(this, W - 130, H - 34, () => t('wake.toTitle'), { width: 180, height: 46, fontSize: 18, fixed: true, depth: 40, onClick: () => this.leave() });
    this.cameras.main.setBounds(0, 0, PANO.w, H);
    this.cameras.main.setScroll(0, 0);
    // drag or use the arrow keys to look along the scroll
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p) || p.y > H - 60) return;
      this.auto = false;
      this.dragX = p.x;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragX === null || !p.isDown) return;
      this.cameras.main.scrollX -= p.x - this.dragX;
      this.dragX = p.x;
    });
    this.input.on('pointerup', () => (this.dragX = null));
    if (this.input.keyboard) this.keys = this.input.keyboard.addKeys('LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    this.cameras.main.fadeIn(1400, 30, 20, 16);
    sfx.chime();
  }

  update(_time: number, delta: number): void {
    const cam = this.cameras.main;
    const left = this.keys.LEFT?.isDown;
    const right = this.keys.RIGHT?.isDown;
    if (left || right) {
      this.auto = false;
      cam.scrollX += (right ? 1 : -1) * delta * 0.6;
    } else if (this.auto) {
      cam.scrollX += (delta / PAN_MS) * (PANO.w - W);
    }
    if (!this.ended && cam.scrollX >= PANO.w - W - 2) this.finale();
  }

  /** At the end of the scroll: a big seal, and a word of thanks. */
  private finale(): void {
    this.ended = true;
    sfx.stamp();
    const layer = this.add.container(0, 0).setScrollFactor(0).setDepth(50).setAlpha(0);
    const bg = this.add.graphics();
    drawPanel(bg, W / 2 - 330, 150, 660, 380, 26, 0xfbf8f2, 0.95);
    layer.add(bg);
    layer.add(makeSeal(this, W / 2, 240, '十景', 80).setAngle(-5));
    layer.add(i18nText(this, W / 2, 330, () => t('ten.end'), { fontFamily: FONT_SERIF, fontSize: '30px', color: CSS.me }).setOrigin(0.5));
    layer.add(
      i18nText(this, W / 2, 420, () => t('ten.endBody'), {
        fontSize: '18px',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 560, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    // a close button, and a note that a tap anywhere puts the card away
    const close = this.add.container(W / 2 + 300, 182);
    const cg = this.add.graphics();
    cg.fillStyle(0x2f3b3a, 0.12);
    cg.fillCircle(0, 0, 20);
    cg.lineStyle(2.5, 0x2f3b3a, 0.8);
    cg.lineBetween(-7, -7, 7, 7);
    cg.lineBetween(-7, 7, 7, -7);
    close.add(cg);
    layer.add(close);
    layer.add(i18nText(this, W / 2, 500, () => t('ten.dismiss'), { fontSize: '15px', color: '#8a857c' }).setOrigin(0.5));
    this.tweens.add({ targets: layer, alpha: 1, duration: 1000 });
    let gone = false;
    const dismiss = () => {
      if (gone) return;
      gone = true;
      this.input.off('pointerdown', onTap);
      this.input.keyboard?.off('keydown-SPACE', dismiss);
      this.input.keyboard?.off('keydown-ESC', dismiss);
      this.input.keyboard?.off('keydown-ENTER', dismiss);
      sfx.blip();
      this.tweens.killTweensOf(layer);
      this.tweens.add({ targets: layer, alpha: 0, duration: 400, onComplete: () => layer.destroy(true) });
    };
    const onTap = (p: Phaser.Input.Pointer) => {
      if (overGlobalUI(p) || p.y > H - 60) return;
      dismiss();
    };
    // wait a beat so the drag that reached the end doesn't close it at once
    this.time.delayedCall(600, () => {
      if (gone) return;
      this.input.on('pointerdown', onTap);
      this.input.keyboard?.on('keydown-SPACE', dismiss);
      this.input.keyboard?.on('keydown-ESC', dismiss);
      this.input.keyboard?.on('keydown-ENTER', dismiss);
    });
  }

  private leave(): void {
    this.cameras.main.fadeOut(800, 20, 30, 40);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Title'));
  }
}

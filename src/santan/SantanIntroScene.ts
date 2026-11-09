import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { narrate, tweenP, wait } from '../ui/narrate';
import { i18nText } from '../ui/text';
import { makeButton } from '../ui/Button';
import { paintBackdrop } from '../art/backdrop';
import { createDreamNote, VIGNETTE_H } from './art';
import { resetSantan } from './state';
import { sfx } from '../core/sfx';

const PARTS: { id: 'near' | 'pair' | 'far'; lx: number; key: StrKey; label: StrKey }[] = [
  { id: 'near', lx: -220, key: 'santan.obsNear', label: 'santan.part.near' },
  { id: 'pair', lx: 0, key: 'santan.obsPair', label: 'santan.part.pair' },
  { id: 'far', lx: 220, key: 'santan.obsFar', label: 'santan.part.far' },
];

/** 少年之梦: Grandma's one-yuan note, and studying the picture on its back. */
export class SantanIntroScene extends Phaser.Scene {
  constructor() {
    super('SantanIntro');
  }

  create(): void {
    music.play('moonlake');
    resetSantan(this.textures);
    paintBackdrop(this, { horizon: 330, skyTop: 0x4f6496, skyBottom: 0xf8d9a6 });
    this.add.rectangle(0, 0, W, H, 0x1b2236, 0.62).setOrigin(0).setDepth(50);

    // a little note drifting down like a falling leaf
    const note = createDreamNote(this, W / 2, -120, 0.16).setDepth(60).setAngle(-20);
    this.tweens.add({ targets: note, y: H * 0.3, duration: 5200, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: note, angle: 18, x: W / 2 + 60, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.easeInOut' });

    this.cameras.main.fadeIn(1200, 20, 30, 40);
    void this.play(note);
  }

  private async play(floating: Phaser.GameObjects.Container): Promise<void> {
    await narrate(this, [{ key: 'santan.i1' }, { key: 'santan.i2' }, { key: 'santan.i3' }], { y: H - 190, depth: 70, size: 32 });
    // the note flips up close
    this.tweens.killTweensOf(floating);
    await tweenP(this, { targets: floating, x: W / 2, y: 250, angle: 0, scale: 0.72, duration: 900, ease: 'Cubic.easeInOut' });
    sfx.blip();
    await narrate(this, [{ key: 'santan.i4' }, { key: 'santan.i5' }], { y: H - 135, depth: 70, size: 28, hintY: H - 30 });
    await this.observe(floating);
  }

  /** Step 1 of the puzzle: study the note and tap its three scenes. */
  private async observe(note: Phaser.GameObjects.Container): Promise<void> {
    const scale = 0.9;
    const nx = W / 2;
    const ny = H / 2 - 40;
    await tweenP(this, { targets: note, y: ny, scale, duration: 500 });
    this.observing = true;

    const title = i18nText(this, W / 2, 36, () => t('santan.obsTitle'), { fontFamily: FONT_SERIF, fontSize: '32px', color: CSS.paper })
      .setOrigin(0.5)
      .setDepth(80);
    const hint = i18nText(this, W / 2, 76, () => t('santan.obsHint'), { fontSize: '19px', color: '#e6dcc8' })
      .setOrigin(0.5)
      .setDepth(80);
    void title;
    void hint;

    const found = new Set<string>();
    const captions: Phaser.GameObjects.Text[] = [];
    const side = (VIGNETTE_H - 8) * scale;

    await new Promise<void>((resolve) => {
      PARTS.forEach((part, i) => {
        const x = nx + part.lx * scale;
        const ring = this.add.graphics().setDepth(81).setPosition(x, ny);
        const drawRing = (done: boolean) => {
          ring.clear();
          ring.lineStyle(done ? 4 : 3, done ? 0xe0628e : 0xfff3c4, done ? 1 : 0.9);
          ring.strokeRoundedRect(-side / 2, -side / 2, side, side, 14);
        };
        drawRing(false);
        const pulse = this.tweens.add({ targets: ring, alpha: 0.35, yoyo: true, repeat: -1, duration: 700 });
        const tag = i18nText(this, x, ny - side / 2 - 18, () => `${i + 1}. ${t(part.label)}`, {
          fontSize: '20px',
          color: '#fff3c4',
          backgroundColor: '#2f3b3acc',
          padding: { x: 10, y: 3 },
        })
          .setOrigin(0.5)
          .setDepth(82);
        void tag;

        const pick = () => {
          if (found.has(part.id)) return;
          found.add(part.id);
          sfx.bell();
          pulse.stop();
          ring.setAlpha(1);
          drawRing(true);
          const cap = i18nText(this, W / 2, ny + 230 * scale + 16 + captions.length * 30, () => `✓ ${t(part.key)}`, {
            fontSize: '18px',
            color: '#fff8ee',
            wordWrap: { width: W - 160, useAdvancedWrap: true },
          })
            .setOrigin(0.5, 0)
            .setDepth(82)
            .setAlpha(0);
          captions.push(cap);
          this.tweens.add({ targets: cap, alpha: 1, duration: 400 });
          if (found.size === PARTS.length) resolve();
        };
        const zone = this.add.zone(x, ny, side, side).setInteractive({ useHandCursor: true }).setDepth(83);
        zone.on('pointerdown', pick);
        this.input.keyboard?.on(`keydown-${['ONE', 'TWO', 'THREE'][i]}`, pick);
      });
    });

    await wait(this, 600);
    makeButton(this, W / 2, H - 40, () => t('santan.obsGo'), {
      width: 260,
      height: 58,
      fill: 0xc0392b,
      stroke: 0x7b241c,
      textColor: '#fff8ee',
      depth: 90,
      onClick: () => this.leave(),
    });
    this.input.keyboard?.once('keydown-ENTER', () => this.leave());
  }

  private leaving = false;
  /** True once the note can be studied (used by automated play-tests). */
  observing = false;

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    sfx.chime();
    this.cameras.main.fadeOut(900, 248, 217, 166);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('SantanBoat'));
  }

  init(): void {
    this.leaving = false;
    this.observing = false;
  }
}

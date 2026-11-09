import * as Phaser from 'phaser';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, type StrKey } from '../core/i18n';
import { i18nText } from './text';
import { overGlobalUI } from './overlay';

export interface Page {
  key: StrKey;
  /** Optional smaller line under the main text (e.g. a poem's author). */
  sub?: StrKey;
  poem?: boolean;
}

/** Wait for a click / tap / Space / Enter (ignoring the language toggle). */
export function waitForTap(scene: Phaser.Scene): Promise<void> {
  return new Promise((resolve) => {
    const kb = scene.input.keyboard;
    const finish = () => {
      scene.input.off('pointerdown', onPointer);
      kb?.off('keydown-SPACE', finish);
      kb?.off('keydown-ENTER', finish);
      resolve();
    };
    const onPointer = (p: Phaser.Input.Pointer) => {
      if (!overGlobalUI(p)) finish();
    };
    scene.input.on('pointerdown', onPointer);
    kb?.on('keydown-SPACE', finish);
    kb?.on('keydown-ENTER', finish);
  });
}

export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => scene.time.delayedCall(ms, resolve));
}

export function tweenP(scene: Phaser.Scene, config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((resolve) => scene.tweens.add({ ...config, onComplete: () => resolve() }));
}

/**
 * Show full-screen narration pages one by one, centred, with a fade.
 * The text is re-translated live if the player switches language.
 */
export async function narrate(
  scene: Phaser.Scene,
  pages: Page[],
  opts: { color?: string; y?: number; depth?: number } = {},
): Promise<void> {
  const color = opts.color ?? CSS.paper;
  const y = opts.y ?? H / 2 - 20;
  const hint = i18nText(scene, W / 2, H - 56, () => t('common.tapToContinue'), {
    fontSize: '18px',
    color,
  })
    .setOrigin(0.5)
    .setAlpha(0)
    .setScrollFactor(0)
    .setDepth(opts.depth ?? 500);

  for (const page of pages) {
    const main = i18nText(scene, W / 2, y, () => t(page.key), {
      fontFamily: FONT_SERIF,
      fontSize: page.poem ? '34px' : '36px',
      color,
      align: 'center',
      lineSpacing: page.poem ? 22 : 14,
      wordWrap: { width: W - 260, useAdvancedWrap: true },
    })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(opts.depth ?? 500);
    const sub = page.sub
      ? i18nText(scene, W / 2, 0, () => t(page.sub as StrKey), {
          fontFamily: FONT_SERIF,
          fontSize: '22px',
          color,
        })
          .setOrigin(0.5)
          .setAlpha(0)
          .setScrollFactor(0)
          .setDepth(opts.depth ?? 500)
      : null;
    const placeSub = () => sub?.setY(main.y + main.height / 2 + 40);
    placeSub();

    const targets = sub ? [main, sub] : [main];
    await tweenP(scene, { targets, alpha: 1, duration: 700 });
    scene.tweens.add({ targets: hint, alpha: 0.7, duration: 400 });
    await waitForTap(scene);
    await tweenP(scene, { targets, alpha: 0, duration: 400 });
    main.destroy();
    sub?.destroy();
  }
  hint.destroy();
}

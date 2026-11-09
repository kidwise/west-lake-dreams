import * as Phaser from 'phaser';
import { t, toggleLang } from '../core/i18n';
import { makeButton } from '../ui/Button';
import { LANG_BTN, MUSIC_BTN } from '../ui/overlay';
import { sfx } from '../core/sfx';
import { music } from '../core/music';

/** Overlay scene that stays on top of every other scene: music and 中文 / EN toggles. */
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create(): void {
    makeButton(this, LANG_BTN.x, LANG_BTN.y, () => t('lang.toggle'), {
      width: LANG_BTN.w,
      height: LANG_BTN.h,
      fontSize: 22,
      fillAlpha: 0.85,
      onClick: () => {
        sfx.blip();
        toggleLang();
      },
    });
    const musicBtn = makeButton(this, MUSIC_BTN.x, MUSIC_BTN.y, () => t(music.isMuted() ? 'music.off' : 'music.on'), {
      width: MUSIC_BTN.w,
      height: MUSIC_BTN.h,
      fontSize: 20,
      fillAlpha: 0.85,
      onClick: () => {
        music.toggleMute();
        musicBtn.refresh();
        musicBtn.container.setAlpha(music.isMuted() ? 0.7 : 1);
      },
    });
    musicBtn.container.setAlpha(music.isMuted() ? 0.7 : 1);
  }
}

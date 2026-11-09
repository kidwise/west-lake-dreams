import * as Phaser from 'phaser';
import { drawPanel } from '../ui/panel';
import { W, H, FONT_SERIF, CSS } from '../core/config';
import { t, toggleLang } from '../core/i18n';
import { makeButton, type Button } from '../ui/Button';
import { i18nText } from '../ui/text';
import { LANG_BTN, MUSIC_BTN, HOME_BTN, setHomeShown } from '../ui/overlay';
import { sfx } from '../core/sfx';
import { music } from '../core/music';

/** Scenes where the Home button makes no sense (already home, or still loading). */
const NO_HOME = new Set(['Title', 'Boot', 'UI']);

/**
 * Overlay scene that stays on top of every other scene: the music and 中文 / EN
 * toggles, and — inside a chapter — a Home button that asks before leaving.
 */
export class UIScene extends Phaser.Scene {
  private home!: Button;
  private modal: Phaser.GameObjects.Container | null = null;
  private modalButtons: Button[] = [];
  private paused: string[] = [];

  constructor() {
    super('UI');
  }

  create(): void {
    // compact, icon-style controls in the corner
    makeButton(this, LANG_BTN.x, LANG_BTN.y, () => t('lang.toggle'), {
      width: LANG_BTN.w,
      height: LANG_BTN.h,
      fontSize: 18,
      fillAlpha: 0.82,
      depth: 200,
      onClick: () => {
        sfx.blip();
        toggleLang();
      },
    });
    const musicBtn = makeButton(this, MUSIC_BTN.x, MUSIC_BTN.y, () => '', {
      width: MUSIC_BTN.w,
      height: MUSIC_BTN.h,
      fillAlpha: 0.82,
      depth: 200,
      onClick: () => {
        music.toggleMute();
        drawNote();
      },
    });
    // a music note; struck through when muted
    const note = this.add.graphics();
    const drawNote = () => {
      const muted = music.isMuted();
      note.clear();
      note.fillStyle(0x2f3b3a, muted ? 0.45 : 1);
      note.fillEllipse(-6, 8, 10, 8);
      note.fillEllipse(8, 5, 10, 8);
      note.fillRect(-2, -10, 2.6, 18);
      note.fillRect(12, -13, 2.6, 18);
      note.fillPoints([new Phaser.Math.Vector2(-2, -10), new Phaser.Math.Vector2(14.6, -13), new Phaser.Math.Vector2(14.6, -8), new Phaser.Math.Vector2(-2, -5)], true);
      if (muted) {
        note.lineStyle(2.6, 0xc0392b, 1);
        note.lineBetween(-12, 12, 14, -14);
      }
    };
    drawNote();
    musicBtn.container.add(note);
    // a little house icon instead of a word
    this.home = makeButton(this, HOME_BTN.x, HOME_BTN.y, () => '', {
      width: HOME_BTN.w,
      height: HOME_BTN.h,
      fillAlpha: 0.82,
      onClick: () => this.ask(),
    });
    const icon = this.add.graphics();
    icon.fillStyle(0x2f3b3a, 1);
    icon.fillTriangle(-13, -1, 13, -1, 0, -13);
    icon.fillRect(-9, -2, 18, 14);
    icon.fillStyle(0xf6f1e7, 1);
    icon.fillRoundedRect(-3, 3, 6, 9, { tl: 3, tr: 3, bl: 0, br: 0 });
    icon.fillStyle(0x2f3b3a, 1);
    icon.fillRect(6, -12, 4, 7);
    this.home.container.add(icon);
    this.input.keyboard?.on('keydown-ESC', () => (this.modal ? this.close() : this.inChapter() && this.ask()));
  }

  /** The game scenes currently running (or paused by us), not counting this overlay. */
  private gameScenes(): Phaser.Scene[] {
    return this.game.scene.getScenes(false).filter((s) => s.sys.settings.key !== 'UI' && (s.sys.isActive() || s.sys.isPaused()));
  }

  private inChapter(): boolean {
    const running = this.gameScenes();
    return running.length > 0 && running.every((s) => !NO_HOME.has(s.sys.settings.key));
  }

  /** Pause the game and ask whether to leave this dream. */
  private ask(): void {
    if (this.modal) return;
    sfx.blip();
    this.paused = [];
    for (const s of this.gameScenes()) {
      if (s.sys.isActive()) {
        s.scene.pause();
        this.paused.push(s.sys.settings.key);
      }
    }
    const m = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, W, H, 0x101418, 0.55).setOrigin(0).setInteractive();
    m.add(shade);
    const g = this.add.graphics();
    drawPanel(g, W / 2 - 300, H / 2 - 150, 600, 300, 26, 0xfbf8f2, 0.98);
    m.add(g);
    m.add(i18nText(this, W / 2, H / 2 - 74, () => t('home.ask'), { fontFamily: FONT_SERIF, fontSize: '32px', color: CSS.ink }).setOrigin(0.5));
    m.add(
      i18nText(this, W / 2, H / 2 - 18, () => t('home.note'), {
        fontSize: '19px',
        color: CSS.muted,
        align: 'center',
        wordWrap: { width: 520, useAdvancedWrap: true },
      }).setOrigin(0.5),
    );
    this.modal = m;
    const stay = makeButton(this, W / 2 - 130, H / 2 + 76, () => t('home.stay'), { width: 220, depth: 101, onClick: () => this.close() });
    const leave = makeButton(this, W / 2 + 130, H / 2 + 76, () => t('home.leave'), {
      width: 220,
      depth: 101,
      fill: 0xc0392b,
      stroke: 0x7b241c,
      textColor: '#fff8ee',
      onClick: () => this.leave(),
    });
    this.modalButtons = [stay, leave];
  }

  private close(): void {
    sfx.blip();
    this.modal?.destroy(true);
    this.modal = null;
    for (const b of this.modalButtons) b.destroy();
    this.modalButtons = [];
    for (const key of this.paused) if (this.game.scene.isPaused(key)) this.game.scene.resume(key);
    this.paused = [];
  }

  /** Stop the chapter and go back to the title screen. */
  private leave(): void {
    this.modal?.destroy(true);
    this.modal = null;
    for (const b of this.modalButtons) b.destroy();
    this.modalButtons = [];
    this.paused = [];
    for (const s of this.gameScenes()) this.game.scene.stop(s.sys.settings.key);
    // a scene may have hidden this overlay for a photo
    this.scene.setVisible(true);
    this.game.scene.start('Title');
  }

  update(): void {
    const show = this.inChapter() && !this.modal;
    this.home.container.setVisible(show);
    this.home.zone.setVisible(show);
    if (show) this.home.zone.setInteractive();
    else this.home.zone.disableInteractive();
    setHomeShown(show);
  }
}
